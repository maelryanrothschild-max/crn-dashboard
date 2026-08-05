import { redis } from "../../lib/redis";
import { DEFAULT_ROSTER } from "../../lib/defaultRoster";
import { BLOCK_META } from "../../lib/blockMeta";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    let roster = (await redis.get("roster")) || DEFAULT_ROSTER;
    const customBlocks = (await redis.get("custom-blocks")) || [];
    const allBlockMeta = BLOCK_META.concat(customBlocks.map((b) => ({ key: b.key, title: b.title })));
    const allBlockKeys = allBlockMeta.map((b) => b.key);
    const totalBlocks = allBlockKeys.length;

    const report = await Promise.all(
      roster.map(async (emp) => {
        const progress = (await redis.get("progress-" + emp.id)) || {};
        let passed = 0;
        let scoreSum = 0;
        let scoreCount = 0;
        const perBlock = {};
        allBlockKeys.forEach((key) => {
          const p = progress[key];
          perBlock[key] = p ? { done: !!p.done, testScore: p.testScore, testPassed: !!p.testPassed } : { done: false };
          if (p && p.testPassed) passed++;
          if (p && typeof p.testScore === "number") { scoreSum += p.testScore; scoreCount++; }
        });
        const avgScore = scoreCount ? Math.round((scoreSum / scoreCount) * 10) / 10 : null;
        return {
          id: emp.id, surname: emp.surname, firstname: emp.firstname, role: emp.role,
          city: emp.city || "", store: emp.store || "", brand: emp.brand || "",
          blocksPassed: passed, totalBlocks, avgScore, perBlock,
        };
      })
    );

    return res.status(200).json({ report, totalBlocks, blockMeta: allBlockMeta });
  } catch (err) {
    return res.status(500).json({
      error: "Ошибка базы данных. Похоже, хранилище Redis ещё не подключено к проекту — см. README.",
      details: String(err),
    });
  }
}
