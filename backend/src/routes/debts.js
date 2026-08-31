import { Router } from "express";
import db from "../db/index.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

function badRequest(res, message) {
  return res.status(400).json({ error: "bad_request", message });
}

function balanceOf(debtorId) {
  const rows = db
    .prepare("SELECT type, amount FROM debt_entries WHERE debtor_id = ?")
    .all(debtorId);
  return rows.reduce((s, r) => s + (r.type === "lent" ? r.amount : -r.amount), 0);
}

// Добавить человека, которому дали в долг.
// Если человек с таким именем уже есть в активном списке — не создаём
// дубликат, а просто добавляем новую запись долга к уже существующему.
router.post(
  "/people",
  ah((req, res) => {
    const { telegram_id, name, amount, note } = req.body;
    if (!telegram_id || !name) return badRequest(res, "telegram_id и name обязательны");

    const user = db.prepare("SELECT telegram_id FROM users WHERE telegram_id = ?").get(telegram_id);
    if (!user) return badRequest(res, "Пользователь ещё не зарегистрирован — откройте приложение заново");

    const cleanName = name.trim();

    // Ищем без учёта регистра среди уже активных должников этого продавца.
    // Важно: делаем сравнение в JS, а не через SQL lower() — встроенный
    // lower() в SQLite корректно работает только с ASCII и не понимает
    // кириллицу ("Юлдаш" и "юлдаш" не совпали бы через SQL lower()).
    const activeDebtors = db
      .prepare("SELECT * FROM debtors WHERE telegram_id = ? AND is_active = 1")
      .all(telegram_id);
    const existing = activeDebtors.find(
      (d) => d.name.toLowerCase() === cleanName.toLowerCase()
    );

    const debtorId = existing ? existing.id : db
      .prepare("INSERT INTO debtors (telegram_id, name) VALUES (?, ?)")
      .run(telegram_id, cleanName).lastInsertRowid;

    if (amount && Number(amount) > 0) {
      db.prepare(
        "INSERT INTO debt_entries (debtor_id, telegram_id, type, amount, note) VALUES (?, ?, 'lent', ?, ?)"
      ).run(debtorId, telegram_id, Math.round(amount), note || null);
    }

    res.json({
      id: debtorId,
      name: existing ? existing.name : cleanName,
      balance: balanceOf(debtorId),
      merged_with_existing: !!existing,
    });
  })
);

// Список всех должников с текущим балансом
router.get(
  "/people",
  ah((req, res) => {
    const { telegram_id } = req.query;
    if (!telegram_id) return badRequest(res, "telegram_id обязателен");

    const people = db
      .prepare("SELECT * FROM debtors WHERE telegram_id = ? AND is_active = 1 ORDER BY created_at DESC")
      .all(telegram_id);

    const withBalance = people
      .map((p) => ({ ...p, balance: balanceOf(p.id) }))
      .filter((p) => p.balance !== 0); // кто всё вернул — не засоряет список

    const total = withBalance.reduce((s, p) => s + p.balance, 0);

    res.json({ people: withBalance, total_owed: total });
  })
);

// История записей по конкретному должнику
router.get(
  "/people/:id",
  ah((req, res) => {
    const debtor = db.prepare("SELECT * FROM debtors WHERE id = ?").get(req.params.id);
    if (!debtor) return res.status(404).json({ error: "not_found", message: "Не найдено" });

    const entries = db
      .prepare("SELECT * FROM debt_entries WHERE debtor_id = ? ORDER BY created_at DESC")
      .all(req.params.id);

    res.json({ debtor, entries, balance: balanceOf(req.params.id) });
  })
);

// Добавить запись: снова дал в долг, или вернул часть/всё
router.post(
  "/people/:id/entries",
  ah((req, res) => {
    const { type, amount, note } = req.body;
    if (!["lent", "repaid"].includes(type)) return badRequest(res, "type должен быть lent или repaid");
    if (!amount || Number(amount) <= 0) return badRequest(res, "amount должен быть больше нуля");

    const debtor = db.prepare("SELECT * FROM debtors WHERE id = ?").get(req.params.id);
    if (!debtor) return res.status(404).json({ error: "not_found", message: "Не найдено" });

    db.prepare(
      "INSERT INTO debt_entries (debtor_id, telegram_id, type, amount, note) VALUES (?, ?, ?, ?, ?)"
    ).run(req.params.id, debtor.telegram_id, type, Math.round(amount), note || null);

    res.json({ balance: balanceOf(req.params.id) });
  })
);

// Убрать человека из списка — только если долг полностью погашен (баланс 0).
// Если ещё должен — не даём случайно "спрятать" долг крестиком.
router.delete(
  "/people/:id",
  ah((req, res) => {
    const debtor = db.prepare("SELECT * FROM debtors WHERE id = ?").get(req.params.id);
    if (!debtor) return res.status(404).json({ error: "not_found", message: "Не найдено" });

    const balance = balanceOf(req.params.id);
    if (balance !== 0) {
      return res.status(400).json({
        error: "debt_not_settled",
        message: "Нельзя убрать — долг ещё не выплачен полностью",
      });
    }

    db.prepare("UPDATE debtors SET is_active = 0 WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  })
);

export default router;
