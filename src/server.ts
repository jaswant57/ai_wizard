import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { agent } from "./main";
import { addDocs, initializeRetriever } from "./index/vectorIndex";
import {
  getAutomationNameFromId,
  prioritizeLiIfNoPlatform,
} from "./utils/helper";
import { getAccounts } from "./agent-logic/tools";
import { AiWizardResponse, OtherRecommendations } from "./utils/interface";
import { dataStoreRetrieverChain } from "./agent-logic/chain";

dotenv.config({
  path: "./.env",
});

const app = express();

const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.post("/ai-wizard", async (req, res) => {
  try {
    const { query, intent, firstName, lastName } = req.body;

    if (!query || !intent) {
      res.status(400).json({
        success: false,
        error: "Query/Intent parameter is missing in the request body.",
      });
      return;
    }
    const new_query = prioritizeLiIfNoPlatform(query);

    const response: AiWizardResponse = await agent(
      new_query,
      intent,
      firstName,
      lastName,
    );

    let apiResponse: any = {};

    if (response?.actionType === "automation") {
      apiResponse = response;
    } else if (response?.actionType === "data-store") {
      // console.log(response);
      apiResponse["dataStoreUrl"] = response.url;
      apiResponse["dataStoreUrl"] = apiResponse["dataStoreUrl"].replaceAll(
        " ",
        "+",
      );
    } else {
      apiResponse["message"] = response;
    }
    res.json({
      success: true,
      apiResponse,
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

app.post("/addDoc", async (req, res) => {
  try {
    const response = await addDocs(JSON.stringify(req.body.obj), req.body.id);
    res.json(response);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.post("/get-accounts", async (req: Request, res: Response) => {
  try {
    const { token, context } = req.body;
    const accounts = await getAccounts(token, context);
    res.json({ accounts });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.post("/data-store-retriever", async (req, res) => {
  try {
    const docs = await dataStoreRetrieverChain(req.body.query);
    // const names = res.json(docs);
    res.json({ docs });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
