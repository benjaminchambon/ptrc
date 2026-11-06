let adapterPromise;

export function getStorage() {
  if (!adapterPromise) {
    const mode = process.env.PTRC_STORAGE || (process.env.NETLIFY ? "netlify" : "file");
    adapterPromise = mode === "netlify" ? import("./netlify.mjs") : import("./file.mjs");
  }
  return adapterPromise;
}
