import { Document } from "@langchain/core/dist/documents/document";
import axios from "axios";
import { url } from "inspector";
import { platform } from "os";

export function formatDocs(docs: Document[]) {
  let docContent = "";
  docs.forEach((doc) => {
    const docJson = JSON.parse(doc.pageContent);
    delete docJson.keywords;
    delete docJson.sampleQueries;
    delete docJson.alternateNames;

    docContent += `\n\n ${JSON.stringify(docJson, null, 2)}`;
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

export const intentClassificationSchema = {
  title: "intent_classification",
  name: "intent_classification",
  description: "Classifies the intent of the given text.",
  type: "object",
  properties: {
    intent: {
      type: "string",
      description: "Intent of the text",
      enum: ["automation", "data-store"],
    },
  },
};

export const dataStoreSchema = {
  title: "data_store_url",
  name: "data_store_url",
  type: "object",
  description: "Url of the data-store page",
  properties: {
    url: {
      type: "string",
      description: "Url of the data-store page",
    },
  },
};

export const plaforms = `
Linkedin : 622f03eb770f6bba0b8facaa
Sales Navigator : 64267ae1dbfc2b4d1fa6628d
Recruiter Lite : 6541d862e7e500bea9c8b645
Twitter : 6307070b15bef68874a6a73c
Reddit : 64c3959178d7c9cda49fb9d9
Youtube : 65150ee6efb0b869501a232a
Product Hunt : 64dd8dedd703b27977181abb
Google : 6493d8cf0f7b435e85d61bb6
Websites : 635bb0ad23dcf87dd4cb89af
Email : 651d01b66c4f024dd288b08c
Open AI : 63e10116079be44dacafe81d
Github : 657ff1a1584e4dbc9f8edb68
Pinterest : 631705c444bbeac6e821ebc7
Slack : 65d45eca4a553560779a22f6
TexAu Agent : 66b36b08fcf4de9a762edd78`;

const platformsArr = [
  "66b36b08fcf4de9a762edd78",
  "65d45eca4a553560779a22f6",
  "631705c444bbeac6e821ebc7",
  "657ff1a1584e4dbc9f8edb68",
  "63e10116079be44dacafe81d",
  "651d01b66c4f024dd288b08c",
  "635bb0ad23dcf87dd4cb89af",
  "6493d8cf0f7b435e85d61bb6",
  "64dd8dedd703b27977181abb",
  "65150ee6efb0b869501a232a",
  "64c3959178d7c9cda49fb9d9",
  "6307070b15bef68874a6a73c",
  "6541d862e7e500bea9c8b645",
  "64267ae1dbfc2b4d1fa6628d",
  "622f03eb770f6bba0b8facaa",
];
// query params
// 1. createdFrom = ["automation-store","builder","api"]
// 2. status = ["completed","running","paused","failed"]
// 3. q =
// 4. platformId = 66b36b08fcf4de9a762edd78
