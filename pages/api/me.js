import { getCurrentUser, safeUser } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Метод не поддерживается" });
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Сессия не найдена" });
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка проверки сессии", details: String(err) });
  }
}
