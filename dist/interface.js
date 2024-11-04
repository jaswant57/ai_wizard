"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Placement = void 0;
// export enum FieldTypes {
//   TEXT = "text",
//   NUMBER = "number",
//   BOOLEAN = "boolean",
//   OBJECT = "object",
//   ARRAY = "array",
//   DATE = "date",
//   FILE = "file",
//   LIST = "list",
//   MESSAGE = "message",
// }
var Placement;
(function (Placement) {
    Placement["HEADER"] = "header";
    Placement["URL"] = "url";
    Placement["QUERY"] = "query";
    Placement["BODY"] = "body";
    Placement["COOKIE"] = "cookie";
    Placement["PARAM"] = "param";
})(Placement || (exports.Placement = Placement = {}));
