import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { object, z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph } from "@langchain/langgraph";
import { MemorySaver, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { callAutomationApi, createDynamicSchema } from "./tools";
import { retrieverChain } from "./chain";
import { sys_message } from "./prompts";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

const tools = [callAutomationApi];
const toolNode = new ToolNode(tools);

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
  maxTokens: -1,
  maxRetries: 2,
});

const llm_with_tools = llm.bindTools(tools);
function shouldContinue(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user)
  return "__end__";
}

async function preparePrompt(state: typeof StateAnnotation.State) {
  return {
    messages: [
      new SystemMessage(
        (await retrieverChain(state["messages"][0].content.toString())).value,
      ),
    ],
  };
}

async function call_model(state: typeof StateAnnotation.State) {
  return {
    messages: [await llm_with_tools.invoke(state["messages"])],
  };
}

function callStructuredOutputModel(
  output: Array<ToolMessage | HumanMessage | AIMessage | SystemMessage>,
) {
  const jsonSchema = createDynamicSchema(output);
  const structuredLlm = llm.withStructuredOutput(jsonSchema);

  // Check if the last message is not a ToolMessage
  if (!(output[output.length - 1] instanceof ToolMessage)) {
    // Return content of the last message if it's not a ToolMessage
    return output[output.length - 1].content;
  }

  // Invoke structured output model with system prompt and messages
  return structuredLlm.invoke([sys_message, ...output]);
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("agent", call_model)
  .addNode("tools", toolNode)
  .addNode("preparePrompt", preparePrompt)
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("__start__", "preparePrompt")
  .addEdge("preparePrompt", "agent")
  .addEdge("tools", "__end__");

const app = workflow.compile();

export const agent = async (query: string): Promise<{}> => {
  const output = await app.invoke({
    messages: [new HumanMessage(query)],
  });
  //   console.log("Output: ", output);
  const structuredOutput = await callStructuredOutputModel(output["messages"]);
  //   console.log("Structured Output: ", structuredOutput);
  return structuredOutput;
};
