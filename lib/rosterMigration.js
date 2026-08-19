import { redis } from "./redis";
import { CANONICAL_ROSTER } from "./canonicalRoster";

const norm = (v) => String(v || "").trim().toLocaleLowerCase("ru-RU");
const personKey = (e) => `${norm(e.surname)}|${norm(e.firstname)}|${norm(e.store)}`;

function mergeBlock(a, b) {
  if (!a) return b;
  if (!b) return a;
  const ta = Date.parse(a.updatedAt || "") || 0;
  const tb = Date.parse(b.updatedAt || "") || 0;
  if (tb > ta) return { ...a, ...b };
  if (ta > tb) return { ...b, ...a };
  const sa = Number(a.testScore ?? -1);
  const sb = Number(b.testScore ?? -1);
  return sb > sa ? { ...a, ...b } : { ...b, ...a };
}

function mergeProgress(base = {}, extra = {}) {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra || {})) out[key] = mergeBlock(out[key], value);
  return out;
}

function chooseCredential(matches, target) {
  const exact = matches.find((e) => String(e.id) === String(target.id) && e.pin);
  if (exact) return String(exact.pin);
  const any = matches.find((e) => e.pin);
  return any ? String(any.pin) : String(target.pin || target.id);
}

export async function syncCanonicalRoster({ actorId = "system" } = {}) {
  const current = (await redis.get("roster")) || [];
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  await redis.set(`roster-backup-pre-sync-${stamp}`, current);
  for (const emp of current) {
    const p = (await redis.get(`progress-${emp.id}`)) || {};
    if (Object.keys(p).length) await redis.set(`progress-backup-pre-sync-${stamp}-${emp.id}`, p);
  }

  const byPerson = new Map();
  for (const emp of current) {
    const key = personKey(emp);
    if (!byPerson.has(key)) byPerson.set(key, []);
    byPerson.get(key).push(emp);
  }

  let mergedDuplicateAccounts = 0;
  let migratedProgressAccounts = 0;
  let preservedPins = 0;
  const finalRoster = [];

  for (const target of CANONICAL_ROSTER) {
    const matches = byPerson.get(personKey(target)) || [];
    let merged = (await redis.get(`progress-${target.id}`)) || {};

    for (const old of matches) {
      if (String(old.id) !== String(target.id)) mergedDuplicateAccounts += 1;
      const oldProgress = (await redis.get(`progress-${old.id}`)) || {};
      if (Object.keys(oldProgress).length) {
        merged = mergeProgress(merged, oldProgress);
        if (String(old.id) !== String(target.id)) migratedProgressAccounts += 1;
      }
    }

    const pin = chooseCredential(matches, target);
    if (matches.some((e) => String(e.pin || "") === pin)) preservedPins += 1;
    finalRoster.push({ ...target, pin });
    await redis.set(`progress-${target.id}`, merged);
  }

  await redis.set("roster", finalRoster);
  const result = {
    ok: true,
    at: new Date().toISOString(),
    by: String(actorId),
    backupStamp: stamp,
    employees: finalRoster.length,
    directors: finalRoster.filter((e) => e.role === "director").length,
    admins: finalRoster.filter((e) => e.role === "admin").length,
    stylists: finalRoster.filter((e) => e.role === "stylist").length,
    onlineManagers: finalRoster.filter((e) => e.role === "online_manager").length,
    moderators: finalRoster.filter((e) => e.role === "moderator").length,
    mergedDuplicateAccounts,
    migratedProgressAccounts,
    preservedPins,
  };
  await redis.set("roster-sync-2026-08-19", result);
  return result;
}
