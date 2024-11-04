import { VercelRequest, VercelResponse } from "@vercel/node";
import { agent } from "../src/main"; // Adjust path if `main` is located elsewhere
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    if (!req.body.query) {
      res.status(400).json({
        success: false,
        error: "Query parameter is missing in the request body.",
      });
      return;
    }

    const response = await agent(req.body.query);
    res.json({ success: true, response });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "An internal server error occurred.",
      details: err,
    });
  }
}
