// Обёртка над Anthropic API. Требует переменную окружения ANTHROPIC_API_KEY
// (Vercel → Settings → Environment Variables). Без ключа ИИ-функции
// (генерация новых тестов, анализ сотрудника) аккуратно отключаются и
// показывают понятное сообщение — весь остальной дашборд работает как обычно.

async function callClaude(messages, { system, maxTokens = 1500 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "Функции ИИ ещё не настроены: добавьте ANTHROPIC_API_KEY в Vercel → Settings → Environment Variables, затем сделайте Redeploy."
    );
    err.code = "NO_API_KEY";
    throw err;
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error((data && data.error && data.error.message) || "Ошибка обращения к Claude API");
  }
  return (data.content || []).map((c) => c.text || "").join("\n");
}

module.exports = { callClaude };
