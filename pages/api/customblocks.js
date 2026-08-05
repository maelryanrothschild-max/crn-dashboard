import { redis } from "../../lib/redis";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const blocks = (await redis.get("custom-blocks")) || [];
      return res.status(200).json({ blocks });
    }

    if (req.method === "POST") {
      const { block } = req.body || {};
      if (!block || !block.key) return res.status(400).json({ error: "Некорректный формат блока" });
      let blocks = (await redis.get("custom-blocks")) || [];
      blocks = blocks.filter((b) => b.key !== block.key);
      blocks.push(block);
      await redis.set("custom-blocks", blocks);
      return res.status(200).json({ blocks });
    }

    if (req.method === "DELETE") {
      const { key } = req.body || {};
      let blocks = (await redis.get("custom-blocks")) || [];
      blocks = blocks.filter((b) => b.key !== key);
      await redis.set("custom-blocks", blocks);
      return res.status(200).json({ blocks });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({
      error: "Ошибка базы данных. Похоже, хранилище Redis ещё не подключено к проекту — см. README.",
      details: String(err),
    });
  }
}
