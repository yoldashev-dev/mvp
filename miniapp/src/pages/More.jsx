import React from "react";
import { Link } from "react-router-dom";
import {
  SettingsIcon,
  ClockIcon,
  ChartIcon,
  CalculatorIcon,
  CardIcon,
  ChevronRightIcon,
} from "../components/Icon.jsx";
import { useSettings } from "../lib/settingsContext.jsx";

export default function More() {
  const { language } = useSettings();
  const isUz = language === "uz";

  const rows = [
    { to: "/settings", Icon: SettingsIcon, label: isUz ? "Sozlamalar" : "Настройки" },
    { to: "/reminders", Icon: ClockIcon, label: isUz ? "Muntazam to'lovlar" : "Регулярные платежи" },
    { to: "/report", Icon: ChartIcon, label: isUz ? "Oylik hisobot" : "Отчёт за месяц" },
    { to: "/calculator", Icon: CalculatorIcon, label: isUz ? "Kalkulyator" : "Калькулятор" },
    { to: "/subscription", Icon: CardIcon, label: isUz ? "Obuna" : "Подписка" },
  ];

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
