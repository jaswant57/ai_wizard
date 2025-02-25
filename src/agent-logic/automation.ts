import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { callAutomationApi, createDynamicSchema } from "./tools";
import { retrieverChain } from "./chain";
import { ChatGroq } from "@langchain/groq";
import { sys_message } from "./../utils/prompts";
import { getLlm } from "./../utils/helper";
import { StateAnnotation } from "../main";
import { AiWizardResponse } from "../utils/interface";

export async function callStructuredOutputModel(
  output: Array<ToolMessage | HumanMessage | AIMessage | SystemMessage>,
): Promise<AiWizardResponse> {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
  });

  const jsonSchema = createDynamicSchema(output);
  const structuredLlm = llm.withStructuredOutput(jsonSchema);

  // Check if the last message is not a ToolMessage
  if (!(output[output.length - 1] instanceof ToolMessage)) {
    // Return content of the last message if it's not a ToolMessage
    return {
      actionType: "message",
      text: output[output.length - 1].content.toString(),
    };
  }

  // Invoke structured output model and wait for response
  const response = await structuredLlm.invoke([sys_message, ...output]);

  // Ensure response matches AiWizardResponse type
  return response as AiWizardResponse; // <-- Type assertion
}

export function shouldContinue(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user)
  return "__end__";
}

export async function automationPreparePrompt(
  state: typeof StateAnnotation.State,
) {
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

export async function automation_agent(state: typeof StateAnnotation.State) {
  const llm = getLlm();
  const llm_with_tools = llm.bindTools(tools);
  // console.log(state);
  // console.log({
  //   messages: [await llm_with_tools.invoke(state["messages"])],
  // });
  return {
    messages: [await llm_with_tools.invoke(state["messages"])],
  };
}

export const tools = [callAutomationApi];
export const toolNode = new ToolNode(tools);
