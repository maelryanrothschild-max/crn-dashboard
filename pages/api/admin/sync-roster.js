import { redis } from "../../../lib/redis";
import { requireUser, isOwnerModerator } from "../../../lib/auth";
import { CANONICAL_ROSTER } from "../../../lib/canonicalRoster";

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });
  const user = await requireUser(req, res);
  if (!user) return;
  if (!isOwnerModerator(user)) return res.status(403).json({ error: "Только владелец-модератор может синхронизировать штат" });

  try {
    const current = (await redis.get("roster")) || [];
    const byPerson = new Map();
    for (const emp of current) {
      const key = personKey(emp);
      if (!byPerson.has(key)) byPerson.set(key, []);
      byPerson.get(key).push(emp);
    }

    let mergedDuplicateAccounts = 0;
    let migratedProgressAccounts = 0;
    for (const target of CANONICAL_ROSTER) {
      let merged = (await redis.get(`progress-${target.id}`)) || {};
      const matches = byPerson.get(personKey(target)) || [];
      for (const old of matches) {
        if (String(old.id) === String(target.id)) continue;
        const oldProgress = (await redis.get(`progress-${old.id}`)) || {};
        if (Object.keys(oldProgress).length) {
          merged = mergeProgress(merged, oldProgress);
          migratedProgressAccounts += 1;
        }
        mergedDuplicateAccounts += 1;
      }
      await redis.set(`progress-${target.id}`, merged);
    }

    await redis.set("roster", CANONICAL_ROSTER);
    await redis.set("roster-sync-2026-08-19", {
      at: new Date().toISOString(),
      by: String(user.id),
      employees: CANONICAL_ROSTER.length,
      mergedDuplicateAccounts,
      migratedProgressAccounts,
    });

    return res.status(200).json({
      ok: true,
      employees: CANONICAL_ROSTER.length,
      directors: CANONICAL_ROSTER.filter((e) => e.role === "director").length,
      moderators: CANONICAL_ROSTER.filter((e) => e.role === "moderator").length,
      mergedDuplicateAccounts,
      migratedProgressAccounts,
    });
  } catch (err) {
    return res.status(500).json({ error: "Не удалось синхронизировать штат", details: String(err) });
  }
}
