import { callClaude } from "../../../lib/anthropic";
import { redis } from "../../../lib/redis";
import { BLOCK_META } from "../../../lib/blockMeta";
import { requireUser, getRoster, isOwnerModerator } from "../../../lib/auth";
import { buildLocalEmployeeAnalysis } from "../../../lib/localEmployeeAnalysis";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    const requester = await requireUser(req, res);
    if (!requester) return;
    if (!isOwnerModerator(requester)) {
      return res.status(403).json({ error: "Анализ сотрудников доступен только модератору" });
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

    const local = buildLocalEmployeeAnalysis(emp, results);
    const system = `Ты — CRN AI Coach, эксперт по развитию сотрудников премиального fashion-retail.
Анализируй только рабочие и учебные данные. Не ставь медицинские или психологические диагнозы, не утверждай личностные качества как факты и не используй чувствительные характеристики. Поведенческие выводы формулируй только как рабочие гипотезы для проверки на 1:1.

Ответ дай на русском языке в 6 коротких разделах:
1. Итог по обучению.
2. Зоны развития.
3. Рабочий профиль по данным обучения.
4. Что проверить на 1:1 — 3 вопроса.
5. План развития на 7 дней — 3 действия.
6. Контроль через 7 дней.
Пиши конкретно, профессионально, без воды. Не более 450 слов.`;

    const userMsg = JSON.stringify({
      employee: { firstname: emp.firstname, surname: emp.surname, role: emp.role, store: emp.store || "—", city: emp.city || "—", brand: emp.brand || "—" },
      summary: local.summary,
      results,
    }, null, 2);

    try {
      const text = await callClaude([{ role: "user", content: userMsg }], { system, maxTokens: 1400 });
      return res.status(200).json({ analysis: text.trim(), summary: local.summary, provider: "Anthropic", fallback: false });
    } catch (aiErr) {
      return res.status(200).json({ ...local, fallback: true, aiWarning: aiErr.message || "Внешний ИИ недоступен" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Ошибка анализа сотрудника" });
  }
}
