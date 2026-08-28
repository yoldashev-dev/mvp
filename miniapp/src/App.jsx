import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { initTelegram, getTelegramUser } from "./lib/telegram.js";
import { api } from "./lib/api.js";
import BottomNav from "./components/BottomNav.jsx";
import TrialBanner from "./components/TrialBanner.jsx";
import Home from "./pages/Home.jsx";
import Goal from "./pages/Goal.jsx";
import Reminders from "./pages/Reminders.jsx";
import Report from "./pages/Report.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    initTelegram();
    const tgUser = getTelegramUser();
    setUser(tgUser);

    api
      .post("/api/users/register", {
        telegram_id: tgUser.id,
        first_name: tgUser.first_name,
        username: tgUser.username,
      })
      .then(() => api.get(`/api/users/${tgUser.id}/status`))
      .then((res) => setStatus(res.data))
      .catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="app-shell">
      <TrialBanner status={status} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home telegramId={user.id} />} />
          <Route path="/goal" element={<Goal telegramId={user.id} />} />
          <Route path="/reminders" element={<Reminders telegramId={user.id} />} />
          <Route path="/report" element={<Report telegramId={user.id} />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
