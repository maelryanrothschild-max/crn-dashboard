import { redis } from "../../../lib/redis";
import { requireUser, getRoster, canViewEmployee, isOwnerModerator } from "../../../lib/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Не указан id сотрудника" });

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    const roster = await getRoster();
    const target = roster.find((e) => String(e.id) === String(id));
    if (!target) return res.status(404).json({ error: "Сотрудник не найден" });
    if (!canViewEmployee(user, target)) return res.status(403).json({ error: "Нет доступа к этому сотруднику" });

    if (req.method === "GET") {
      const progress = (await redis.get("progress-" + id)) || {};
      return res.status(200).json({ progress });
    }

    if (req.method === "POST") {
      const isSelf = String(user.id) === String(id);
      if (!isSelf && !isOwnerModerator(user)) {
        return res.status(403).json({ error: "Изменять результаты может только сам сотрудник" });
      }
      const { progress } = req.body || {};
      if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
        return res.status(400).json({ error: "Некорректный формат прогресса" });
      }
      await redis.set("progress-" + id, progress);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка базы данных", details: String(err) });
  }
}
