import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import axios from "axios";
import { z } from "zod";
import { Input } from "../utils/interface";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

let headers = {
  Authorization: `Bearer ${process.env.TEXAU_API_KEY}`,
  "X-TexAu-Context":
    '{"orgUserId":"66629bd200b34c7c054971ba","workspaceId":"66629be100b34c7c054971fc"}',
};

const inputsSchema = z.object({
  automationId: z.string(),
});

export const callAutomationApi = tool(
  async (input: { automationId: string }): Promise<string> => {
    try {
      // Define headers for the API call
      const headers = {
        Authorization: `Bearer ${process.env.TEXAU_API_KEY}`,
        "X-TexAu-Context":
          '{"orgUserId":"66629bd200b34c7c054971ba","workspaceId":"66629be100b34c7c054971fc"}',
      };
      const automationId =
        input.automationId === "64899972fbfc94d1d6"
          ? "64899972fbfc94d1d6da88d6"
          : input.automationId;
      // Make the API request
      const response = await axios.request({
        url: `https://v2-prod-api.texau.com/api/v1/public/automations/${automationId}`,
        headers: { ...headers },
        method: "get",
      });

      // Extract the inputs from the response
      const inputs = response.data.data.inputs;

      // Return the inputs
      return JSON.stringify(inputs);
    } catch (err) {
      console.log(`Failed to fetch automation ${input.automationId}: ${err}`);
      return `Calling tool with arguments:\n\n${JSON.stringify(
        input,
      )}\n\nraised the following error:\n\n${err}`;
    }
  },
  {
    name: "call_automation_api",
    description:
      "Performs an API call which fetches the information about the inputs for an automation",
    schema: inputsSchema,
  },
);

// callAutomationApi.invoke({ automationId: "6405b4b70936e46db5f7b94e" });

export function createDynamicSchema(
  messages: Array<
    AIMessage | SystemMessage | HumanMessage | ToolMessage | BaseMessage
  >,
) {
  const properties: Record<string, any> = {};

  messages?.forEach((message) => {
    if (message instanceof ToolMessage) {
      const inputObjArray = JSON.parse(message?.content?.toString());

      inputObjArray.forEach((inputObj: Input) => {
        let inputType = inputObj.type;

        // Map specific input types to "string" type
        if (
          [
            "select",
            "dynamicSelect",
            "date",
            "attachment",
            "text",
            "sn-message",
            "file",
            "thread",
          ].includes(inputType)
        ) {
          inputType = "string";
        }

        if (inputType === "message") {
          properties[inputObj.name] = {
            type: "object",
            description: "",
            properties: {
              text: {
                type: "string",
                description: "Message to send",
                default: "",
              },
            },
          };
        } else {
          properties[inputObj.name] = {
            type: inputType,
            description: "",
            default: "",
          };
        }
      });
    }
  });

  const jsonSchema = {
    title: "automation_inputs",
    name: "automation_inputs",
    description: "Inputs of the automation",
    type: "object",
    properties: {
      actionType: {
        type: "string",
        description: "actionType will always be automation",
      },
      text: {
        type: "string",
        description: "A greeting text explaining the user about the automation",
      },
      inputs: {
        type: "object",
        description: "Inputs of the automation",
        properties: {
          automationId: {
            type: "string",
            description: "Automation Id of the automation",
          },
          automationName: {
            type: "string",
            description: "Name of the automation",
          },
          platformId: {
            type: "string",
            description: "Platform Id of the automation",
          },
          inputSource: {
            type: "string",
            description: "Source of the input data",
            enum: ["direct-input", "csv", "google-sheet"],
          },
          ...properties,
        },
        required: [
          "automationId",
          "inputSource",
          "platformId",
          "automationName",
        ],
      },
      otherRecommendedAutomations: {
        type: "array",
        description: "Other Recommended Automations",
        items: {
          type: "object",
          description: "Recommended Automation Details",
          properties: {
            automationId: {
              type: "string",
              description: "Automation Id of the automation",
            },
            automationName: {
              type: "string",
              description: "Name of the automation",
            },
            platformId: {
              type: "string",
              description: "Platform Id of the automation",
            },
          },
        },
      },
    },
    required: ["actionType", "inputs"],
  };

  return jsonSchema;
}

export async function getAccounts(token: string, context: string) {
  let config = {
    method: "get",
    url: "https://api.texau.com/api/v1/accounts/ui?start=0&limit=20",
    headers: {
      authorization: `Bearer ${token}`,
      "x-texau-context": context,
    },
  };
  const response = await axios.request(config);
  const data = response.data;
  return data;
}
