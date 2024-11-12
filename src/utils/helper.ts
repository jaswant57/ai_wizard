import { Document } from "@langchain/core/dist/documents/document";
import axios from "axios";

export function formatDocs(docs: Document[]) {
  let docContent = "";
  docs.forEach((doc) => {
    docContent += `\n\n ${doc.pageContent}`;
  });
  return docContent;
}

export async function getAutomationNameFromId(id: string) {
  try {
    let headers = {
      Authorization: `Bearer ${process.env.TEXAU_API_KEY}`,
      "X-TexAu-Context":
        '{"orgUserId":"66629bd200b34c7c054971ba","workspaceId":"66629be100b34c7c054971fc"}',
    };
    const response = await axios.request({
      url: `https://v2-prod-api.texau.com/api/v1/public/automations/${id}`,
      headers: { ...headers },
      method: "get",
    });

    const name = response.data.data.name;
    return name;
  } catch (err) {
    console.log(`Failed to fetch automation ${id}: ${err}`);
    return "Unable to find the automation name for: " + id;
    // return `Calling tool with arguments:\n\n${JSON.stringify(
    //   input,
    // )}\n\nraised the following error:\n\n${err}`;
  }
}
