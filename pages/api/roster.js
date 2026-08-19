import { redis } from "../../lib/redis";
import { DEFAULT_ROSTER } from "../../lib/defaultRoster";
import { requireUser, safeUser, isOwnerModerator } from "../../lib/auth";

const ALLOWED_ROLES = new Set(["stylist", "admin", "online_manager", "director"]);
const DIRECTOR_ADD_ROLES = new Set(["stylist", "admin", "online_manager"]);

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (value === "stylist" || value === "стилист" || value === "стилист-консультант") return "stylist";
  if (value === "admin" || value === "administrator" || value === "админ" || value === "администратор") return "admin";
  if (value === "online_manager" || value === "online manager" || value === "онлайн-менеджер" || value === "онлайн менеджер") return "online_manager";
  if (value === "director" || value === "директор" || value === "директор магазина") return "director";
  return null;
}

function visibleRoster(user, roster) {
  if (isOwnerModerator(user)) return roster.map(safeUser);
  if (user.role === "director") {
    if (!user.store || user.store === "Все магазины") return [safeUser(user)];
    return roster.filter((e) => e.store === user.store).map(safeUser);
  }
  return roster.filter((e) => String(e.id) === String(user.id)).map(safeUser);
}

function nextPin(roster) {
  const maxPin = roster.reduce((m, e) => Math.max(m, parseInt(e.pin, 10) || 1000), 1000);
  return String(maxPin + 1);
}

function cleanEmployeeInput(emp, user) {
  if (!emp || !emp.surname || !emp.firstname) return { error: "Укажите имя и фамилию сотрудника" };
  const role = normalizeRole(emp.role);
  if (!role || !ALLOWED_ROLES.has(role)) return { error: "Неизвестная роль сотрудника" };
  if (!isOwnerModerator(user) && !DIRECTOR_ADD_ROLES.has(role)) {
    return { error: "Директор может добавлять стилистов, администраторов и онлайн-менеджеров" };
  }

  const store = isOwnerModerator(user) ? String(emp.store || "").trim() : String(user.store || "").trim();
  if (!store || store === "Все магазины") return { error: "Для сотрудника должен быть указан конкретный магазин" };

  return {
    value: {
      surname: String(emp.surname).trim(),
      firstname: String(emp.firstname).trim(),
      role,
      city: String(emp.city || user.city || "").trim(),
      store,
      brand: String(emp.brand || user.brand || "").trim(),
    },
  };
}

function findDuplicate(roster, emp) {
  const s = emp.surname.toLowerCase();
  const f = emp.firstname.toLowerCase();
  const store = emp.store.toLowerCase();
  return roster.find((e) =>
    String(e.surname || "").trim().toLowerCase() === s &&
    String(e.firstname || "").trim().toLowerCase() === f &&
    String(e.store || "").trim().toLowerCase() === store
  );
}

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    let roster = (await redis.get("roster")) || DEFAULT_ROSTER;

    if (req.method === "GET") {
      return res.status(200).json({ roster: visibleRoster(user, roster) });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

    if (!(isOwnerModerator(user) || user.role === "director")) {
      return res.status(403).json({ error: "Недостаточно прав" });
    }

    const { action, employee, employees, id } = req.body || {};

    if (action === "add") {
      const cleaned = cleanEmployeeInput(employee, user);
      if (cleaned.error) return res.status(400).json({ error: cleaned.error });
      if (findDuplicate(roster, cleaned.value)) {
        return res.status(409).json({ error: "Такой сотрудник уже есть в этом магазине" });
      }

      const pin = nextPin(roster);
      const rec = { id: pin, pin, ...cleaned.value };
      roster.push(rec);
      await redis.set("roster", roster);
      return res.status(200).json({ roster: visibleRoster(user, roster), added: safeUser(rec), temporaryPin: pin });
    }

    if (action === "bulkAdd") {
      const added = [];
      const skipped = [];
      let maxPin = roster.reduce((m, e) => Math.max(m, parseInt(e.pin, 10) || 1000), 1000);

      for (const raw of employees || []) {
        const cleaned = cleanEmployeeInput(raw, user);
        if (cleaned.error) {
          skipped.push({ employee: raw, reason: cleaned.error });
          continue;
        }
        const duplicate = findDuplicate(roster, cleaned.value);
        if (duplicate) {
          skipped.push({ employee: raw, reason: "Сотрудник уже существует", existingId: duplicate.id });
          continue;
        }
        maxPin += 1;
        const pin = String(maxPin);
        const rec = { id: pin, pin, ...cleaned.value };
        roster.push(rec);
        added.push({ ...safeUser(rec), temporaryPin: pin });
      }

      await redis.set("roster", roster);
      return res.status(200).json({ roster: visibleRoster(user, roster), added, skipped });
    }

    if (!isOwnerModerator(user)) {
      return res.status(403).json({ error: "Только модератор может изменять или удалять существующих сотрудников" });
    }

    if (action === "remove") {
      const target = roster.find((e) => String(e.id) === String(id));
      if (!target) return res.status(404).json({ error: "Сотрудник не найден" });
      if (target.role === "moderator") return res.status(403).json({ error: "Нельзя удалить учётную запись модератора" });
      roster = roster.filter((e) => String(e.id) !== String(id));
    } else if (action === "update") {
      const target = roster.find((e) => String(e.id) === String(id));
      if (!target) return res.status(404).json({ error: "Сотрудник не найден" });
      if (target.role === "moderator") return res.status(403).json({ error: "Учётная запись модератора защищена" });

      const patch = { ...employee };
      delete patch.id;
      delete patch.pin;
      delete patch.password;
      if (patch.role) {
        const role = normalizeRole(patch.role);
        if (!role || !ALLOWED_ROLES.has(role)) return res.status(400).json({ error: "Неизвестная роль" });
        patch.role = role;
      }
      if (patch.store === "Все магазины") return res.status(400).json({ error: "У сотрудника должен быть конкретный магазин" });
      roster = roster.map((e) => String(e.id) === String(id) ? { ...e, ...patch } : e);
    } else {
      return res.status(400).json({ error: "Неизвестное действие" });
    }

    await redis.set("roster", roster);
    return res.status(200).json({ roster: visibleRoster(user, roster) });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка базы данных", details: String(err) });
  }
}
