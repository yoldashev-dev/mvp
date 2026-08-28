import { Router } from "express";
import db from "../db/index.js";
import { getGoalProjection } from "../logic/advisor.js";

const router = Router();

// Создать цель ("Хочу холодильник побольше")
router.post("/", (req, res) => {
  const { telegram_id, title, target_amount } = req.body;
  if (!telegram_id || !title || !target_amount) {
    return res.status(400).json({ error: "telegram_id, title, target_amount required" });
  }

  // деактивируем предыдущие активные цели — фокус на одной за раз
  db.prepare("UPDATE goals SET is_active = 0 WHERE telegram_id = ?").run(telegram_id);

  const result = db
    .prepare(
      `INSERT INTO goals (telegram_id, title, target_amount) VALUES (?, ?, ?)`
    )
    .run(telegram_id, title, Math.round(target_amount));

  res.json(db.prepare("SELECT * FROM goals WHERE id = ?").get(result.lastInsertRowid));
});

router.get("/active", (req, res) => {
  const { telegram_id } = req.query;
  const goal = db
    .prepare(
      `SELECT * FROM goals WHERE telegram_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`
    )
    .get(telegram_id);

  if (!goal) return res.json(null);

  const projection = getGoalProjection(telegram_id, goal);
  res.json({ goal, projection });
});

// Ручное пополнение накоплений на цель (если пользователь физически отложил деньги)
router.post("/:id/save", (req, res) => {
  const { amount } = req.body;
  db.prepare("UPDATE goals SET saved_amount = saved_amount + ? WHERE id = ?").run(
    Math.round(amount),
    req.params.id
  );
  res.json(db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id));
});

export default router;
