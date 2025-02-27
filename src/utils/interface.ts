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
    platformId: string;
    automationName: string;
    inputSource: string;
  };
  url?: string;
  otherRecommendedAutomations?: OtherRecommendations[];
}

export interface OtherRecommendations {
  automationId: string;
  platformId: string;
  automationName: string;
}
