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
exports.default = handler;
const main_1 = require("../src/main"); // Adjust path if `main` is located elsewhere
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield (0, main_1.agent)(req.body.query);
            res.json({ success: true, response });
        }
        catch (err) {
            console.error("Error:", err);
            res.status(500).json({
                success: false,
                error: "An internal server error occurred.",
                details: err,
            });
        }
    });
}
