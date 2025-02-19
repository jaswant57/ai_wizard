import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { StateGraph } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { data_store_sys_prompt, intent_sys_prompt } from "./utils/prompts";
import {
  dataStoreSchema,
  getLlm,
  intentClassificationSchema,
} from "./utils/helper";
import {
  automation_agent,
  automationPreparePrompt,
  callStructuredOutputModel,
  shouldContinue,
  toolNode,
} from "./agent-logic/automation";
import { dataStoreModel } from "./agent-logic/data-store";

export const StateAnnotation = Annotation.Root({
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

async function setUserInfo(state: typeof StateAnnotation.State) {
  const { query, firstName, lastName, intent } = JSON.parse(
    state["messages"][0].content.toString(),
  );
  return {
    messages: new HumanMessage(query),
    firstName,
    lastName,
    intent,
  };
}
// Routes the agent to automation recommendation or data-store based on the intent
function conditionalNode(state: typeof StateAnnotation.State) {
  // console.log(state.intent);
  if (state.intent === "automation") {
    return "automation-prepare-prompt";
  } else {
    return "data-store";
  }
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("set-user-info", setUserInfo)
  .addNode("automation-prepare-prompt", automationPreparePrompt)
  .addNode("automation-agent", automation_agent)
  .addNode("tools", toolNode)
  .addEdge("__start__", "set-user-info")
  .addEdge("automation-prepare-prompt", "automation-agent")
  .addEdge("tools", "__end__")
  .addConditionalEdges("automation-agent", shouldContinue)
  .addConditionalEdges("set-user-info", conditionalNode)
  .addNode("data-store", dataStoreModel)
  // .addNode("intent-classification", intentClassification)
  // .addConditionalEdges("intent-classification", conditionalNode)
  // .addEdge("set-user-info", "intent-classification")
  .addEdge("data-store", "__end__");

const app = workflow.compile();
type intent = "automation" | "data-store";
export const agent = async (
  query: string,
  intent: intent,
  firstName?: string,
  lastName?: string,
): Promise<{}> => {
  const inputObj = {
    query,
    firstName,
    lastName,
    intent,
  };

  const inputs = JSON.stringify(inputObj);
  const output = await app.invoke({
    messages: [new HumanMessage(inputs)],
  });
  if (intent === "automation") {
    const structuredOutput: {} = await callStructuredOutputModel(
      output["messages"],
    );
    return structuredOutput;
  } else {
    return output;
  }
};

// async function intentClassification(state: typeof StateAnnotation.State) {
//   const llm = getLlm();
//   const structuredLlm = llm.withStructuredOutput(intentClassificationSchema);

//   const result = await structuredLlm.invoke([
//     intent_sys_prompt,
//     ...state["messages"],
//   ]);
//   console.log(result);
//   return {
//     intent: result.intent,
//   };
// }
