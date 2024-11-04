import { Document } from "@langchain/core/dist/documents/document";

export function formatDocs(docs: Document[]) {
  let docContent = "";
  docs.forEach((doc) => {
    docContent += `\n\n ${doc.pageContent}`;
  });
  return docContent;
}
