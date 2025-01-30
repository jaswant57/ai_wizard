import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { CohereEmbeddings } from "@langchain/cohere";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import type { Document } from "@langchain/core/documents";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
dotenv.config({
  path: "./.env",
});

// const embeddings = new CohereEmbeddings({
//   apiKey: "YOUR-API-KEY", // In Node.js defaults to process.env.COHERE_API_KEY
//   batchSize: 48, // Default value if omitted is 48. Max value is 96
//   model: "embed-english-v3.0",
// });
console.log(process.env.OPENAI_API_KEY);
// const embeddings = new OpenAIEmbeddings({
//   apiKey: process.env.OPENAI_API_KEY,
//   model: "text-embedding-3-large",
// });

export const addData = async () => {
  const data = JSON.parse(
    fs.readFileSync("./src/data/formatedEnrichedAutomations.json", "utf8"),
  );
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

  const documents = data.automationData.map(createDocument);
  const uuids = Array.from({ length: documents.length }, () => uuidv4());
  //   const retriever = vectorStore.asRetriever({
  //     k: 3,
  //     searchType: 'similarity',
  //   });

  //   return retriever;
  // console.log(documents);
  await vectorStore.addDocuments(documents, { ids: uuids });
  console.log(documents.length);
};

const createDocument = (obj: any) => {
  return {
    pageContent: JSON.stringify(obj), // Store object as a JSON string
    metadata: { source: obj._id }, // Metadata with source ID
  };
};

// addData();
