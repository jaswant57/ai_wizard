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
exports.callAutomationApi = void 0;
exports.createDynamicSchema = createDynamicSchema;
const messages_1 = require("@langchain/core/messages");
const tools_1 = require("@langchain/core/tools");
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
let headers = {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InN1YiI6ImE2ZDAwYTQwLTM1NjAtNGNhOS05ZWJlLTk3ZThiN2ExOTg3OSIsImVtYWlsIjoiai5yYWpwdXRAdGV4YXUuYXBwIiwidXNlcklkIjoiNjY2MjliYmUwMGIzNGM3YzA1NDk3MWFmIiwib3JnYW5pc2F0aW9uSWQiOiI2NjYyOWJkMjAwYjM0YzdjMDU0OTcxYjYifSwiaWF0IjoxNzMwNjk4OTg2fQ.HDlVKbVra1IsZv8Z2HAeUDqH08_MIHWVSJGGKE1KTmM",
    "X-TexAu-Context": '{"orgUserId":"66629bd200b34c7c054971ba","workspaceId":"66629be100b34c7c054971fc"}',
};
const inputsSchema = zod_1.z.object({
    automationId: zod_1.z.string(),
});
exports.callAutomationApi = (0, tools_1.tool)((input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.request({
            url: `https://v2-prod-api.texau.com/api/v1/public/automations/${input.automationId}`,
            headers: Object.assign({}, headers),
            method: "get",
        });
        const inputs = response.data.data.inputs;
        return JSON.stringify(inputs);
    }
    catch (err) {
        console.log(`Failed to fetch automation ${input.automationId}: ${err}`);
        return `Calling tool with arguments:\n\n${JSON.stringify(input)}\n\nraised the following error:\n\n${err}`;
    }
}), {
    name: "call_automation_api",
    description: "Performs an Api Call which fetches the information about the inputs for an automation",
    schema: inputsSchema,
});
// callAutomationApi.invoke({ automationId: "6405b4b70936e46db5f7b94e" });
function createDynamicSchema(messages) {
    const properties = {};
    messages === null || messages === void 0 ? void 0 : messages.forEach((message) => {
        var _a;
        if (message instanceof messages_1.ToolMessage) {
            const inputObjArray = JSON.parse((_a = message === null || message === void 0 ? void 0 : message.content) === null || _a === void 0 ? void 0 : _a.toString());
            inputObjArray.forEach((inputObj) => {
                let inputType = inputObj.type;
                // Map specific input types to "string" type
                if (["select", "dynamicSelect", "date", "attachment", "text"].includes(inputType)) {
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
                }
                else {
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
                properties: Object.assign({ automationId: {
                        type: "string",
                        description: "Automation Id of the automation",
                    } }, properties),
                required: ["automationId"],
            },
        },
        required: ["actionType", "inputs"],
    };
    return jsonSchema;
}
