import { handleApiRequest } from "../../server/api.mjs";

export default async (request) => handleApiRequest(request);

export const config = {
  path: "/api/news"
};
