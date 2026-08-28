import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.post("/", (req, res) => {
  const { telegram_id, title, amount, day_of_month } = req.body;
  if (!telegram_id || !title || !day_of_month) {
    return res.status(400).json({ error: "telegram_id, title, day_of_month required" });
  }
  const result = db
    .prepare(
      `INSERT INTO reminders (telegram_id, title, amount, day_of_month) VALUES (?, ?, ?, ?)`
    )
    .run(telegram_id, title, amount ? Math.round(amount) : null, day_of_month);

  res.json(db.prepare("SELECT * FROM reminders WHERE id = ?").get(result.lastInsertRowid));
});

router.get("/", (req, res) => {
  const { telegram_id } = req.query;
  res.json(
    db.prepare("SELECT * FROM reminders WHERE telegram_id = ? AND is_active = 1").all(telegram_id)
  );
});

router.delete("/:id", (req, res) => {
  db.prepare("UPDATE reminders SET is_active = 0 WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Используется ботом (cron): кому сегодня нужно напомнить
router.get("/due-today", (req, res) => {
  const today = new Date().getDate();
  const rows = db
    .prepare("SELECT * FROM reminders WHERE day_of_month = ? AND is_active = 1")
    .all(today);
  res.json(rows);
});

export default router;
