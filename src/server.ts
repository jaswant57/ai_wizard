import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { agent } from "./main";
import { initializeRetriever } from "./vectorIndex";
import { isRunnableToolLike } from "@langchain/core/utils/function_calling";

dotenv.config({
  path: "./.env",
});

const app = express();

const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/ai-wizard", async (req, res) => {
  try {
    // Ensure req.body.query is defined
    if (!req.body.query) {
      res.status(400).json({
        success: false,
        error: "Query parameter is missing in the request body.",
      });
      return;
    }

    let response = await agent(
      req.body.query,
      req.body.firstName,
      req.body.lastName,
    );

    res.json({
      success: true,
      response,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "An internal server error occurred.",
      details: err,
    });
  }
});

app.post("/retriever", async (req, res) => {
  try {
    const retriever = await initializeRetriever();
    const docs = await retriever.invoke(req.body.query);
    // const names = res.json(docs);
    res.json(docs);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
