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
import { ChatGroq } from "@langchain/groq";
import {
  data_store_sys_prompt,
  intent_sys_prompt,
  sys_message,
} from "./prompts";
import { dataStoreSchema, intentClassificationSchema } from "./utils/helper";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  firstName: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  lastName: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  intent: Annotation<string>,
});

const tools = [callAutomationApi];
const toolNode = new ToolNode(tools);

const llm = new ChatGroq({
  model: "llama-3.1-70b-versatile",
  temperature: 0,
  maxTokens: undefined,
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

function conditionalNode(state: typeof StateAnnotation.State) {
  if (state.intent === "automation") {
    return "automationPreparePrompt";
  } else {
    return "data-store";
  }
}

async function automationPreparePrompt(state: typeof StateAnnotation.State) {
  // console.log(state);
  return {
    messages: [
      new SystemMessage(
        (
          await retrieverChain(
            state["messages"][state["messages"].length - 1].content.toString(),
            state.firstName,
            state.lastName,
          )
        ).value,
      ),
    ],
  };
}

async function call_model(state: typeof StateAnnotation.State) {
  // console.log(state);
  return {
    messages: [await llm_with_tools.invoke(state["messages"])],
  };
}

async function setUserInfo(state: typeof StateAnnotation.State) {
  const { query, firstName, lastName } = JSON.parse(
    state["messages"][0].content.toString(),
  );
  return {
    messages: new HumanMessage(query),
    firstName,
    lastName,
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

async function intentClassification(state: typeof StateAnnotation.State) {
  const llm = new ChatGroq({
    model: "llama-3.1-70b-versatile",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
  });

  const structuredLlm = llm.withStructuredOutput(intentClassificationSchema);

  const result = await structuredLlm.invoke([
    intent_sys_prompt,
    ...state["messages"],
  ]);
  return {
    intent: result.intent,
  };
}

async function dataStoreModel(state: typeof StateAnnotation.State) {
  const structuredLlm = llm.withStructuredOutput(dataStoreSchema);

  const result = await structuredLlm.invoke([
    data_store_sys_prompt,
    ...state["messages"],
  ]);
  return { messages: [result] };
}
const workflow = new StateGraph(StateAnnotation)
  .addNode("intent-classification", intentClassification)
  .addNode("automation_agent", call_model)
  .addNode("tools", toolNode)
  .addNode("data-store", dataStoreModel)
  .addNode("setUserInfo", setUserInfo)
  .addNode("automationPreparePrompt", automationPreparePrompt)
  .addConditionalEdges("automation_agent", shouldContinue)
  .addConditionalEdges("intent-classification", conditionalNode)
  .addEdge("__start__", "setUserInfo")
  .addEdge("setUserInfo", "intent-classification")
  .addEdge("automationPreparePrompt", "automation_agent")
  .addEdge("tools", "__end__")
  .addEdge("data-store", "__end__");

const app = workflow.compile();

export const agent = async (
  query: string,
  firstName?: string,
  lastName?: string,
): Promise<{}> => {
  const inputObj = {
    query,
    firstName,
    lastName,
  };

  const inputs = JSON.stringify(inputObj);
  const output = await app.invoke({
    messages: [new HumanMessage(inputs)],
  });

  if (output["intent"] === "automation") {
    const structuredOutput: {} = await callStructuredOutputModel(
      output["messages"],
    );

    return { ...structuredOutput, intent: output["intent"] };
  } else {
    console.log(output);
    return output;
  }
};

// agent("I want to send an auto message in Sales navigator");
