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
Object.defineProperty(exports, "__esModule", { value: true });
exports.agent = void 0;
const messages_1 = require("@langchain/core/messages");
const openai_1 = require("@langchain/openai");
const langgraph_1 = require("@langchain/langgraph");
const langgraph_2 = require("@langchain/langgraph");
const prebuilt_1 = require("@langchain/langgraph/prebuilt");
const tools_1 = require("./tools");
const chain_1 = require("./chain");
const prompts_1 = require("./prompts");
const StateAnnotation = langgraph_2.Annotation.Root({
    messages: (0, langgraph_2.Annotation)({
        reducer: (x, y) => x.concat(y),
    }),
});
const tools = [tools_1.callAutomationApi];
const toolNode = new prebuilt_1.ToolNode(tools);
const llm = new openai_1.ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    maxTokens: -1,
    maxRetries: 2,
});
const llm_with_tools = llm.bindTools(tools);
function shouldContinue(state) {
    var _a;
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    // If the LLM makes a tool call, then we route to the "tools" node
    if ((_a = lastMessage.tool_calls) === null || _a === void 0 ? void 0 : _a.length) {
        return "tools";
    }
    // Otherwise, we stop (reply to the user)
    return "__end__";
}
function preparePrompt(state) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            messages: [
                new messages_1.SystemMessage((yield (0, chain_1.retrieverChain)(state["messages"][0].content.toString())).value),
            ],
        };
    });
}
function call_model(state) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            messages: [yield llm_with_tools.invoke(state["messages"])],
        };
    });
}
function callStructuredOutputModel(output) {
    const jsonSchema = (0, tools_1.createDynamicSchema)(output);
    const structuredLlm = llm.withStructuredOutput(jsonSchema);
    // Check if the last message is not a ToolMessage
    if (!(output[output.length - 1] instanceof messages_1.ToolMessage)) {
        // Return content of the last message if it's not a ToolMessage
        return output[output.length - 1].content;
    }
    // Invoke structured output model with system prompt and messages
    return structuredLlm.invoke([prompts_1.sys_message, ...output]);
}
const workflow = new langgraph_1.StateGraph(StateAnnotation)
    .addNode("agent", call_model)
    .addNode("tools", toolNode)
    .addNode("preparePrompt", preparePrompt)
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("__start__", "preparePrompt")
    .addEdge("preparePrompt", "agent")
    .addEdge("tools", "__end__");
const app = workflow.compile();
const agent = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const output = yield app.invoke({
        messages: [new messages_1.HumanMessage(query)],
    });
    //   console.log("Output: ", output);
    const structuredOutput = yield callStructuredOutputModel(output["messages"]);
    //   console.log("Structured Output: ", structuredOutput);
    return structuredOutput;
});
exports.agent = agent;
