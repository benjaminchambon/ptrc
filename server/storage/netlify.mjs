import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

const region = process.env.PTRC_BLOBS_REGION || "eu-central-1";
const contentStore = () => getStore("ptrc-content", { region });
const mediaStore = () => getStore("ptrc-media", { region });

export async function listNews() {
  return (await contentStore().get("news.json", { type: "json", consistency: "strong" })) || [];
}

export async function writeNews(news) {
  await contentStore().setJSON("news.json", news);
}

const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};

export async function saveMedia({ bytes, contentType }) {
  const extension = extensions[contentType];
  if (!extension) throw new Error("unsupported_media_type");
  const id = `${randomUUID()}.${extension}`;
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  await mediaStore().set(id, arrayBuffer, { metadata: { contentType } });
  return { id, url: `/api/media/${id}` };
}

export async function getMedia(id) {
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif|avif)$/i.test(id)) return null;
  const store = mediaStore();
  const [bytes, metadata] = await Promise.all([
    store.get(id, { type: "arrayBuffer", consistency: "strong" }),
    store.getMetadata(id, { consistency: "strong" })
  ]);
  if (!bytes) return null;
  return { bytes, contentType: metadata?.metadata?.contentType || "application/octet-stream" };
}
