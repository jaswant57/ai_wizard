import { SystemMessage } from "@langchain/core/messages";
import { StateAnnotation } from "../main";
import { getLlm } from "../utils/helper";
import { dataStoreSchema } from "../utils/schema";
import { dataStoreRetrieverChain } from "./chain";

export async function dataStoreModel(state: typeof StateAnnotation.State) {
  const llm = getLlm();
  const structuredLlm = llm.withStructuredOutput(dataStoreSchema);
  const prompt = await dataStoreRetrieverChain(
    state["messages"].pop()?.content.toString() ?? "",
  );
  const result = await structuredLlm.invoke([
    new SystemMessage(prompt.value.replace("_id", "platformOperationId")),
    ...state["messages"],
  ]);
  return { messages: [result] };
}
