import { Router } from "express";
import db from "../db/index.js";
import { ah } from "../lib/asyncHandler.js";
import { ADMIN_TELEGRAM_ID, DAY_MS, calculateUserStatus } from "../lib/userAccess.js";

const router = Router();

// Middleware: проверка, что запрос идёт от администратора (6079747111)
function checkAdmin(req, res, next) {
  const adminId =
    req.headers["x-admin-id"] ||
    req.headers["x-telegram-id"] ||
    req.query.admin_id ||
    req.body?.admin_id;

  if (!adminId || Number(adminId) !== ADMIN_TELEGRAM_ID) {
    return res.status(403).json({
      error: "forbidden",
      message: "Доступ запрещён. Панель управления доступна только администратору.",
    });
  }
  next();
}

router.use(checkAdmin);

// Сводная статистика пользователей
router.get(
  "/stats",
  ah((req, res) => {
    const users = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    let total = 0;
    let active = 0;
    let expired = 0;
    let subscribed = 0;
    let trial = 0;

    for (const u of users) {
      total++;
      const st = calculateUserStatus(u);
      if (st.is_admin) {
        active++;
        continue;
      }
      if (st.subscription_active) {
        subscribed++;
        active++;
      } else if (st.trial_active) {
        trial++;
        active++;
      } else {
        expired++;
      }
    }

    res.json({
      total_users: total,
      active_users: active,
      expired_users: expired,
      subscribed_users: subscribed,
      trial_users: trial,
      admin_id: ADMIN_TELEGRAM_ID,
    });
  })
);

// Список пользователей с поиском и фильтром
router.get(
  "/users",
  ah((req, res) => {
    const { search = "", filter = "all" } = req.query;
    const users = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();

    const formatted = users.map(calculateUserStatus);

    const filtered = formatted.filter((u) => {
      // Поиск по имени, username или ID
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const idMatch = String(u.telegram_id).includes(q);
        const nameMatch = u.first_name && u.first_name.toLowerCase().includes(q);
        const userMatch = u.username && u.username.toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !userMatch) return false;
      }

      // Фильтрация по статусу
      if (filter === "expired") {
        return !u.is_admin && !u.access;
      }
      if (filter === "active") {
        return u.access;
      }
      if (filter === "subscribed") {
        return u.subscription_active;
      }
      if (filter === "trial") {
        return u.trial_active && !u.subscription_active;
      }
      return true;
    });

    res.json(filtered);
  })
);

// Продлить / активировать подписку на N дней (по умолчанию 30)
router.post(
  "/users/:telegramId/grant",
  ah((req, res) => {
    const targetId = req.params.telegramId;
    const days = Math.max(1, Number(req.body?.days) || 30);

    const user = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(targetId);
    if (!user) {
      return res.status(404).json({ error: "not_found", message: "Пользователь не найден" });
    }

    const now = Date.now();
    const currentSubMs = user.subscribed_until ? new Date(user.subscribed_until).getTime() : 0;
    // Если подписка ещё действует — продлеваем от даты окончания, иначе — от текущего момента
    const baseMs = currentSubMs > now ? currentSubMs : now;
    const newUntil = new Date(baseMs + days * DAY_MS).toISOString();

    db.prepare("UPDATE users SET subscribed_until = ? WHERE telegram_id = ?").run(newUntil, targetId);

    const updated = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(targetId);
    res.json({
      success: true,
      message: `Подписка успешно продлена на ${days} дней.`,
      user: calculateUserStatus(updated),
    });
  })
);

// Отозвать доступ (заблокировать)
router.post(
  "/users/:telegramId/revoke",
  ah((req, res) => {
    const targetId = req.params.telegramId;
    const user = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(targetId);
    if (!user) {
      return res.status(404).json({ error: "not_found", message: "Пользователь не найден" });
    }

    const pastDate = new Date(Date.now() - DAY_MS).toISOString();
    db.prepare(
      "UPDATE users SET subscribed_until = NULL, trial_ends_at = ? WHERE telegram_id = ?"
    ).run(pastDate, targetId);

    const updated = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(targetId);
    res.json({
      success: true,
      message: "Доступ пользователя отозван.",
      user: calculateUserStatus(updated),
    });
  })
);

// Сбросить / дать 7 дней триала
router.post(
  "/users/:telegramId/set-trial",
  ah((req, res) => {
    const targetId = req.params.telegramId;
    const days = Math.max(1, Number(req.body?.days) || 7);
    const user = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(targetId);
    if (!user) {
      return res.status(404).json({ error: "not_found", message: "Пользователь не найден" });
    }

    const newTrialEnds = new Date(Date.now() + days * DAY_MS).toISOString();
    db.prepare("UPDATE users SET trial_ends_at = ? WHERE telegram_id = ?").run(newTrialEnds, targetId);

    const updated = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(targetId);
    res.json({
      success: true,
      message: `Пробный период обновлен на ${days} дней.`,
      user: calculateUserStatus(updated),
    });
  })
);

export default router;
