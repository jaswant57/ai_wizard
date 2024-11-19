import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import type { Document } from "@langchain/core/documents";

dotenv.config({
  path: "./.env",
});

export const initializeRetriever = async () => {
  const embeddings = new OpenAIEmbeddings();

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
  const embeddings = new OpenAIEmbeddings();

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
