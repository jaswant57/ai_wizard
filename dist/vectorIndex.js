"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRetriever = void 0;
const pinecone_1 = require("@langchain/pinecone");
const openai_1 = require("@langchain/openai");
const pinecone_2 = require("@pinecone-database/pinecone");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: "./.env",
});
const initializeRetriever = () => __awaiter(void 0, void 0, void 0, function* () {
    const embeddings = new openai_1.OpenAIEmbeddings();
    const pinecone = new pinecone_2.Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);
    const vectorStore = yield pinecone_1.PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
    });
    const retriever = vectorStore.asRetriever({
        k: 3,
        searchType: "similarity",
    });
    return retriever;
});
exports.initializeRetriever = initializeRetriever;
// initializeRetriever();
