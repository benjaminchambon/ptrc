import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { handleApiRequest } from "./api.mjs";

const root = process.cwd();
const port = Number(process.env.PORT || 8888);

const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".mp4": "video/mp4"
};

async function toWebRequest(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const url = `http://${req.headers.host || `localhost:${port}`}${req.url}`;
  return new Request(url, { method: req.method, headers: req.headers, body });
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  let filePath = join(root, safe || "index.html");
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, "index.html");
    const body = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader("content-type", types[extname(filePath).toLowerCase()] || "application/octet-stream");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) return await sendWebResponse(res, await handleApiRequest(await toWebRequest(req)));
    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end("Server error");
  }
});

server.listen(port, () => console.log(`PTRC running on http://localhost:${port}`));
