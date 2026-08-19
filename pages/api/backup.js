import { redis } from "../../lib/redis";
import { DEFAULT_ROSTER } from "../../lib/defaultRoster";
import { requireUser, isOwnerModerator } from "../../lib/auth";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    if (!isOwnerModerator(user)) {
      return res.status(403).json({ error: "Резервные копии доступны только модератору" });
    }

    if (req.method === "GET") {
      const roster = (await redis.get("roster")) || DEFAULT_ROSTER;
      const customBlocks = (await redis.get("custom-blocks")) || [];
      const progress = {};
      for (const emp of roster) {
        progress[emp.id] = (await redis.get("progress-" + emp.id)) || {};
      }
      return res.status(200).json({
        version: 2,
        createdAt: new Date().toISOString(),
        roster,
        customBlocks,
        progress,
      });
    }

    if (req.method === "POST") {
      const backup = req.body || {};
      if (!Array.isArray(backup.roster)) {
        return res.status(400).json({ error: "Файл резервной копии повреждён или имеет неверный формат" });
      }

      const moderators = backup.roster.filter((e) => e.role === "moderator");
      if (moderators.length !== 1 || String(moderators[0].id) !== String(process.env.OWNER_USER_ID || "2011")) {
        return res.status(400).json({ error: "Резервная копия содержит недопустимую конфигурацию модератора" });
      }

      await redis.set("roster", backup.roster);
      await redis.set("custom-blocks", Array.isArray(backup.customBlocks) ? backup.customBlocks : []);
      const progress = backup.progress && typeof backup.progress === "object" ? backup.progress : {};
      for (const id of Object.keys(progress)) {
        await redis.set("progress-" + id, progress[id]);
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка резервного копирования", details: String(err) });
  }
}
