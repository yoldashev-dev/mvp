import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const items = [
  { to: "/", icon: "🏠", label: "Главная" },
  { to: "/goal", icon: "🎯", label: "Цели" },
  { to: "/debts", icon: "🤝", label: "Долги" },
  { to: "/more", icon: "⋯", label: "Ещё" },
];

const morePaths = ["/reminders", "/report", "/calculator", "/subscription", "/more"];

export default function BottomNav() {
  const location = useLocation();
  const moreActive = morePaths.includes(location.pathname);

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        if (item.to === "/more") {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={"nav-item" + (moreActive ? " active" : "")}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        }
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
