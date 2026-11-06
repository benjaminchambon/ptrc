import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "ptrc_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function parseCookies(request) {
  const raw = request.headers.get("cookie") || "";
  return Object.fromEntries(raw.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return index === -1 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function getAuthConfig() {
  const email = process.env.PTRC_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PTRC_ADMIN_PASSWORD;
  const passwordHash = process.env.PTRC_ADMIN_PASSWORD_HASH;
  const secret = process.env.PTRC_SESSION_SECRET;
  if (!email || (!password && !passwordHash) || !secret) {
    return { ready: false, email, password, passwordHash, secret };
  }
  return { ready: true, email, password, passwordHash, secret };
}

export function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

function verifyPassword(password, config) {
  if (config.passwordHash?.startsWith("scrypt$")) {
    const [, saltValue, expectedValue] = config.passwordHash.split("$");
    if (!saltValue || !expectedValue) return false;
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(expectedValue, "base64url");
    const actual = scryptSync(password, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  return Boolean(config.password) && safeEqual(password, config.password);
}

export function authenticateCredentials(email, password) {
  const config = getAuthConfig();
  if (!config.ready) return { ok: false, reason: "not_configured" };
  const normalized = String(email || "").trim().toLowerCase();
  if (!safeEqual(normalized, config.email) || !verifyPassword(String(password || ""), config)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, email: config.email };
}

export function createSessionCookie(request, email) {
  const { secret } = getAuthConfig();
  const payload = base64url(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }));
  const token = `${payload}.${sign(payload, secret)}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

export function getSession(request) {
  const config = getAuthConfig();
  if (!config.ready) return null;
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, config.secret);
  if (!safeEqual(signature, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.email || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (!safeEqual(data.email, config.email)) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}
