import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { initTelegram, getTelegramUser } from "./lib/telegram.js";
import { api, errorMessage } from "./lib/api.js";
import { useToast } from "./lib/toast.jsx";
import { SettingsProvider } from "./lib/settingsContext.jsx";
import BottomNav from "./components/BottomNav.jsx";
import BlockedPaywall from "./components/BlockedPaywall.jsx";
import Home from "./pages/Home.jsx";
import Goal from "./pages/Goal.jsx";
import Reminders from "./pages/Reminders.jsx";
import Report from "./pages/Report.jsx";
import Subscription from "./pages/Subscription.jsx";
import Calculator from "./pages/Calculator.jsx";
import Debts from "./pages/Debts.jsx";
import More from "./pages/More.jsx";
import Settings from "./pages/Settings.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  const showToast = useToast();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const fetchStatus = useCallback((telegramId) => {
    return api
      .get(`/api/users/${telegramId}/status`)
      .then((r) => {
        setStatus(r.data);
        return r.data;
      })
      .catch((err) => {
        showToast(errorMessage(err));
      })
      .finally(() => {
        setLoadingStatus(false);
      });
  }, [showToast]);

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
      .then(() => fetchStatus(tgUser.id))
      .catch((err) => {
        showToast(errorMessage(err));
        fetchStatus(tgUser.id);
      });
  }, [fetchStatus, showToast]);

  if (!user) return null;

  // Если доступ заблокирован (срок 7 дней или 30 дней истёк) и пользователь не админ:
  // отображаем только экран блокировки с кнопкой перехода к оплате
  const isBlocked = status && !status.access && !status.is_admin;

  return (
    <SettingsProvider telegramId={user.id}>
      {isBlocked ? (
        <BlockedPaywall onRefresh={() => fetchStatus(user.id)} />
      ) : (
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
              <Route path="/more" element={<More telegramId={user.id} />} />
              <Route path="/settings" element={<Settings telegramId={user.id} />} />
              <Route path="/admin" element={<Admin telegramId={user.id} />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      )}
    </SettingsProvider>
  );
}


