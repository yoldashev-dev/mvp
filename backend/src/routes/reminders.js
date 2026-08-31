import { Router } from "express";
import db from "../db/index.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

function badRequest(res, message) {
  return res.status(400).json({ error: "bad_request", message });
}

router.post(
  "/",
  ah((req, res) => {
    const { telegram_id, title, amount, day_of_month } = req.body;
    if (!telegram_id || !title || !day_of_month) {
      return badRequest(res, "telegram_id, title, day_of_month обязательны");
    }
    const day = Number(day_of_month);
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      return badRequest(res, "day_of_month должен быть числом от 1 до 28");
    }

    // Пользователь мог ещё не успеть зарегистрироваться в базе (гонка при
    // первом открытии Mini App) — подстрахуемся, а не упадём с FOREIGN KEY.
    const user = db.prepare("SELECT telegram_id FROM users WHERE telegram_id = ?").get(telegram_id);
    if (!user) return badRequest(res, "Пользователь ещё не зарегистрирован — откройте приложение заново");

    const result = db
      .prepare(
        `INSERT INTO reminders (telegram_id, title, amount, day_of_month) VALUES (?, ?, ?, ?)`
      )
      .run(telegram_id, title, amount ? Math.round(amount) : null, day);

    res.json(db.prepare("SELECT * FROM reminders WHERE id = ?").get(result.lastInsertRowid));
  })
);

router.get(
  "/",
  ah((req, res) => {
    const { telegram_id } = req.query;
    if (!telegram_id) return badRequest(res, "telegram_id обязателен");
    res.json(
      db.prepare("SELECT * FROM reminders WHERE telegram_id = ? AND is_active = 1").all(telegram_id)
    );
  })
);

router.delete(
  "/:id",
  ah((req, res) => {
    db.prepare("UPDATE reminders SET is_active = 0 WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  })
);

// Используется ботом (cron): кому сегодня нужно напомнить
router.get(
  "/due-today",
  ah((req, res) => {
    const today = new Date().getDate();
    const rows = db
      .prepare("SELECT * FROM reminders WHERE day_of_month = ? AND is_active = 1")
      .all(today);
    res.json(rows);
  })
);

export default router;
