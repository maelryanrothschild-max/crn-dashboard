import { redis } from "../../../lib/redis";
import { requireUser, isOwnerModerator } from "../../../lib/auth";

function safeCredential(e) {
  return {
    id: String(e.id || ""),
    surname: e.surname || "",
    firstname: e.firstname || "",
    role: e.role || "",
    city: e.city || "",
    store: e.store || "",
    brand: e.brand || "",
    login: String(e.id || ""),
    pin: String(e.pin || ""),
  };
}

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!isOwnerModerator(user)) {
    return res.status(403).json({ error: "Доступ только владельцу-модератору" });
  }

  try {
    let roster = (await redis.get("roster")) || [];

    if (req.method === "GET") {
      return res.status(200).json({ credentials: roster.map(safeCredential) });
    }

    if (req.method === "POST") {
      const { id, pin } = req.body || {};
      const target = roster.find((e) => String(e.id) === String(id));
      if (!target) return res.status(404).json({ error: "Сотрудник не найден" });
      if (target.role === "moderator" && String(target.id) !== String(user.id)) {
        return res.status(403).json({ error: "Нельзя изменять другого модератора" });
      }
      const nextPin = String(pin || "").trim();
      if (!/^\d{4,12}$/.test(nextPin)) {
        return res.status(400).json({ error: "Пароль должен содержать 4–12 цифр" });
      }
      roster = roster.map((e) => String(e.id) === String(id) ? { ...e, pin: nextPin } : e);
      await redis.set("roster", roster);
      return res.status(200).json({ ok: true, credential: safeCredential({ ...target, pin: nextPin }) });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка управления доступами", details: String(err) });
  }
}
