import React from "react";
import { Link } from "react-router-dom";

const rows = [
  { to: "/reminders", icon: "⏰", label: "Регулярные платежи" },
  { to: "/report", icon: "📊", label: "Отчёт за месяц" },
  { to: "/calculator", icon: "🧮", label: "Калькулятор" },
  { to: "/subscription", icon: "💳", label: "Подписка" },
];

export default function More() {
  return (
    <div>
      {rows.map((r) => (
        <Link className="more-row" to={r.to} key={r.to}>
          <span className="more-row-left">
            <span className="more-row-icon">{r.icon}</span>
            {r.label}
          </span>
          <span className="more-row-chevron">›</span>
        </Link>
      ))}
    </div>
  );
}
