import { syncCanonicalRoster } from "../../../lib/rosterMigration";

const ONE_TIME_KEY = "crn-2026-08-19-f6b2d7a4e95c41b38e0d1c7a72f3c9ad";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Метод не поддерживается" });
  if (String(req.query.key || "") !== ONE_TIME_KEY) return res.status(404).json({ error: "Not found" });
  try {
    const result = await syncCanonicalRoster({ actorId: "owner-approved-migration" });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: "Migration failed", details: String(err) });
  }
}
