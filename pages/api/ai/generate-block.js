import { callClaude } from "../../../lib/anthropic";
import { requireUser, isOwnerModerator } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    const requester = await requireUser(req, res);
    if (!requester) return;
    if (!isOwnerModerator(requester)) {
      return res.status(403).json({ error: "Создание тестов через ИИ доступно только модератору" });
    }

    const { topic } = req.body || {};
    if (!topic || !topic.trim()) return res.status(400).json({ error: "Укажите тему нового блока" });

    const system = `Ты — старший методист CRN Academy для премиального fashion-retail в Казахстане (CORNELI и CRINZO).
Создай практический учебный блок на заданную тему для стилистов/администраторов магазинов.

Отвечай СТРОГО JSON без markdown и пояснений:
{
  "key": "unique_key_latin",
  "title": "Название блока",
  "theory": ["4-6 конкретных тезисов"],
  "script": {"who": "Контекст", "line": "Готовая фраза сотрудника"},
  "caseStudy": {"scenario": "Реальный retail-кейс", "question": "Вопрос по кейсу"},
  "checklist": ["4-6 наблюдаемых действий"],
  "quiz": [
    {"q": "Вопрос", "options": ["A","B","C","D"], "correct": 0, "explanation": "Почему ответ верный"}
  ]
}

Правила качества:
- ровно 10 вопросов;
- ровно 4 варианта ответа;
- один однозначно лучший ответ;
- вопросы проверяют применение знаний, а не угадывание терминов;
- минимум 4 вопроса должны быть ситуационными;
- никакой воды и очевидных вариантов-шуток;
- учитывай премиальный сервис, CRM, удалённую оплату, выездной гардероб, ателье/подшив, доставку покупок клиенту, когда это релевантно теме;
- не добавляй скидки как основной инструмент продажи;
- correct — индекс 0-3;
- explanation — короткое учебное объяснение.`;

    const text = await callClaude(
      [{ role: "user", content: `Тема нового учебного блока: ${topic.trim()}` }],
      { system, maxTokens: 3600 }
    );

    let block;
    try {
      const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      block = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: "ИИ вернул некорректный JSON. Повторите генерацию." });
    }

    if (!block.key || !block.title || !Array.isArray(block.quiz) || block.quiz.length !== 10) {
      return res.status(502).json({ error: "ИИ вернул неполный учебный блок" });
    }

    const quizValid = block.quiz.every((q) =>
      q && typeof q.q === "string" && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3
    );
    if (!quizValid) return res.status(502).json({ error: "ИИ вернул некорректную структуру теста" });

    return res.status(200).json({ block, status: "draft" });
  } catch (err) {
    const status = err.code === "NO_API_KEY" ? 400 : err.status === 401 ? 401 : err.status === 403 ? 403 : err.status === 429 ? 429 : 500;
    return res.status(status).json({ error: err.message || "Ошибка генерации теста", code: err.code || null });
  }
}
