import express from "express";
import cors from "cors";
import "dotenv/config";

import usersRouter from "./routes/users.js";
import transactionsRouter from "./routes/transactions.js";
import goalsRouter from "./routes/goals.js";
import remindersRouter from "./routes/reminders.js";
import snapshotRouter from "./routes/snapshot.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/users", usersRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/snapshot", snapshotRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`RentBot backend запущен на порту ${PORT}`);
});
