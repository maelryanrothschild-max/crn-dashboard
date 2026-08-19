import { requireUser, isOwnerModerator } from "../../../lib/auth";
import { syncCanonicalRoster } from "../../../lib/rosterMigration";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });
  const user = await requireUser(req, res);
  if (!user) return;
  if (!isOwnerModerator(user)) return res.status(403).json({ error: "Только владелец-модератор может синхронизировать штат" });
  try {
    const result = await syncCanonicalRoster({ actorId: user.id });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: "Не удалось синхронизировать штат", details: String(err) });
  }
}
