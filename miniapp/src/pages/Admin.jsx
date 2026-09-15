import React, { useEffect, useState, useMemo } from "react";
import { api, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";
import { useSettings } from "../lib/settingsContext.jsx";
import { hapticImpact } from "../lib/telegram.js";
import {
  CrownIcon,
  UserIcon,
  SearchIcon,
  RefreshIcon,
  AlertIcon,
  CardIcon,
  SendIcon,
  CloseIcon,
  CheckIcon,
} from "../components/Icon.jsx";

const ADMIN_ID = 6079747111;

export default function Admin({ telegramId }) {
  const showToast = useToast();
  const { language } = useSettings();
  const isUz = language === "uz";

  const isAdmin = Number(telegramId) === ADMIN_ID;

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'expired' | 'active' | 'subscribed'
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/api/admin/stats", { headers: { "x-admin-id": telegramId } }),
        api.get("/api/admin/users", { headers: { "x-admin-id": telegramId } }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [telegramId, isAdmin]);

  // Быстрое начисление 30 дней подписки
  const handleGrant30Days = async (targetUser) => {
    hapticImpact("medium");
    setProcessingId(targetUser.telegram_id);
    try {
      const res = await api.post(
        `/api/admin/users/${targetUser.telegram_id}/grant`,
        { days: 30 },
        { headers: { "x-admin-id": telegramId } }
      );
      showToast(
        isUz
          ? `30 kun muvaffaqiyatli qo'shildi (${targetUser.first_name || targetUser.telegram_id})`
          : `Подписка продлена на 30 дней (${targetUser.first_name || targetUser.telegram_id})`
      );
      // Обновляем пользователя в локальном списке
      setUsers((prev) =>
        prev.map((u) => (u.telegram_id === targetUser.telegram_id ? res.data.user : u))
      );
      // Перезагружаем статистику
      api
        .get("/api/admin/stats", { headers: { "x-admin-id": telegramId } })
        .then((r) => setStats(r.data))
        .catch(() => {});
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  // Отозвать доступ (заблокировать)
  const handleRevoke = async (targetUser) => {
    hapticImpact("medium");
    if (
      !window.confirm(
        isUz
          ? `Haqiqatan ham ${targetUser.first_name || targetUser.telegram_id} kirishini to'xtatmoqchimisiz?`
          : `Заблокировать доступ пользователю ${targetUser.first_name || targetUser.telegram_id}?`
      )
    ) {
      return;
    }

    setProcessingId(targetUser.telegram_id);
    try {
      const res = await api.post(
        `/api/admin/users/${targetUser.telegram_id}/revoke`,
        {},
        { headers: { "x-admin-id": telegramId } }
      );
      showToast(isUz ? "Kirish to'xtatildi" : "Доступ отозван");
      setUsers((prev) =>
        prev.map((u) => (u.telegram_id === targetUser.telegram_id ? res.data.user : u))
      );
      api
        .get("/api/admin/stats", { headers: { "x-admin-id": telegramId } })
        .then((r) => setStats(r.data))
        .catch(() => {});
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  // Сбросить триал на 7 дней
  const handleResetTrial = async (targetUser) => {
    hapticImpact("light");
    setProcessingId(targetUser.telegram_id);
    try {
      const res = await api.post(
        `/api/admin/users/${targetUser.telegram_id}/set-trial`,
        { days: 7 },
        { headers: { "x-admin-id": telegramId } }
      );
      showToast(isUz ? "7 kunlik sinov muddati berildi" : "Установлен 7-дневный триал");
      setUsers((prev) =>
        prev.map((u) => (u.telegram_id === targetUser.telegram_id ? res.data.user : u))
      );
      api
        .get("/api/admin/stats", { headers: { "x-admin-id": telegramId } })
        .then((r) => setStats(r.data))
        .catch(() => {});
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  // Открыть чат с пользователем
  const handleOpenChat = (userTgId) => {
    hapticImpact("light");
    const link = `tg://user?id=${userTgId}`;
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(link);
    } else {
      window.location.href = link;
    }
  };

  // Фильтрация и поиск пользователей
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Поиск
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const idMatch = String(u.telegram_id).includes(q);
        const nameMatch = u.first_name && u.first_name.toLowerCase().includes(q);
        const userMatch = u.username && u.username.toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !userMatch) return false;
      }

      // Таб
      if (activeTab === "expired") {
        return !u.is_admin && !u.access;
      }
      if (activeTab === "active") {
        return u.access;
      }
      if (activeTab === "subscribed") {
        return u.subscription_active;
      }
      return true;
    });
  }, [users, search, activeTab]);

  if (!isAdmin) {
    return (
      <div className="card" style={{ textAlign: "center", marginTop: 40, padding: 32 }}>
        <div style={{ color: "var(--accent-alert)", marginBottom: 12 }}>
          <AlertIcon width={40} height={40} />
        </div>
        <h3 style={{ margin: "0 0 8px" }}>
          {isUz ? "Ruxsat berilmagan" : "Доступ запрещён"}
        </h3>
        <p className="muted" style={{ fontSize: 14 }}>
          {isUz
            ? "Ushbu sahifa faqat administrator uchun mo'ljallangan."
            : "Эта страница доступна только администратору приложения."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 30 }}>
      {/* Шапка админ-панели */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(59, 110, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
            }}
          >
            <CrownIcon width={22} height={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              {isUz ? "Administrator paneli" : "Панель администратора"}
            </h2>
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>
              ID: {ADMIN_ID}
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            cursor: "pointer",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RefreshIcon width={20} height={20} />
        </button>
      </div>

      {/* Метрики пользователей */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div className="card" style={{ padding: "12px 10px", textAlign: "center" }}>
            <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>
              {isUz ? "Jami" : "Всего"}
            </p>
            <p className="big-number" style={{ fontSize: 22, margin: 0 }}>
              {stats.total_users}
            </p>
          </div>

          <div
            className="card"
            style={{
              padding: "12px 10px",
              textAlign: "center",
              borderColor: "rgba(34, 197, 94, 0.3)",
            }}
          >
            <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>
              {isUz ? "Faol" : "Активных"}
            </p>
            <p
              className="big-number"
              style={{ fontSize: 22, margin: 0, color: "var(--accent)" }}
            >
              {stats.active_users}
            </p>
          </div>

          <div
            className="card"
            style={{
              padding: "12px 10px",
              textAlign: "center",
              borderColor:
                stats.expired_users > 0
                  ? "rgba(220, 38, 38, 0.4)"
                  : "var(--line)",
            }}
          >
            <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>
              {isUz ? "Tugagan" : "Истёк срок"}
            </p>
            <p
              className="big-number"
              style={{
                fontSize: 22,
                margin: 0,
                color: stats.expired_users > 0 ? "var(--accent-alert)" : "var(--ink)",
              }}
            >
              {stats.expired_users}
            </p>
          </div>
        </div>
      )}

      {/* Поле поиска */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input
          type="text"
          className="field"
          placeholder={isUz ? "Ism, @username yoki ID bo'yicha qidiruv…" : "Поиск по имени, @username или ID…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
        <div
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--hint)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <SearchIcon width={18} height={18} />
        </div>
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--hint)",
              cursor: "pointer",
            }}
          >
            <CloseIcon width={16} height={16} />
          </button>
        )}
      </div>

      {/* Фильтры по табам */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          marginBottom: 16,
          paddingBottom: 4,
        }}
      >
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
          style={{ padding: "8px 14px", fontSize: 13, whiteSpace: "nowrap" }}
        >
          {isUz ? "Barchasi" : "Все"} ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "expired" ? "active" : ""}`}
          onClick={() => setActiveTab("expired")}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            whiteSpace: "nowrap",
            color: activeTab === "expired" ? undefined : "var(--accent-alert)",
          }}
        >
          {isUz ? "Muddati tugagan" : "Истёк срок"} ({stats?.expired_users || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
          style={{ padding: "8px 14px", fontSize: 13, whiteSpace: "nowrap" }}
        >
          {isUz ? "Faol" : "Активные"} ({stats?.active_users || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === "subscribed" ? "active" : ""}`}
          onClick={() => setActiveTab("subscribed")}
          style={{ padding: "8px 14px", fontSize: 13, whiteSpace: "nowrap" }}
        >
          {isUz ? "To'langan (30 kun)" : "Подписка"} ({stats?.subscribed_users || 0})
        </button>
      </div>

      {/* Список пользователей */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--hint)" }}>
          <p>{isUz ? "Yuklanmoqda…" : "Загрузка данных…"}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p className="muted" style={{ margin: 0 }}>
            {isUz ? "Foydalanuvchilar topilmadi" : "Пользователи не найдены"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredUsers.map((u) => {
            const isSelf = Number(u.telegram_id) === ADMIN_ID;
            const isProcessing = processingId === u.telegram_id;

            return (
              <div
                key={u.telegram_id}
                className="card"
                style={{
                  borderLeft: isSelf
                    ? "4px solid #EAB308"
                    : u.access
                    ? "4px solid var(--accent)"
                    : "4px solid var(--accent-alert)",
                  padding: "14px 14px 12px",
                }}
              >
                {/* Верхняя строка: Имя и статус-бейдж */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                      {u.first_name || (isUz ? "Ismsiz" : "Без имени")}
                    </span>
                    {u.username && (
                      <span className="muted" style={{ fontSize: 13, marginLeft: 6 }}>
                        @{u.username}
                      </span>
                    )}
                  </div>

                  {isSelf ? (
                    <span className="pill pill-gold">
                      {isUz ? "Admin" : "Админ"}
                    </span>
                  ) : u.subscription_active ? (
                    <span className="pill pill-green">
                      {isUz ? "To'langan" : "Подписка"}
                    </span>
                  ) : u.trial_active ? (
                    <span className="pill pill-green">
                      {isUz ? "Sinov davri" : "Триал"}
                    </span>
                  ) : (
                    <span className="pill pill-red">
                      {isUz ? "Tugagan" : "Заблокирован"}
                    </span>
                  )}
                </div>

                {/* Строка с ID и информацией о сроке */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--hint)",
                    lineHeight: 1.5,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    ID: <code>{u.telegram_id}</code>
                    {u.created_at && (
                      <span> · {isUz ? "Ro'yxatdan o'tdi" : "Регистрация"}: {formatDate(u.created_at)}</span>
                    )}
                  </div>

                  {isSelf ? (
                    <div style={{ color: "var(--ink)", marginTop: 2 }}>
                      {isUz ? "Cheksiz kirish huquqi" : "Неограниченный доступ администратора"}
                    </div>
                  ) : u.subscription_active ? (
                    <div style={{ color: "var(--accent)", fontWeight: 500, marginTop: 2 }}>
                      {isUz
                        ? `Obuna faol: ${u.subscription_days_left} kun qoldi (${formatDate(u.subscribed_until)} gacha)`
                        : `Подписка активна: ${u.subscription_days_left} дн. (до ${formatDate(u.subscribed_until)})`}
                    </div>
                  ) : u.trial_active ? (
                    <div style={{ color: "var(--ink)", marginTop: 2 }}>
                      {isUz
                        ? `Sinov davri: ${u.trial_days_left} kun qoldi (${formatDate(u.trial_ends_at)} gacha)`
                        : `Пробный период: ${u.trial_days_left} дн. (до ${formatDate(u.trial_ends_at)})`}
                    </div>
                  ) : (
                    <div style={{ color: "var(--accent-alert)", fontWeight: 500, marginTop: 2 }}>
                      {isUz
                        ? "Kirish to'xtatilgan (7 kunlik sinov yoki obuna tugagan)"
                        : "Доступ заблокирован (срок триала или подписки истёк)"}
                    </div>
                  )}
                </div>

                {/* Кнопки действий */}
                {!isSelf && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      borderTop: "1px solid var(--line)",
                      paddingTop: 10,
                    }}
                  >
                    {/* Главная кнопка: +30 дней */}
                    <button
                      className="primary-btn"
                      onClick={() => handleGrant30Days(u)}
                      disabled={isProcessing}
                      style={{
                        flex: 2,
                        height: 38,
                        fontSize: 13,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "0 10px",
                      }}
                    >
                      <CardIcon width={16} height={16} />
                      {isProcessing
                        ? (isUz ? "Yuklanmoqda…" : "Сохранение…")
                        : (isUz ? "+30 kunga ochish" : "+ 30 дней")}
                    </button>

                    {/* Открыть диалог в Telegram */}
                    <button
                      className="secondary-btn"
                      onClick={() => handleOpenChat(u.telegram_id)}
                      title={isUz ? "Telegramda yozish" : "Написать в Telegram"}
                      style={{
                        flex: 1,
                        height: 38,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        padding: "0 8px",
                      }}
                    >
                      <SendIcon width={14} height={14} />
                      {isUz ? "Yozish" : "Чат"}
                    </button>

                    {/* Дополнительные действия: сбросить триал или заблокировать */}
                    {u.access ? (
                      <button
                        onClick={() => handleRevoke(u)}
                        disabled={isProcessing}
                        title={isUz ? "Bloklash" : "Заблокировать"}
                        style={{
                          height: 38,
                          width: 38,
                          borderRadius: 10,
                          border: "1px solid var(--line)",
                          background: "var(--surface)",
                          color: "var(--accent-alert)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <CloseIcon width={16} height={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResetTrial(u)}
                        disabled={isProcessing}
                        title={isUz ? "+7 kun sinov" : "+7 дней триал"}
                        style={{
                          height: 38,
                          padding: "0 10px",
                          borderRadius: 10,
                          border: "1px solid var(--line)",
                          background: "var(--surface)",
                          color: "var(--ink)",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        +7д
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoStr;
  }
}
