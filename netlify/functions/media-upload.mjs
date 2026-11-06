  import { handleApiRequest } from "../../server/api.mjs";

  export default async (request) => handleApiRequest(request);

  export const config = {
    method: "POST",
path: "/api/media"
  };
