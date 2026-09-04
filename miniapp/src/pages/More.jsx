import React from "react";
import { Link } from "react-router-dom";
import { ClockIcon, ChartIcon, CalculatorIcon, CardIcon, ChevronRightIcon } from "../components/Icon.jsx";

const rows = [
  { to: "/reminders", Icon: ClockIcon, label: "Регулярные платежи" },
  { to: "/report", Icon: ChartIcon, label: "Отчёт за месяц" },
  { to: "/calculator", Icon: CalculatorIcon, label: "Калькулятор" },
  { to: "/subscription", Icon: CardIcon, label: "Подписка" },
];

export default function More() {
  return (
    <div>
      {rows.map(({ to, Icon, label }) => (
        <Link className="more-row" to={to} key={to}>
          <span className="more-row-left">
            <Icon className="more-row-icon" width={20} height={20} />
            {label}
          </span>
          <ChevronRightIcon className="more-row-chevron" width={18} height={18} />
        </Link>
      ))}
    </div>
  );
}
