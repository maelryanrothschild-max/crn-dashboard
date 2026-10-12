import { createSessionCookie, safeUser, getRoster, isOwnerModerator } from "../../lib/auth";
import { recordLoginEvent } from "../../lib/securityAudit";
import { resolveDirectorScope } from "../../lib/directorScope";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });
  try {
    const { surname, pin } = req.body || {};
    const roster = await getRoster();

    const s = String(surname || "").trim().toLowerCase();
    const p = String(pin || "").trim();
    const found = roster.find((e) => String(e.surname || "").trim().toLowerCase() === s && String(e.pin || "") === p);
    if (!found) { await recordLoginEvent("invalid_credentials"); return res.status(401).json({ error: "Неверная фамилия или личный номер." }); }

    const scoped = resolveDirectorScope(found);
    if (!isOwnerModerator(scoped)) {
      await recordLoginEvent("blocked_non_owner");
      return res.status(403).json({ error: "Доступ к дашборду временно закрыт владельцем." });
    }

    await recordLoginEvent("owner_success");
    res.setHeader("Set-Cookie", createSessionCookie(found));
    return res.status(200).json({ user: safeUser(scoped) });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка входа в систему", details: String(err) });
  }
}
