export interface Input {
  placement: Placement;
  type: string;
  name: string;
}

export enum Placement {
  HEADER = "header",
  URL = "url",
  QUERY = "query",
  BODY = "body",
  COOKIE = "cookie",
  PARAM = "param",
}

export interface AiWizardResponse {
  actionType: "automation" | "message" | "data-store";
  text: string;
  inputs?: {
    automationId: string;
    inputSource: string;
    twProfileUrl: string;
  };
  otherRecommendedAutomations?: string[];
}
