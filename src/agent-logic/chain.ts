import { promptTemplate, data_store_prompt } from "../utils/prompts";
import { initializeRetriever } from "../index/vectorIndex";
import { formatDocs } from "../utils/helper";

// used in automation recommendation
export const retrieverChain = async (
  query: string,
  firstName?: string,
  lastName?: string,
) => {
  const retriever = await initializeRetriever();
  const context = await (await retriever).invoke(query);
  const formattedDocs = formatDocs(context);
  const response = await promptTemplate.invoke({
    context: formattedDocs,
    query,
    firstName,
    lastName,
  });

  return response;
};

export const dataStoreRetrieverChain = async (query: string) => {
  const retriever = await initializeRetriever();
  const context = await (await retriever).invoke(query);
  const formattedDocs = formatDocs(context, true, true);
  // console.log(formattedDocs);
  const response = data_store_prompt.invoke({
    automationContext: formattedDocs,
  });
  return response;
};
