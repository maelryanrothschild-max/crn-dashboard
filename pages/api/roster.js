import { redis } from "../../lib/redis";
import { DEFAULT_ROSTER } from "../../lib/defaultRoster";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      let roster = await redis.get("roster");
      if (!roster) {
        roster = DEFAULT_ROSTER;
        await redis.set("roster", roster);
      } else {
        let changed = false;
        DEFAULT_ROSTER.forEach((def) => {
          if (!roster.some((e) => e.id === def.id)) {
            roster.push(def);
            changed = true;
          }
        });
        if (changed) await redis.set("roster", roster);
      }
      return res.status(200).json({ roster });
    }

    if (req.method === "POST") {
      const { action, employee, employees, id } = req.body || {};
      let roster = (await redis.get("roster")) || DEFAULT_ROSTER;

      if (action === "add") {
        const maxPin = roster.reduce((m, e) => Math.max(m, parseInt(e.pin, 10) || 1000), 1000);
        const pin = String(maxPin + 1);
        roster = roster.concat([{
          id: pin, pin,
          surname: employee.surname, firstname: employee.firstname, role: employee.role,
          city: employee.city || "", store: employee.store || "", brand: employee.brand || "",
        }]);
      } else if (action === "bulkAdd") {
        let maxPin = roster.reduce((m, e) => Math.max(m, parseInt(e.pin, 10) || 1000), 1000);
        const added = [];
        (employees || []).forEach((emp) => {
          if (!emp || !emp.surname || !emp.firstname) return;
          maxPin += 1;
          const pin = String(maxPin);
          const rec = {
            id: pin, pin,
            surname: emp.surname, firstname: emp.firstname, role: emp.role || "stylist",
            city: emp.city || "", store: emp.store || "", brand: emp.brand || "",
          };
          roster.push(rec);
          added.push(rec);
        });
        await redis.set("roster", roster);
        return res.status(200).json({ roster, added });
      } else if (action === "remove") {
        roster = roster.filter((e) => e.id !== id);
      } else if (action === "update") {
        roster = roster.map((e) => (e.id === id ? { ...e, ...employee } : e));
      } else {
        return res.status(400).json({ error: "Неизвестное действие" });
      }

      await redis.set("roster", roster);
      return res.status(200).json({ roster });
    }

    return res.status(405).json({ error: "Метод не поддерживается" });
  } catch (err) {
    return res.status(500).json({
      error: "Ошибка базы данных. Похоже, хранилище Redis ещё не подключено к проекту — см. README.",
      details: String(err),
    });
  }
}
