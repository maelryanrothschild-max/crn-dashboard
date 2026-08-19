import { redis } from "../../lib/redis";
import { DEFAULT_ROSTER } from "../../lib/defaultRoster";
import { createSessionCookie, safeUser } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    const { surname, pin } = req.body || {};
    let roster = await redis.get("roster");
    if (!roster) {
      roster = DEFAULT_ROSTER;
      await redis.set("roster", roster);
    }

    const s = String(surname || "").trim().toLowerCase();
    const p = String(pin || "").trim();
    const found = roster.find((e) => String(e.surname || "").trim().toLowerCase() === s && String(e.pin || "") === p);

    if (!found) {
      return res.status(401).json({ error: "Неверная фамилия или личный номер." });
    }

    res.setHeader("Set-Cookie", createSessionCookie(found));
    return res.status(200).json({ user: safeUser(found) });
  } catch (err) {
    return res.status(500).json({
      error: "Ошибка входа в систему",
      details: String(err),
    });
  }
}
