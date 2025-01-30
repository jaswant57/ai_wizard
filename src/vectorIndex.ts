import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import type { Document } from "@langchain/core/documents";
import { CohereEmbeddings } from "@langchain/cohere";

dotenv.config({
  path: "./.env",
});

export const initializeRetriever = async () => {
  // const embeddings = new CohereEmbeddings({
  //   batchSize: 48, // Default value if omitted is 48. Max value is 96
  //   model: "embed-english-v3.0",
  // });
  // const embeddings = new OpenAIEmbeddings();
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-large",
  });
  const pinecone = new PineconeClient();

  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  const retriever = vectorStore.asRetriever({
    k: 3,
    searchType: "similarity",
  });

  return retriever;
};

export const addDocs = async (pageContent: string, id: string) => {
  // const embeddings = new OpenAIEmbeddings();
  // const embeddings = new CohereEmbeddings({
  //   batchSize: 48, // Default value if omitted is 48. Max value is 96
  //   model: "embed-english-v3.0",
  // });
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-large",
  });
  const pinecone = new PineconeClient();

  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });
  const document: Document = {
    pageContent,
    metadata: { source: id },
  };
  return await vectorStore.addDocuments([document], { ids: [id] });
};
