  import { handleApiRequest } from "../../server/api.mjs";

  export default async (request) => handleApiRequest(request);

  export const config = {
    method: "GET",
path: "/api/media/:id"
  };
