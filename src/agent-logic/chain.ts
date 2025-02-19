import { promptTemplate } from "../utils/prompts";
import { initializeRetriever } from "../index/vectorIndex";
import { formatDocs } from "../utils/helper";

export const retrieverChain = async (
  query: string,
  firstName?: string,
  lastName?: string,
) => {
  const retriever = await initializeRetriever();
  const context = await (await retriever).invoke(query);
  // console.log(context);
  const formattedDocs = formatDocs(context);
  const response = await promptTemplate.invoke({
    context: formattedDocs,
    query,
    firstName,
    lastName,
  });

  return response;
};
