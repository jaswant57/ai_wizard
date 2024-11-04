import { promptTemplate } from "./prompts";
import { initializeRetriever } from "./vectorIndex";
import { formatDocs } from "./utils/helper";

export const retrieverChain = async (query: string) => {
  const retriever = await initializeRetriever();
  const context = await (await retriever).invoke(query);
  // console.log(context);
  const formattedDocs = formatDocs(context);

  const response = await promptTemplate.invoke({
    context: formattedDocs,
    query,
  });
  return response;
};
