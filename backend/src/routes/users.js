import { Router } from "express";
import db from "../db/index.js";

const router = Router();

// Создать пользователя при первом /start и включить 7-дневный триал
router.post("/register", (req, res) => {
  const { telegram_id, first_name, username } = req.body;
  if (!telegram_id) return res.status(400).json({ error: "telegram_id required" });

  const existing = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(telegram_id);
  if (existing) return res.json(existing);

  const trialEnds = new Date(Date.now() + 7 * 86400000).toISOString();
  db.prepare(
    `INSERT INTO users (telegram_id, first_name, username, trial_ends_at)
     VALUES (?, ?, ?, ?)`
  ).run(telegram_id, first_name || null, username || null, trialEnds);

  res.json(db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(telegram_id));
});

router.get("/:telegramId/status", (req, res) => {
  const user = db
    .prepare("SELECT * FROM users WHERE telegram_id = ?")
    .get(req.params.telegramId);
  if (!user) return res.status(404).json({ error: "not found" });

  const now = new Date();
  const trialActive = user.trial_ends_at && new Date(user.trial_ends_at) > now;
  const subscriptionActive = user.subscribed_until && new Date(user.subscribed_until) > now;

  res.json({
    ...user,
    access: trialActive || subscriptionActive,
    trial_active: !!trialActive,
    subscription_active: !!subscriptionActive,
  });
});

// Заглушка активации подписки (в реале — колбэк от Payme/Click после оплаты)
router.post("/:telegramId/subscribe", (req, res) => {
  const until = new Date(Date.now() + 30 * 86400000).toISOString();
  db.prepare("UPDATE users SET subscribed_until = ? WHERE telegram_id = ?").run(
    until,
    req.params.telegramId
  );
  res.json({ subscribed_until: until });
});

export default router;
