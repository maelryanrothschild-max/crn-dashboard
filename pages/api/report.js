import { redis } from "../../lib/redis";
import { BLOCK_META } from "../../lib/blockMeta";
import { requireUser, getRoster, canViewEmployee, safeUser } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    const roster = await getRoster();
    const visible = roster.filter((emp) => canViewEmployee(user, emp));
    const customBlocks = (await redis.get("custom-blocks")) || [];
    const allBlockMeta = BLOCK_META.concat(customBlocks.map((b) => ({ key: b.key, title: b.title })));
    const allBlockKeys = allBlockMeta.map((b) => b.key);
    const totalBlocks = allBlockKeys.length;

    const report = await Promise.all(
      visible.map(async (emp) => {
        const progress = (await redis.get("progress-" + emp.id)) || {};
        let passed = 0;
        let scoreSum = 0;
        let scoreCount = 0;
        const perBlock = {};

        allBlockKeys.forEach((key) => {
          const p = progress[key];
          perBlock[key] = p ? { done: !!p.done, testScore: p.testScore, testPassed: !!p.testPassed } : { done: false };
          if (p && p.testPassed) passed++;
          if (p && typeof p.testScore === "number") {
            scoreSum += p.testScore;
            scoreCount++;
          }
        });

        const avgScore = scoreCount ? Math.round((scoreSum / scoreCount) * 10) / 10 : null;
        return {
          ...safeUser(emp),
          blocksPassed: passed,
          totalBlocks,
          avgScore,
          perBlock,
        };
      })
    );

    return res.status(200).json({ report, totalBlocks, blockMeta: allBlockMeta });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка формирования отчёта", details: String(err) });
  }
}
