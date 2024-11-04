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
import { Input } from "./utils/interface";

let headers = {
  Authorization:
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InN1YiI6ImE2ZDAwYTQwLTM1NjAtNGNhOS05ZWJlLTk3ZThiN2ExOTg3OSIsImVtYWlsIjoiai5yYWpwdXRAdGV4YXUuYXBwIiwidXNlcklkIjoiNjY2MjliYmUwMGIzNGM3YzA1NDk3MWFmIiwib3JnYW5pc2F0aW9uSWQiOiI2NjYyOWJkMjAwYjM0YzdjMDU0OTcxYjYifSwiaWF0IjoxNzMwNjk4OTg2fQ.HDlVKbVra1IsZv8Z2HAeUDqH08_MIHWVSJGGKE1KTmM",
  "X-TexAu-Context":
    '{"orgUserId":"66629bd200b34c7c054971ba","workspaceId":"66629be100b34c7c054971fc"}',
};

const inputsSchema = z.object({
  automationId: z.string(),
});

export const callAutomationApi = tool(
  async (input: { automationId: string }): Promise<string> => {
    try {
      const response = await axios.request({
        url: `https://v2-prod-api.texau.com/api/v1/public/automations/${input.automationId}`,
        headers: { ...headers },
        method: "get",
      });

      const inputs = response.data.data.inputs;
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
      "Performs an Api Call which fetches the information about the inputs for an automation",
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
          ["select", "dynamicSelect", "date", "attachment", "text"].includes(
            inputType,
          )
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
      inputs: {
        type: "object",
        description: "Inputs of the automation",
        properties: {
          automationId: {
            type: "string",
            description: "Automation Id of the automation",
          },
          ...properties,
        },
        required: ["automationId"],
      },
    },
    required: ["actionType", "inputs"],
  };

  return jsonSchema;
}
