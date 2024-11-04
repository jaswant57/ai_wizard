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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const main_1 = require("./main");
dotenv_1.default.config({
    path: "./.env",
});
const app = (0, express_1.default)();
const corsOptions = {
    origin: "*",
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Hello World");
});
app.post("/ai-wizard", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure req.body.query is defined
        if (!req.body.query) {
            res.status(400).json({
                success: false,
                error: "Query parameter is missing in the request body.",
            });
            return;
        }
        const response = yield (0, main_1.agent)(req.body.query);
        res.json({
            success: true,
            response,
        });
    }
    catch (err) {
        console.error("Error:", err);
        res.status(500).json({
            success: false,
            error: "An internal server error occurred.",
            details: err,
        });
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
