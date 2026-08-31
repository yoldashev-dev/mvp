import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";

export default function Report({ telegramId }) {
  const showToast = useToast();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api
      .get("/api/transactions/report/monthly", { params: { telegram_id: telegramId } })
      .then((r) => setReport(r.data))
      .catch((err) => showToast(errorMessage(err)));
  }, [telegramId]);

  if (!report) return null;

  return (
    <div>
      <div className="card">
        <p className="card-title">Этот месяц</p>
        <p style={{ margin: "0 0 4px" }}>
          Заработали: <strong>{fmt(report.income)} сум</strong>
        </p>
        <p style={{ margin: "0 0 4px" }}>
          Потратили: <strong>{fmt(report.expense)} сум</strong>
        </p>
        <p style={{ margin: 0, color: report.profit >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
          Прибыль: <strong>{fmt(report.profit)} сум</strong>
        </p>
      </div>
      <div className="card">
        <p className="muted">
          Совет: если хочешь понимать, куда уходят деньги подробнее — добавляй категорию при вводе
          расхода (аренда, товар, зарплата). Эта функция появится в следующей версии.
        </p>
      </div>
    </div>
  );
}
