import { Router } from "express";
import db from "../db/index.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

const DAY_MS = 86400000;
const TRIAL_DAYS = 7;

// Создать пользователя при первом /start и включить триал
router.post(
  "/register",
  ah((req, res) => {
    const { telegram_id, first_name, username } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "bad_request", message: "telegram_id required" });

    const existing = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(telegram_id);
    if (existing) return res.json(existing);

    const trialEnds = new Date(Date.now() + TRIAL_DAYS * DAY_MS).toISOString();
    db.prepare(
      `INSERT INTO users (telegram_id, first_name, username, trial_ends_at)
       VALUES (?, ?, ?, ?)`
    ).run(telegram_id, first_name || null, username || null, trialEnds);

    res.json(db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(telegram_id));
  })
);

router.get(
  "/:telegramId/status",
  ah((req, res) => {
    const user = db
      .prepare("SELECT * FROM users WHERE telegram_id = ?")
      .get(req.params.telegramId);
    if (!user) return res.status(404).json({ error: "not_found", message: "Пользователь не найден" });

    const now = Date.now();
    const trialEndsMs = user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : 0;
    const subscribedUntilMs = user.subscribed_until ? new Date(user.subscribed_until).getTime() : 0;

    const trialActive = trialEndsMs > now;
    const subscriptionActive = subscribedUntilMs > now;

    // Считаем целые дни с округлением ВВЕРХ, чтобы "осталось меньше суток"
    // всё ещё показывалось как "1 день", а не как "0 дней" — это и был баг,
    // из-за которого триал казался короче на день.
    const trialDaysLeft = trialActive ? Math.max(1, Math.ceil((trialEndsMs - now) / DAY_MS)) : 0;
    const subscriptionDaysLeft = subscriptionActive
      ? Math.max(1, Math.ceil((subscribedUntilMs - now) / DAY_MS))
      : 0;

    res.json({
      ...user,
      access: trialActive || subscriptionActive,
      trial_active: trialActive,
      subscription_active: subscriptionActive,
      trial_days_left: trialDaysLeft,
      subscription_days_left: subscriptionDaysLeft,
    });
  })
);

// Заглушка активации подписки (в реале — колбэк от Payme/Click после оплаты)
router.post(
  "/:telegramId/subscribe",
  ah((req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(req.params.telegramId);
    if (!user) return res.status(404).json({ error: "not_found", message: "Пользователь не найден" });

    // Если подписка уже активна — продлеваем от даты её окончания, а не от "сейчас"
    const base =
      user.subscribed_until && new Date(user.subscribed_until).getTime() > Date.now()
        ? new Date(user.subscribed_until).getTime()
        : Date.now();

    const until = new Date(base + 30 * DAY_MS).toISOString();
    db.prepare("UPDATE users SET subscribed_until = ? WHERE telegram_id = ?").run(
      until,
      req.params.telegramId
    );
    res.json({ subscribed_until: until });
  })
);

export default router;
