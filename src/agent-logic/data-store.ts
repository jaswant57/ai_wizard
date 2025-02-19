import { StateAnnotation } from "../main";
import { dataStoreSchema, getLlm } from "../utils/helper";
import { data_store_sys_prompt } from "../utils/prompts";

export async function dataStoreModel(state: typeof StateAnnotation.State) {
  const llm = getLlm();
  const structuredLlm = llm.withStructuredOutput(dataStoreSchema);

  const result = await structuredLlm.invoke([
    data_store_sys_prompt,
    ...state["messages"],
  ]);
  //   console.log(result);
  return { messages: [result] };
}
