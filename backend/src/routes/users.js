import { Router } from "express";
import db from "../db/index.js";
import { ah } from "../lib/asyncHandler.js";
import { getUserAccessStatus, calculateUserStatus, DAY_MS } from "../lib/userAccess.js";

const router = Router();

const TRIAL_DAYS = 7;

// Создать пользователя при первом /start и включить триал
router.post(
  "/register",
  ah((req, res) => {
    const { telegram_id, first_name, username, language, currency, theme } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "bad_request", message: "telegram_id required" });

    const existing = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(telegram_id);
    if (existing) return res.json(existing);

    const trialEnds = new Date(Date.now() + TRIAL_DAYS * DAY_MS).toISOString();
    db.prepare(
      `INSERT INTO users (telegram_id, first_name, username, trial_ends_at, language, currency, theme)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      telegram_id,
      first_name || null,
      username || null,
      trialEnds,
      language || "ru",
      currency || "uzs",
      theme || "light"
    );

    res.json(db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(telegram_id));
  })
);

// Получить настройки пользователя
router.get(
  "/:telegramId/settings",
  ah((req, res) => {
    const user = db.prepare("SELECT language, currency, theme FROM users WHERE telegram_id = ?").get(req.params.telegramId);
    if (!user) return res.status(404).json({ error: "not_found", message: "Пользователь не найден" });
    res.json({
      language: user.language || "ru",
      currency: user.currency || "uzs",
      theme: user.theme || "light",
    });
  })
);

// Обновить настройки пользователя (язык, валюта, тема)
router.patch(
  "/:telegramId/settings",
  ah((req, res) => {
    const { language, currency, theme } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(req.params.telegramId);
    if (!user) return res.status(404).json({ error: "not_found", message: "Пользователь не найден" });

    const validLangs = ["ru", "uz"];
    const validCurrs = ["uzs", "rub"];
    const validThemes = ["light", "dark"];

    const newLang = language && validLangs.includes(language) ? language : (user.language || "ru");
    const newCurr = currency && validCurrs.includes(currency) ? currency : (user.currency || "uzs");
    const newTheme = theme && validThemes.includes(theme) ? theme : (user.theme || "light");

    db.prepare(
      "UPDATE users SET language = ?, currency = ?, theme = ? WHERE telegram_id = ?"
    ).run(newLang, newCurr, newTheme, req.params.telegramId);

    const updated = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(req.params.telegramId);
    res.json(updated);
  })
);

router.get(
  "/:telegramId/status",
  ah((req, res) => {
    const status = getUserAccessStatus(req.params.telegramId);
    if (!status) return res.status(404).json({ error: "not_found", message: "Пользователь не найден" });
    res.json(status);
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
    const updated = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(req.params.telegramId);
    res.json(calculateUserStatus(updated));
  })
);

export default router;
