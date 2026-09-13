import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { HomeIcon, TargetIcon, HandshakeIcon, MoreIcon } from "./Icon.jsx";
import { useSettings } from "../lib/settingsContext.jsx";

const morePaths = ["/reminders", "/report", "/calculator", "/subscription", "/more", "/settings"];

export default function BottomNav() {
  const location = useLocation();
  const moreActive = morePaths.includes(location.pathname);
  const { language } = useSettings();
  const isUz = language === "uz";

  const items = [
    { to: "/", Icon: HomeIcon, label: isUz ? "Asosiy" : "Главная" },
    { to: "/goal", Icon: TargetIcon, label: isUz ? "Maqsadlar" : "Цели" },
    { to: "/debts", Icon: HandshakeIcon, label: isUz ? "Qarzlar" : "Долги" },
    { to: "/more", Icon: MoreIcon, label: isUz ? "Yana" : "Ещё" },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ to, Icon, label }) => {
        if (to === "/more") {
          return (
            <NavLink key={to} to={to} className={"nav-item" + (moreActive ? " active" : "")}>
              <Icon className="nav-icon" width={20} height={20} />
              <span>{label}</span>
            </NavLink>
          );
        }
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            <Icon className="nav-icon" width={20} height={20} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
