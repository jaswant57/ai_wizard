import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { agent } from "./main";

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

    const response = await agent(req.body.query);

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
