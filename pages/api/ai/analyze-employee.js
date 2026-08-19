import { callClaude } from "../../../lib/anthropic";
import { redis } from "../../../lib/redis";
import { BLOCK_META } from "../../../lib/blockMeta";
import { requireUser, getRoster, isOwnerModerator } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    const requester = await requireUser(req, res);
    if (!requester) return;
    if (!isOwnerModerator(requester)) {
      return res.status(403).json({ error: "ИИ-анализ сотрудников доступен только модератору" });
    }

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Не указан сотрудник" });

    const roster = await getRoster();
    const emp = roster.find((e) => String(e.id) === String(id));
    if (!emp) return res.status(404).json({ error: "Сотрудник не найден" });

    const progress = (await redis.get("progress-" + id)) || {};
    const customBlocks = (await redis.get("custom-blocks")) || [];
    const allMeta = BLOCK_META.concat(customBlocks.map((b) => ({ key: b.key, title: b.title })));

    const results = allMeta.map((m) => {
      const p = progress[m.key];
      return {
        key: m.key,
        title: m.title,
        done: !!p?.done,
        score: typeof p?.testScore === "number" ? p.testScore : null,
        passed: !!p?.testPassed,
      };
    });

    const completed = results.filter((r) => r.score !== null);
    const avgScore = completed.length
      ? Math.round((completed.reduce((sum, r) => sum + r.score, 0) / completed.length) * 10) / 10
      : null;

    const system = `Ты — CRN AI Coach, эксперт по развитию сотрудников премиального fashion-retail.
Твоя задача — анализировать только рабочие и учебные данные сотрудника и давать управленческий профиль для модератора Академии.

КРИТИЧЕСКИ ВАЖНО:
- не ставь медицинские или психологические диагнозы;
- не утверждай личностные качества как факты, если они не подтверждены данными;
- поведенческие выводы формулируй как рабочие гипотезы, которые нужно проверить на встрече 1:1;
- не используй чувствительные характеристики человека;
- отделяй наблюдаемые данные от интерпретаций.

Ответ дай на русском языке в 6 коротких разделах:
1. Итог по обучению — прогресс, средний балл, сильные темы.
2. Зоны развития — 1-3 конкретных слабых блока и почему они важны в магазине.
3. Рабочий поведенческий профиль — только осторожные гипотезы на основе паттерна результатов.
4. Что проверить на 1:1 — 3 конкретных вопроса сотруднику.
5. План развития на 7 дней — 3 практических действия в магазине.
6. Контроль — что измерить через 7 дней.

Пиши конкретно, профессионально, без воды. Не более 450 слов.`;

    const userMsg = JSON.stringify({
      employee: {
        firstname: emp.firstname,
        surname: emp.surname,
        role: emp.role,
        store: emp.store || "—",
        city: emp.city || "—",
        brand: emp.brand || "—",
      },
      summary: {
        completedTests: completed.length,
        totalBlocks: results.length,
        avgScore,
      },
      results,
    }, null, 2);

    const text = await callClaude([{ role: "user", content: userMsg }], { system, maxTokens: 1400 });
    return res.status(200).json({ analysis: text.trim(), summary: { completedTests: completed.length, totalBlocks: results.length, avgScore } });
  } catch (err) {
    const status = err.code === "NO_API_KEY" ? 400 : err.status === 401 ? 401 : err.status === 403 ? 403 : err.status === 429 ? 429 : 500;
    return res.status(status).json({ error: err.message || "Ошибка ИИ-анализа", code: err.code || null });
  }
}
