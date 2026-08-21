import crypto from "crypto";
import { redis } from "./redis";
import { DEFAULT_ROSTER } from "./defaultRoster";
import { CANONICAL_ROSTER } from "./canonicalRoster";
import { REGIONAL_DIRECTORS } from "./regionalDirectors";
import { resolveDirectorScope } from "./directorScope";

const COOKIE_NAME = "crn_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const APPROVED_ROSTER = CANONICAL_ROSTER.concat(REGIONAL_DIRECTORS);

function getSecret() {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

function encode(value) { return Buffer.from(value).toString("base64url"); }
function decode(value) { return Buffer.from(value, "base64url").toString("utf8"); }
function sign(payload) { return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url"); }

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return raw.split(";").reduce((acc, part) => {
    const i = part.indexOf("=");
    if (i === -1) return acc;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export function safeUser(user) {
  if (!user) return null;
  const { pin, password, ...safe } = user;
  return safe;
}

export function createSessionCookie(user) {
  const now = Math.floor(Date.now() / 1000);
  const data = { uid: String(user.id), iat: now, exp: now + SESSION_TTL_SECONDS };
  const payload = encode(JSON.stringify(data));
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; ${process.env.NODE_ENV === "production" ? "Secure; " : ""}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${process.env.NODE_ENV === "production" ? "Secure; " : ""}`;
}

const canonById = new Map(APPROVED_ROSTER.map((e) => [String(e.id), e]));
const norm = (v) => String(v || "").trim().toLocaleLowerCase("ru-RU");
const canonByName = new Map(APPROVED_ROSTER.map((e) => [`${norm(e.surname)}|${norm(e.firstname)}`, e]));

function applyOperationalRosterOverrides(roster) {
  let changed = false;
  const seen = new Set();
  const next = (roster || []).map((e) => {
    const canonical = canonById.get(String(e.id)) || canonByName.get(`${norm(e.surname)}|${norm(e.firstname)}`);
    if (!canonical) return e;
    seen.add(String(canonical.id));

    const patch = {
      ...e,
      id: String(canonical.id),
      surname: canonical.surname,
      firstname: canonical.firstname,
      role: canonical.role,
      city: canonical.city,
      store: canonical.store,
      brand: canonical.brand,
      position: canonical.position || e.position,
      // PIN intentionally stays from the live record so existing users never lose access.
      pin: String(e.pin || canonical.pin || canonical.id),
    };

    if (
      String(e.id) !== String(patch.id) ||
      e.surname !== patch.surname ||
      e.firstname !== patch.firstname ||
      e.role !== patch.role ||
      e.city !== patch.city ||
      e.store !== patch.store ||
      e.brand !== patch.brand ||
      e.position !== patch.position
    ) changed = true;
    return patch;
  });

  // New approved staff who are not yet in live Redis are appended automatically.
  for (const canonical of APPROVED_ROSTER) {
    if (seen.has(String(canonical.id))) continue;
    const existsByName = next.some((e) => `${norm(e.surname)}|${norm(e.firstname)}` === `${norm(canonical.surname)}|${norm(canonical.firstname)}`);
    if (existsByName) continue;
    next.push({ ...canonical, id: String(canonical.id), pin: String(canonical.pin || canonical.id) });
    changed = true;
  }

  return { roster: next, changed };
}

export async function getRoster() {
  const stored = await redis.get("roster");
  const base = stored || DEFAULT_ROSTER;
  const { roster, changed } = applyOperationalRosterOverrides(base);
  if (changed) await redis.set("roster", roster);
  return roster;
}

export async function getCurrentUser(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let data;
  try { data = JSON.parse(decode(payload)); } catch { return null; }
  const now = Math.floor(Date.now() / 1000);
  if (!data.uid || !data.exp || data.exp < now) return null;

  const roster = await getRoster();
  const raw = roster.find((e) => String(e.id) === String(data.uid)) || null;
  return raw ? resolveDirectorScope(raw) : null;
}

export async function requireUser(req, res) {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Требуется вход в систему" }); return null; }
  return user;
}

export function isOwnerModerator(user) {
  const ownerId = String(process.env.OWNER_USER_ID || "2011");
  return !!user && user.role === "moderator" && String(user.id) === ownerId;
}

function isRegionalDirector(user) {
  return !!user && user.role === "director" && user.store === "Все магазины" && !!user.brand;
}

export function canViewEmployee(user, employee) {
  if (!user || !employee) return false;
  if (isOwnerModerator(user)) return true;
  if (String(user.id) === String(employee.id)) return true;
  if (user.role === "director") {
    if (isRegionalDirector(user)) return norm(user.brand) === norm(employee.brand);
    return !!user.store && user.store !== "Все магазины" && user.store === employee.store;
  }
  return false;
}

export function canManageEmployee(user, employee) {
  if (!user || !employee) return false;
  if (isOwnerModerator(user)) return true;
  if (user.role !== "director") return false;
  if (employee.role === "moderator") return false;
  if (isRegionalDirector(user)) return norm(user.brand) === norm(employee.brand);
  if (!user.store || user.store === "Все магазины") return false;
  return user.store === employee.store;
}
