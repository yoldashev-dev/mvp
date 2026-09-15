import express from "express";
import cors from "cors";
import "dotenv/config";

import usersRouter from "./routes/users.js";
import transactionsRouter from "./routes/transactions.js";
import goalsRouter from "./routes/goals.js";
import remindersRouter from "./routes/reminders.js";
import snapshotRouter from "./routes/snapshot.js";
import debtsRouter from "./routes/debts.js";
import adminRouter from "./routes/admin.js";
import { requireAccess } from "./lib/userAccess.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);

// Защищенные бизнес-ресурсы: если срок действия подписки/триала истёк, запросы блокируются
app.use("/api/transactions", requireAccess, transactionsRouter);
app.use("/api/goals", requireAccess, goalsRouter);
app.use("/api/reminders", requireAccess, remindersRouter);
app.use("/api/snapshot", requireAccess, snapshotRouter);
app.use("/api/debts", requireAccess, debtsRouter);

// 404 — маршрут не найден (тоже JSON, а не HTML)
app.use((req, res) => {
  res.status(404).json({ error: "not_found", message: `Маршрут ${req.method} ${req.path} не найден` });
});

// Единый обработчик ошибок — ВСЕГДА отвечает JSON, никогда HTML-страницей.
// Это критично: если бы ошибка ушла как HTML, фронтенд не смог бы её
// распарсить и просто "молчал" бы при сбое — именно так проявлялся баг
// с ненажимающимися кнопками "Сохранить".
app.use((err, req, res, _next) => {
  console.error("Ошибка запроса:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: "server_error",
    message: err.message || "Внутренняя ошибка сервера",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`RentBot backend запущен на порту ${PORT}`);
});
