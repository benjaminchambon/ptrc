import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

const root = process.env.PTRC_DATA_DIR || join(process.cwd(), "data");
const newsPath = join(root, "news.json");
const mediaDir = join(root, "media");
const analyticsPath = join(root, "analytics.json");

async function ensureDir(path) { await mkdir(path, { recursive: true }); }

export async function listNews() {
  try {
    return JSON.parse(await readFile(newsPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export async function writeNews(news) {
  await ensureDir(dirname(newsPath));
  const temp = `${newsPath}.tmp`;
  await writeFile(temp, JSON.stringify(news, null, 2), "utf8");
  await rename(temp, newsPath);
}

export async function readAnalytics() {
  try {
    return JSON.parse(await readFile(analyticsPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return { version: 1, days: {} };
    throw error;
  }
}

export async function writeAnalytics(analytics) {
  await ensureDir(dirname(analyticsPath));
  const temp = `${analyticsPath}.tmp`;
  await writeFile(temp, JSON.stringify(analytics, null, 2), "utf8");
  await rename(temp, analyticsPath);
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
  await ensureDir(mediaDir);
  const id = `${randomUUID()}.${extension}`;
  await writeFile(join(mediaDir, id), Buffer.from(bytes));
  await writeFile(join(mediaDir, `${id}.json`), JSON.stringify({ contentType }), "utf8");
  return { id, url: `/api/media/${id}` };
}

export async function getMedia(id) {
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif|avif)$/i.test(id)) return null;
  try {
    const [bytes, meta] = await Promise.all([
      readFile(join(mediaDir, id)),
      readFile(join(mediaDir, `${id}.json`), "utf8")
    ]);
    return { bytes, contentType: JSON.parse(meta).contentType || "application/octet-stream" };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}
