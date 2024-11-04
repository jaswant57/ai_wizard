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
