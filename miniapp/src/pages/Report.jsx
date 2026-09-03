import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage, BACKEND_URL } from "../lib/api.js";
import { openLink } from "../lib/telegram.js";
import { useToast } from "../lib/toast.jsx";

export default function Report({ telegramId }) {
  const showToast = useToast();
  const [report, setReport] = useState(null);
  const [chart, setChart] = useState(null);
  const [chartDays, setChartDays] = useState(7);
  const [exporting, setExporting] = useState(null); // 'pdf' | 'xlsx' | null

  useEffect(() => {
    api
      .get("/api/transactions/report/monthly", { params: { telegram_id: telegramId } })
      .then((r) => setReport(r.data))
      .catch((err) => showToast(errorMessage(err)));
  }, [telegramId]);

  useEffect(() => {
    api
      .get("/api/transactions/report/chart", { params: { telegram_id: telegramId, days: chartDays } })
      .then((r) => setChart(r.data))
      .catch((err) => showToast(errorMessage(err)));
  }, [telegramId, chartDays]);

  const exportReport = async (format) => {
    setExporting(format);
    try {
      openLink(`${BACKEND_URL}/api/transactions/report/export?telegram_id=${telegramId}&format=${format}`);
    } finally {
      setTimeout(() => setExporting(null), 800);
    }
  };

  if (!report) return null;

  const maxValue = chart ? Math.max(1, ...chart.flatMap((d) => [d.income, d.expense])) : 1;

  return (
    <div>
      <div className="card">
        <p className="card-title">Этот месяц</p>
        <p style={{ margin: "0 0 4px" }}>
          Заработали: <strong>{fmt(report.income)} сум</strong>{" "}
          <ChangeBadge pct={report.change.income_pct} />
        </p>
        <p style={{ margin: "0 0 4px" }}>
          Потратили: <strong>{fmt(report.expense)} сум</strong>{" "}
          <ChangeBadge pct={report.change.expense_pct} inverse />
        </p>
        <p style={{ margin: 0, color: report.profit >= 0 ? "var(--accent)" : "var(--accent-alert)" }}>
          Прибыль: <strong>{fmt(report.profit)} сум</strong>{" "}
          <ChangeBadge pct={report.change.profit_pct} />
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
          По сравнению с прошлым месяцем ({fmt(report.previous_month.profit)} сум прибыли)
        </p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p className="card-title" style={{ margin: 0 }}>По дням</p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={"tab-btn" + (chartDays === 7 ? " active" : "")}
              onClick={() => setChartDays(7)}
            >
              7 дн
            </button>
            <button
              className={"tab-btn" + (chartDays === 30 ? " active" : "")}
              onClick={() => setChartDays(30)}
            >
              30 дн
            </button>
          </div>
        </div>

        {chart && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: chartDays === 30 ? 2 : 6, height: 110 }}>
            {chart.map((d) => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ width: "100%", height: 90, display: "flex", alignItems: "flex-end", gap: 1 }}>
                  <div
                    title={`Доход: ${fmt(d.income)}`}
                    style={{
                      flex: 1,
                      background: "var(--accent)",
                      height: `${(d.income / maxValue) * 100}%`,
                      borderRadius: "2px 2px 0 0",
                      minHeight: d.income > 0 ? 2 : 0,
                    }}
                  />
                  <div
                    title={`Расход: ${fmt(d.expense)}`}
                    style={{
                      flex: 1,
                      background: "var(--ink)",
                      height: `${(d.expense / maxValue) * 100}%`,
                      borderRadius: "2px 2px 0 0",
                      minHeight: d.expense > 0 ? 2 : 0,
                    }}
                  />
                </div>
                {chartDays === 7 && (
                  <span style={{ fontSize: 9, color: "var(--hint)" }}>{d.day.slice(8, 10)}</span>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12 }}>
          <span><span style={{ color: "var(--accent)" }}>■</span> Доход</span>
          <span><span style={{ color: "var(--ink)" }}>■</span> Расход</span>
        </div>
      </div>

      {report.categories.length > 0 && (
        <div className="card">
          <p className="card-title">Расходы по категориям</p>
          {report.categories.map((c) => (
            <div className="list-row" key={c.category}>
              <span>{c.category}</span>
              <span>{fmt(c.amount)} сум</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <p className="card-title">Экспорт</p>
        <p className="muted" style={{ marginBottom: 10 }}>
          Скачать отчёт за этот месяц — например, чтобы показать бухгалтеру
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary-btn" onClick={() => exportReport("pdf")} disabled={exporting === "pdf"}>
            {exporting === "pdf" ? "Открываю…" : "PDF"}
          </button>
          <button className="secondary-btn" onClick={() => exportReport("xlsx")} disabled={exporting === "xlsx"}>
            {exporting === "xlsx" ? "Открываю…" : "Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangeBadge({ pct, inverse = false }) {
  if (pct === 0) return <span className="muted" style={{ fontSize: 12 }}>без изменений</span>;
  const isGood = inverse ? pct < 0 : pct > 0;
  return (
    <span className={"pill " + (isGood ? "pill-green" : "pill-red")}>
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}
