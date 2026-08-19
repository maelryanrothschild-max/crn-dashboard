import { redis } from "../../lib/redis";
import { requireUser, getRoster, canViewEmployee, isOwnerModerator } from "../../lib/auth";
import { PROFESSIONAL_TRACK } from "../../lib/professionalTrack";

function validPracticeMap(input) {
  const allowed = new Map(PROFESSIONAL_TRACK.map((b) => [b.key, (b.practice || []).length]));
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (!allowed.has(key)) continue;
    const max = allowed.get(key);
    const done = Array.isArray(value?.done) ? value.done.slice(0, max).map(Boolean) : [];
    while (done.length < max) done.push(false);
    out[key] = { done, updatedAt: new Date().toISOString() };
  }
  return out;
}

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const roster = await getRoster();
    const requestedId = String(req.query.id || req.body?.id || user.id);
    const target = roster.find((e) => String(e.id) === requestedId);
    if (!target) return res.status(404).json({ error: "Сотрудник не найден" });
    if (!canViewEmployee(user, target)) return res.status(403).json({ error: "Нет доступа к этому сотруднику" });

    const key = `practice-${target.id}`;
    if (req.method === "GET") {
      const practice = (await redis.get(key)) || {};
      return res.status(200).json({ id: String(target.id), practice, modules: PROFESSIONAL_TRACK.map((b) => ({ key:b.key, title:b.title, tasks:b.practice || [] })) });
    }

    if (req.method === "POST") {
      if (String(user.id) !== String(target.id) && !isOwnerModerator(user)) {
        return res.status(403).json({ error: "Практические задания отмечает сам сотрудник; модератор может корректировать при необходимости" });
      }
      const current = (await redis.get(key)) || {};
      const incoming = validPracticeMap(req.body?.practice || {});
      const next = { ...current, ...incoming };
      await redis.set(key, next);
      return res.status(200).json({ ok:true, id:String(target.id), practice:next });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка практических заданий", details: String(err) });
  }
}
