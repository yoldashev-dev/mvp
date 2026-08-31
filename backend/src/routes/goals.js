import { Router } from "express";
import db from "../db/index.js";
import { getGoalProjection } from "../logic/advisor.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

function badRequest(res, message) {
  return res.status(400).json({ error: "bad_request", message });
}

// Создать цель ("Хочу холодильник побольше"). Целей может быть несколько сразу.
router.post(
  "/",
  ah((req, res) => {
    const { telegram_id, title, target_amount } = req.body;
    if (!telegram_id || !title || !target_amount) {
      return badRequest(res, "telegram_id, title, target_amount обязательны");
    }
    if (Number(target_amount) <= 0) {
      return badRequest(res, "target_amount должен быть больше нуля");
    }

    const result = db
      .prepare(
        `INSERT INTO goals (telegram_id, title, target_amount) VALUES (?, ?, ?)`
      )
      .run(telegram_id, title, Math.round(target_amount));

    res.json(db.prepare("SELECT * FROM goals WHERE id = ?").get(result.lastInsertRowid));
  })
);

// Список всех активных целей с прогнозом по каждой
router.get(
  "/active",
  ah((req, res) => {
    const { telegram_id } = req.query;
    if (!telegram_id) return badRequest(res, "telegram_id обязателен");

    const goals = db
      .prepare(
        `SELECT * FROM goals WHERE telegram_id = ? AND is_active = 1 ORDER BY created_at ASC`
      )
      .all(telegram_id);

    const result = goals.map((goal) => ({
      goal,
      projection: getGoalProjection(telegram_id, goal, goals.length),
    }));

    res.json(result);
  })
);

// Завершённые/отменённые цели — для истории
router.get(
  "/history",
  ah((req, res) => {
    const { telegram_id } = req.query;
    if (!telegram_id) return badRequest(res, "telegram_id обязателен");
    res.json(
      db
        .prepare(
          `SELECT * FROM goals WHERE telegram_id = ? AND is_active = 0 ORDER BY created_at DESC`
        )
        .all(telegram_id)
    );
  })
);

// Ручное пополнение накоплений на цель
router.post(
  "/:id/save",
  ah((req, res) => {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) return badRequest(res, "amount должен быть больше нуля");

    db.prepare("UPDATE goals SET saved_amount = saved_amount + ? WHERE id = ?").run(
      Math.round(amount),
      req.params.id
    );
    res.json(db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id));
  })
);

// Отменить цель, не доводя до конца (просто убрать из списка активных)
router.post(
  "/:id/cancel",
  ah((req, res) => {
    db.prepare("UPDATE goals SET is_active = 0, status = 'cancelled' WHERE id = ?").run(
      req.params.id
    );
    res.json({ ok: true });
  })
);

// Отметить цель купленной
router.post(
  "/:id/purchase",
  ah((req, res) => {
    db.prepare("UPDATE goals SET is_active = 0, status = 'purchased' WHERE id = ?").run(
      req.params.id
    );
    res.json({ ok: true });
  })
);

export default router;
