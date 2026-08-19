import { redis } from "../../lib/redis";
import { requireUser, isOwnerModerator } from "../../lib/auth";
import { PROFESSIONAL_TRACK } from "../../lib/professionalTrack";

function mergedBlocks(custom) {
  const customKeys = new Set((custom || []).map((b) => b.key));
  return PROFESSIONAL_TRACK.filter((b) => !customKeys.has(b.key)).concat(custom || []);
}

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === "GET") {
      const custom = (await redis.get("custom-blocks")) || [];
      return res.status(200).json({ blocks: mergedBlocks(custom) });
    }

    if (!isOwnerModerator(user)) {
      return res.status(403).json({ error: "Только модератор может управлять учебными блоками" });
    }

    if (req.method === "POST") {
      const { block } = req.body || {};
      if (!block || !block.key || !block.title) return res.status(400).json({ error: "Некорректный формат блока" });
      let blocks = (await redis.get("custom-blocks")) || [];
      blocks = blocks.filter((b) => b.key !== block.key);
      blocks.push(block);
      await redis.set("custom-blocks", blocks);
      return res.status(200).json({ blocks: mergedBlocks(blocks) });
    }

    if (req.method === "DELETE") {
      const { key } = req.body || {};
      if (!key) return res.status(400).json({ error: "Не указан ключ блока" });
      if (PROFESSIONAL_TRACK.some((b) => b.key === key)) {
        return res.status(403).json({ error: "Базовые блоки профессионального трека защищены от удаления" });
      }
      let blocks = (await redis.get("custom-blocks")) || [];
      blocks = blocks.filter((b) => b.key !== key);
      await redis.set("custom-blocks", blocks);
      return res.status(200).json({ blocks: mergedBlocks(blocks) });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка базы данных", details: String(err) });
  }
}
