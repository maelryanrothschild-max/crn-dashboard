import { callClaude } from "../../../lib/anthropic";
import { redis } from "../../../lib/redis";
import { DEFAULT_ROSTER } from "../../../lib/defaultRoster";
import { BLOCK_META } from "../../../lib/blockMeta";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Не указан сотрудник" });

    let roster = (await redis.get("roster")) || DEFAULT_ROSTER;
    const emp = roster.find((e) => e.id === id);
    if (!emp) return res.status(404).json({ error: "Сотрудник не найден" });

    const progress = (await redis.get("progress-" + id)) || {};
    const customBlocks = (await redis.get("custom-blocks")) || [];
    const allMeta = BLOCK_META.concat(customBlocks.map((b) => ({ key: b.key, title: b.title })));

    const lines = allMeta.map((m) => {
      const p = progress[m.key];
      if (!p || typeof p.testScore !== "number") return `${m.title}: тест не пройден`;
      return `${m.title}: ${p.testScore}/10 (${p.testPassed ? "пройден" : "не пройден, нужна пересдача"})`;
    });

    const system = `Ты — методист по обучению персонала розничной сети одежды и обуви в Казахстане (CORNELI, CRINZO).
Тебе дают результаты тестирования одного сотрудника по учебным блокам (продажи, сервис, KPI, психология клиента и т.д.).
Напиши краткий, конкретный анализ на русском языке (не более 120 слов):
1) в каких блоках сотрудник силён,
2) какие 1-2 блока нужно подтянуть в первую очередь и почему,
3) одна конкретная рекомендация к действию на следующую неделю.
Пиши по-деловому, без общих фраз и воды, обращение на "вы", простым связным текстом, без markdown-разметки и заголовков.`;

    const userMsg = `Сотрудник: ${emp.firstname} ${emp.surname}, должность: ${emp.role}, магазин: ${emp.store || "—"}, город: ${emp.city || "—"}.\n\nРезультаты по блокам:\n${lines.join("\n")}`;

    const text = await callClaude([{ role: "user", content: userMsg }], { system, maxTokens: 500 });
    return res.status(200).json({ analysis: text.trim() });
  } catch (err) {
    return res.status(err.code === "NO_API_KEY" ? 400 : 500).json({ error: err.message });
  }
}
