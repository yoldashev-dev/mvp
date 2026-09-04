import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { HomeIcon, TargetIcon, HandshakeIcon, MoreIcon } from "./Icon.jsx";

const items = [
  { to: "/", Icon: HomeIcon, label: "Главная" },
  { to: "/goal", Icon: TargetIcon, label: "Цели" },
  { to: "/debts", Icon: HandshakeIcon, label: "Долги" },
  { to: "/more", Icon: MoreIcon, label: "Ещё" },
];

const morePaths = ["/reminders", "/report", "/calculator", "/subscription", "/more"];

export default function BottomNav() {
  const location = useLocation();
  const moreActive = morePaths.includes(location.pathname);

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
