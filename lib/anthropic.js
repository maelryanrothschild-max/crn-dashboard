// Anthropic API wrapper for CRN Academy AI features.
// Required: ANTHROPIC_API_KEY. Optional: ANTHROPIC_MODEL.

function apiError(status, data) {
  const raw = data && data.error && data.error.message;
  let message = raw || "Ошибка обращения к Claude API";
  let code = "ANTHROPIC_ERROR";

  if (status === 401) {
    code = "ANTHROPIC_AUTH";
    message = "Anthropic отклонил API-ключ. Проверьте ANTHROPIC_API_KEY в Vercel.";
  } else if (status === 402) {
    code = "ANTHROPIC_BILLING";
    message = "На Anthropic API нет доступного баланса/биллинга. Пополните API credits в Anthropic Console.";
  } else if (status === 403) {
    code = "ANTHROPIC_FORBIDDEN";
    message = "У API-ключа нет доступа к выбранной модели или workspace. Проверьте права Anthropic Console и ANTHROPIC_MODEL.";
  } else if (status === 404) {
    code = "ANTHROPIC_MODEL";
    message = "Anthropic не нашёл выбранную модель. Проверьте ANTHROPIC_MODEL в Vercel.";
  } else if (status === 429) {
    code = "ANTHROPIC_RATE_LIMIT";
    message = "Достигнут лимит Anthropic API. Повторите запрос позже или проверьте лимиты аккаунта.";
  } else if (status === 529) {
    code = "ANTHROPIC_OVERLOADED";
    message = "Anthropic временно перегружен. Повторите запрос позже.";
  }

  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

async function callClaude(messages, { system, maxTokens = 1500 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "Функции ИИ ещё не настроены: добавьте ANTHROPIC_API_KEY в Vercel → Settings → Environment Variables и сделайте Redeploy."
    );
    err.code = "NO_API_KEY";
    throw err;
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && err.name === "AbortError") {
      const timeoutErr = new Error("Anthropic API не ответил за 45 секунд. Повторите запрос.");
      timeoutErr.code = "ANTHROPIC_TIMEOUT";
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  let data = null;
  try { data = await resp.json(); } catch {}
  if (!resp.ok) throw apiError(resp.status, data);

  const text = (data && data.content || []).map((c) => c.text || "").join("\n").trim();
  if (!text) {
    const err = new Error("Anthropic вернул пустой ответ.");
    err.code = "ANTHROPIC_EMPTY";
    throw err;
  }
  return text;
}

module.exports = { callClaude };
