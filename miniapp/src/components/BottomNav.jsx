import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", icon: "🏠", label: "Главная" },
  { to: "/goal", icon: "🎯", label: "Цель" },
  { to: "/reminders", icon: "⏰", label: "Платежи" },
  { to: "/report", icon: "📊", label: "Отчёт" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
