import { Router } from "express";
import PDFDocument from "pdfkit";
import XLSX from "xlsx";
import db from "../db/index.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

function bad(res, message) {
  return res.status(400).json({ error: "bad_request", message });
}

router.post(
  "/",
  ah((req, res) => {
    const { telegram_id, type, amount, category, note } = req.body;
    if (!telegram_id || !type || !amount) return bad(res, "telegram_id, type, amount required");
    if (!["income", "expense"].includes(type)) return bad(res, "type must be income or expense");
    if (Number(amount) <= 0) return bad(res, "amount должен быть больше нуля");

    const result = db
      .prepare(
        `INSERT INTO transactions (telegram_id, type, amount, category, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(telegram_id, type, Math.round(amount), category || null, note || null);

    res.json(db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid));
  })
);

router.get(
  "/",
  ah((req, res) => {
    const { telegram_id, limit = 50 } = req.query;
    if (!telegram_id) return bad(res, "telegram_id required");
    const rows = db
      .prepare(
        `SELECT * FROM transactions WHERE telegram_id = ?
         ORDER BY created_at DESC LIMIT ?`
      )
      .all(telegram_id, Number(limit));
    res.json(rows);
  })
);

// Список категорий, которыми пользователь уже пользовался — для быстрого выбора
router.get(
  "/categories",
  ah((req, res) => {
    const { telegram_id, type } = req.query;
    if (!telegram_id) return bad(res, "telegram_id required");
    const rows = db
      .prepare(
        `SELECT DISTINCT category FROM transactions
         WHERE telegram_id = ? AND type = ? AND category IS NOT NULL
         ORDER BY created_at DESC LIMIT 20`
      )
      .all(telegram_id, type || "expense");
    res.json(rows.map((r) => r.category));
  })
);

function monthRange(offsetMonths = 0) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths + 1, 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function monthlyTotals(telegramId, offsetMonths = 0) {
  const { start, end } = monthRange(offsetMonths);
  const rows = db
    .prepare(
      `SELECT type, amount, category FROM transactions
       WHERE telegram_id = ? AND date(created_at) >= date(?) AND date(created_at) < date(?)`
    )
    .all(telegramId, start, end);

  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);

  const byCategory = {};
  rows
    .filter((r) => r.type === "expense")
    .forEach((r) => {
      const key = r.category || "Без категории";
      byCategory[key] = (byCategory[key] || 0) + r.amount;
    });

  return {
    income,
    expense,
    profit: income - expense,
    categories: Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}

function pctChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

// Отчёт за месяц + сравнение с прошлым месяцем + разбивка расходов по категориям
router.get(
  "/report/monthly",
  ah((req, res) => {
    const { telegram_id } = req.query;
    if (!telegram_id) return bad(res, "telegram_id required");

    const current = monthlyTotals(telegram_id, 0);
    const previous = monthlyTotals(telegram_id, -1);

    res.json({
      income: current.income,
      expense: current.expense,
      profit: current.profit,
      categories: current.categories,
      previous_month: {
        income: previous.income,
        expense: previous.expense,
        profit: previous.profit,
      },
      change: {
        income_pct: pctChange(current.income, previous.income),
        expense_pct: pctChange(current.expense, previous.expense),
        profit_pct: pctChange(current.profit, previous.profit),
      },
    });
  })
);

// Данные для графика по дням — последние 7 или 30 дней
router.get(
  "/report/chart",
  ah((req, res) => {
    const { telegram_id, days = 7 } = req.query;
    if (!telegram_id) return bad(res, "telegram_id required");
    const n = Math.min(30, Math.max(7, Number(days)));

    const since = new Date(Date.now() - (n - 1) * 86400000).toISOString().slice(0, 10);
    const rows = db
      .prepare(
        `SELECT type, amount, date(created_at) as day FROM transactions
         WHERE telegram_id = ? AND date(created_at) >= date(?)`
      )
      .all(telegram_id, since);

    const byDay = {};
    for (let i = 0; i < n; i++) {
      const d = new Date(Date.now() - (n - 1 - i) * 86400000).toISOString().slice(0, 10);
      byDay[d] = { day: d, income: 0, expense: 0 };
    }
    rows.forEach((r) => {
      if (!byDay[r.day]) return;
      byDay[r.day][r.type] += r.amount;
    });

    res.json(Object.values(byDay));
  })
);

// Для бота: у кого из активных пользователей сегодня ещё нет ни одной записи
router.get(
  "/no-entry-today",
  ah((req, res) => {
    const rows = db
      .prepare(
        `SELECT u.telegram_id FROM users u
         WHERE (u.trial_ends_at > datetime('now') OR u.subscribed_until > datetime('now'))
         AND NOT EXISTS (
           SELECT 1 FROM transactions t
           WHERE t.telegram_id = u.telegram_id AND date(t.created_at) = date('now')
         )`
      )
      .all();
    res.json(rows.map((r) => r.telegram_id));
  })
);

// Экспорт отчёта за месяц в PDF или Excel
router.get(
  "/report/export",
  ah((req, res) => {
    const { telegram_id, format = "pdf" } = req.query;
    if (!telegram_id) return bad(res, "telegram_id required");
    if (!["pdf", "xlsx"].includes(format)) return bad(res, "format должен быть pdf или xlsx");

    const report = monthlyTotals(telegram_id, 0);
    const rows = db
      .prepare(
        `SELECT type, amount, category, note, created_at FROM transactions
         WHERE telegram_id = ? AND date(created_at) >= date('now', 'start of month')
         ORDER BY created_at ASC`
      )
      .all(telegram_id);

    const monthLabel = new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

    if (format === "xlsx") {
      const sheetData = [
        ["Дата", "Тип", "Сумма", "Категория", "Заметка"],
        ...rows.map((r) => [
          r.created_at.slice(0, 10),
          r.type === "income" ? "Доход" : "Расход",
          r.amount,
          r.category || "",
          r.note || "",
        ]),
        [],
        ["Итого доход", report.income],
        ["Итого расход", report.expense],
        ["Прибыль", report.profit],
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="report-${telegram_id}.xlsx"`);
      return res.send(buffer);
    }

    // PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${telegram_id}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(`Отчёт за ${monthLabel}`, { align: "left" });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Доход: ${report.income.toLocaleString("ru-RU")} сум`);
    doc.text(`Расход: ${report.expense.toLocaleString("ru-RU")} сум`);
    doc.text(`Прибыль: ${report.profit.toLocaleString("ru-RU")} сум`);
    doc.moveDown();

    if (report.categories.length) {
      doc.fontSize(14).text("По категориям расходов:");
      doc.fontSize(12);
      report.categories.forEach((c) => {
        doc.text(`  ${c.category}: ${c.amount.toLocaleString("ru-RU")} сум`);
      });
      doc.moveDown();
    }

    doc.fontSize(14).text("Все записи:");
    doc.fontSize(10);
    rows.forEach((r) => {
      const sign = r.type === "income" ? "+" : "-";
      doc.text(
        `${r.created_at.slice(0, 10)}  ${sign}${r.amount.toLocaleString("ru-RU")} сум` +
          (r.category ? `  [${r.category}]` : "")
      );
    });

    doc.end();
  })
);

export default router;
