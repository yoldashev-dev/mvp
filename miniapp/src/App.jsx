import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { initTelegram, getTelegramUser } from "./lib/telegram.js";
import { api, errorMessage } from "./lib/api.js";
import { useToast } from "./lib/toast.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Home from "./pages/Home.jsx";
import Goal from "./pages/Goal.jsx";
import Reminders from "./pages/Reminders.jsx";
import Report from "./pages/Report.jsx";
import Subscription from "./pages/Subscription.jsx";
import Calculator from "./pages/Calculator.jsx";
import Debts from "./pages/Debts.jsx";
import More from "./pages/More.jsx";

export default function App() {
  const showToast = useToast();
  const [user, setUser] = useState(null);

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
      .catch((err) => showToast(errorMessage(err)));
  }, []);

  if (!user) return null;

  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home telegramId={user.id} />} />
          <Route path="/goal" element={<Goal telegramId={user.id} />} />
          <Route path="/debts" element={<Debts telegramId={user.id} />} />
          <Route path="/reminders" element={<Reminders telegramId={user.id} />} />
          <Route path="/report" element={<Report telegramId={user.id} />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/subscription" element={<Subscription telegramId={user.id} />} />
          <Route path="/more" element={<More />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
