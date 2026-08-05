import { redis } from "../../lib/redis";
import { DEFAULT_ROSTER } from "../../lib/defaultRoster";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  try {
    const { surname, pin } = req.body || {};
    let roster = await redis.get("roster");
    if (!roster) {
      roster = DEFAULT_ROSTER;
      await redis.set("roster", roster);
    }

    const s = (surname || "").trim().toLowerCase();
    const p = (pin || "").trim();
    const found = roster.find((e) => e.surname.toLowerCase() === s && e.pin === p);

    if (!found) {
      return res.status(401).json({ error: "Неверная фамилия или личный номер." });
    }
    return res.status(200).json({ user: found });
  } catch (err) {
    return res.status(500).json({
      error: "Ошибка базы данных. Похоже, хранилище Redis ещё не подключено к проекту — см. README.",
      details: String(err),
    });
  }
}
