import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.post("/", (req, res) => {
  const { telegram_id, type, amount, category, note } = req.body;
  if (!telegram_id || !type || !amount) {
    return res.status(400).json({ error: "telegram_id, type, amount required" });
  }
  if (!["income", "expense"].includes(type)) {
    return res.status(400).json({ error: "type must be income or expense" });
  }

  const result = db
    .prepare(
      `INSERT INTO transactions (telegram_id, type, amount, category, note)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(telegram_id, type, Math.round(amount), category || null, note || null);

  res.json(db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid));
});

router.get("/", (req, res) => {
  const { telegram_id, limit = 50 } = req.query;
  const rows = db
    .prepare(
      `SELECT * FROM transactions WHERE telegram_id = ?
       ORDER BY created_at DESC LIMIT ?`
    )
    .all(telegram_id, Number(limit));
  res.json(rows);
});

// Отчёт за месяц простыми словами
router.get("/report/monthly", (req, res) => {
  const { telegram_id } = req.query;
  const rows = db
    .prepare(
      `SELECT type, amount, created_at FROM transactions
       WHERE telegram_id = ? AND date(created_at) >= date('now', 'start of month')`
    )
    .all(telegram_id);

  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);

  res.json({ income, expense, profit: income - expense });
});

export default router;
