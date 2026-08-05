import { callClaude } from "../../../lib/anthropic";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    const { topic } = req.body || {};
    if (!topic || !topic.trim()) return res.status(400).json({ error: "Укажите тему нового блока" });

    const system = `Ты — методист корпоративного обучения для премиальной розничной сети одежды и обуви в Казахстане (бренды CORNELI и CRINZO).
Тебе нужно сгенерировать НОВЫЙ учебный блок для дашборда обучения стилистов на заданную тему.

Отвечай СТРОГО в формате JSON, без пояснений до или после, без markdown-разметки, без \`\`\`.

Формат объекта:
{
  "key": "korotkiy_klyuch_latinicey_bez_probelov",
  "title": "Название блока на русском",
  "theory": ["4 коротких пункта теории"],
  "script": {"who": "Ситуация/контекст", "line": "Готовая фраза-скрипт"},
  "caseStudy": {"scenario": "Короткое описание реального кейса из розницы", "question": "Вопрос к стажёру по кейсу"},
  "checklist": ["4 пункта чек-листа для самопроверки"],
  "quiz": [
    {"q": "Текст вопроса 1", "options": ["Вариант A","Вариант B","Вариант C","Вариант D"], "correct": 0},
    "... ровно 10 таких объектов суммарно ..."
  ]
}

Требования к содержанию:
- Контент практичный, без "воды", подходит для реальной работы в магазине одежды/обуви.
- Учитывай специфику розницы Казахстана, где уместно (тенге, менталитет покупателя, локальные примеры).
- "correct" — индекс правильного варианта в массиве options (от 0 до 3).
- Ровно 10 вопросов в quiz, ровно 4 варианта в каждом options.
- key должен быть уникальным и осмысленным (например: psychology_kz, service_recovery, upsell_accessories_2).`;

    const userMsg = `Тема нового учебного блока: ${topic.trim()}`;
    const text = await callClaude([{ role: "user", content: userMsg }], { system, maxTokens: 3000 });

    let block;
    try {
      const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      block = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: "ИИ вернул ответ в неожиданном формате. Попробуйте ещё раз или переформулируйте тему.", raw: text });
    }

    if (!block.key || !block.title || !Array.isArray(block.quiz)) {
      return res.status(502).json({ error: "ИИ вернул неполный блок. Попробуйте ещё раз.", raw: text });
    }

    return res.status(200).json({ block });
  } catch (err) {
    return res.status(err.code === "NO_API_KEY" ? 400 : 500).json({ error: err.message });
  }
}
