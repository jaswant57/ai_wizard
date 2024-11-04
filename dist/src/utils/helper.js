"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDocs = formatDocs;
function formatDocs(docs) {
    let docContent = "";
    docs.forEach((doc) => {
        docContent += `\n\n ${doc.pageContent}`;
    });
    return docContent;
}
