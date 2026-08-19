import { redis } from "../../lib/redis";
import { requireUser, getRoster, canViewEmployee, isOwnerModerator } from "../../lib/auth";
import { DIMENSIONS, ITEMS, scoreProfile, buildDevelopmentSummary } from "../../lib/salesProfile";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const roster = await getRoster();
    const requestedId = String(req.query.id || req.body?.id || user.id);
    const target = roster.find((e) => String(e.id) === requestedId);
    if (!target) return res.status(404).json({ error: "Сотрудник не найден" });

    // The employee can see/submit their own self-assessment. Owner-moderator can view all.
    // Directors intentionally do not receive raw self-assessment responses in this version.
    const self = String(user.id) === requestedId;
    if (!self && !isOwnerModerator(user)) return res.status(403).json({ error: "Нет доступа к Sales Profile этого сотрудника" });

    const key = `sales-profile-${requestedId}`;
    if (req.method === "GET") {
      const stored = (await redis.get(key)) || null;
      return res.status(200).json({
        id: requestedId,
        employee: { firstname: target.firstname, surname: target.surname, role: target.role, store: target.store },
        dimensions: DIMENSIONS,
        items: self ? ITEMS.map(({id,text})=>({id,text})) : undefined,
        result: stored?.result || null,
        completedAt: stored?.completedAt || null,
        notice: "CRN Sales Profile — инструмент развития и самоанализа. Это не медицинская/психологическая диагностика и не самостоятельное основание для кадрового решения."
      });
    }

    if (req.method === "POST") {
      if (!self) return res.status(403).json({ error: "Профиль заполняет только сам сотрудник" });
      const responses = req.body?.responses || {};
      const result = scoreProfile(responses);
      if (result.answered !== ITEMS.length) return res.status(400).json({ error: `Ответьте на все утверждения: ${result.answered}/${ITEMS.length}` });
      const summary = buildDevelopmentSummary(result);
      const payload = { result: { ...result, summary }, completedAt: new Date().toISOString() };
      await redis.set(key, payload);
      return res.status(200).json({ ok:true, ...payload });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка Sales Profile", details: String(err) });
  }
}
