import React from "react";
import { Link } from "react-router-dom";
import {
  SettingsIcon,
  ClockIcon,
  ChartIcon,
  CalculatorIcon,
  CardIcon,
  CrownIcon,
  ChevronRightIcon,
} from "../components/Icon.jsx";
import { useSettings } from "../lib/settingsContext.jsx";

const ADMIN_ID = 6079747111;

export default function More({ telegramId }) {
  const { language } = useSettings();
  const isUz = language === "uz";
  const isAdmin = Number(telegramId) === ADMIN_ID;

  const rows = [
    ...(isAdmin
      ? [
          {
            to: "/admin",
            Icon: CrownIcon,
            label: isUz ? "Administrator paneli" : "Панель администратора",
            highlight: true,
          },
        ]
      : []),
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
