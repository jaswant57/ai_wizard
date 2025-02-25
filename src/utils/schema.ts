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
    actionType: {
      type: "string",
      description:
        "actionType will be mostly data-store,but if the query violates platform rules and the agent cannot respond or for normal greeting messages, the actionType will be message",
    },
    url: {
      type: "string",
      description: "Url of the data-store page",
    },
    message: {
      type: "string",
      description: "Greeting messages or response to a violated query",
    },
  },
};
