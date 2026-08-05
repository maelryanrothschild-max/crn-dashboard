import { redis } from "../../lib/redis";
import { DEFAULT_ROSTER } from "../../lib/defaultRoster";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const roster = (await redis.get("roster")) || DEFAULT_ROSTER;
      const customBlocks = (await redis.get("custom-blocks")) || [];
      const progress = {};
      for (const emp of roster) {
        progress[emp.id] = (await redis.get("progress-" + emp.id)) || {};
      }
      const backup = {
        createdAt: new Date().toISOString(),
        roster,
        customBlocks,
        progress,
      };
      return res.status(200).json(backup);
    }

    if (req.method === "POST") {
      const backup = req.body || {};
      if (!backup.roster) {
        return res.status(400).json({ error: "Файл резервной копии повреждён или имеет неверный формат." });
      }
      await redis.set("roster", backup.roster);
      await redis.set("custom-blocks", backup.customBlocks || []);
      const progress = backup.progress || {};
      for (const id of Object.keys(progress)) {
        await redis.set("progress-" + id, progress[id]);
      }
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
