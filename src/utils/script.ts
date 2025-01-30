import fs from "fs";
import csvParser from "csv-parser";
import axios from "axios";
import { parse } from "json2csv";

interface InputRow {
  query: string;
  firstName: string;
  lastName: string;
}

interface ApiResponse {
  [key: string]: any;
}

async function makeApiCall(query: string): Promise<ApiResponse> {
  try {
    const response = await axios.post(
      "http://localhost:3000/ai-wizard",
      {
        query,
        firstName: "Jaswant",
        lastName: "Rajput",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error making API call for input: ${JSON.stringify(query)}`,
      // @ts-ignore
      error.message,
    );
    // @ts-ignore
    return { error: error.message || "Unknown error" };
  }
}

function appendToJSON(jsonFile: string, result: any) {
  const jsonData = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));
  jsonData.push(result);
  fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
}

async function processCSV(inputFile: string, jsonFile: string): Promise<void> {
  try {
    console.log("Reading input CSV...");
    // const rows = await readCSV(inputFile);
    const rows = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

    console.log("Making API calls for each row...");
    let count = 1;
    for (const row of rows) {
      console.time("Row time");
      console.log(count);
      count += 1;

      //   @ts-ignore()
      if (row["query"]) {
        //   @ts-ignore()
        console.time("API Call");
        //   @ts-ignore()
        const apiResponse = await makeApiCall(row["query"]);
        console.timeEnd("API Call");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        let result;
        if (apiResponse.success && !apiResponse.error) {
          if (apiResponse.apiResponse.actionType == "automation") {
            const actualAutomationId =
              apiResponse.apiResponse.inputs.automationId;

            result = {
              ...row,
              apiSuccess: true,
              actualAutomationName: apiResponse.dev.mainAutomation.name,
              actualAutomationId,
              reason: "",
              // @ts-ignore
              working: actualAutomationId == row["expected_automation_id"],
            };

            console.log(
              // @ts-ignore
              `${row["query"]} : ${actualAutomationId} : ${
                // @ts-ignore
                row["expected_automation_id"]
                // @ts-ignore
              } = ${actualAutomationId == row["expected_automation_id"]}`,
            );
          } else {
            // @ts-ignore
            console.log(`${row["query"]}: Wrong intent`);
            result = {
              ...row,
              apiSuccess: true,
              working: "false",
              reason: "Wrong intent",
            };
          }
        } else {
          // @ts-ignore
          console.log(`${row["query"]}: Error`);
          result = {
            ...row,
            apiSuccess: false,
            working: false,
            reason: "Error",
          };
        }

        // Append the result to the output CSV

        // Append the result to the output JSON
        await appendToJSON(jsonFile, result);
      }
      console.timeEnd("Row time");
    }

    console.log("Process completed successfully.");
  } catch (error) {
    // @ts-ignore
    console.error("Error processing CSV:", error.message);
  }
}

// Usage
const inputFilePath = "./src/data/cleaned-queries.json"; // Path to the input CSV file
// const outputFilePath = "output.csv"; // Path to the output CSV file
const outputJsonPath = "./src/data/output.json"; // Path to the output JSON file

processCSV(inputFilePath, outputJsonPath);
