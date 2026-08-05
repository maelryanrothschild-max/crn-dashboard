import { redis } from "../../../lib/redis";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Не указан id сотрудника" });

  try {
    if (req.method === "GET") {
      const progress = (await redis.get("progress-" + id)) || {};
      return res.status(200).json({ progress });
    }

    if (req.method === "POST") {
      const { progress } = req.body || {};
      await redis.set("progress-" + id, progress || {});
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({
      error: "Ошибка базы данных. Похоже, хранилище Redis ещё не подключено к проекту — см. README.",
      details: String(err),
    });
  }
}
