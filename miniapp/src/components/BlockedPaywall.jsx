import React from "react";
import { LockIcon, CardIcon, RefreshIcon } from "./Icon.jsx";
import { useSettings } from "../lib/settingsContext.jsx";
import { hapticImpact } from "../lib/telegram.js";

const ADMIN_ID = 6079747111;
const ADMIN_TG_URL = `tg://user?id=${ADMIN_ID}`;

export default function BlockedPaywall({ onRefresh }) {
  const { language } = useSettings();
  const isUz = language === "uz";

  const handlePayClick = () => {
    hapticImpact("heavy");
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(ADMIN_TG_URL);
    } else {
      window.location.href = ADMIN_TG_URL;
    }
  };

  const handleRefreshClick = () => {
    hapticImpact("light");
    if (onRefresh) onRefresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
        background: "var(--bg)",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          padding: "32px 20px 24px",
          border: "1px solid var(--line)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* Иконка замка */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "rgba(220, 38, 38, 0.1)",
            color: "var(--accent-alert)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <LockIcon width={32} height={32} />
        </div>

        {/* Заголовок */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          {isUz ? "Kirish cheklangan" : "Доступ ограничен"}
        </h2>

        {/* Бейдж статуса */}
        <div style={{ marginBottom: 16 }}>
          <span className="pill pill-red">
            {isUz ? "Muddati tugagan" : "Срок действия истёк"}
          </span>
        </div>

        {/* Описание */}
        <p
          className="muted"
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            margin: "0 0 24px",
            color: "var(--hint)",
          }}
        >
          {isUz
            ? "7 kunlik bepul sinov muddati yoki obuna yakunlandi. Biznesingiz hisob-kitobini davom ettirish va ilovadan to'liq foydalanish uchun 30 kunlik obuna to'loviga o'ting."
            : "7-дневный пробный период или подписка завершились. Чтобы продолжить вести учёт бизнеса и использовать возможности приложения, перейдите к оплате подписки на 30 дней."}
        </p>

        {/* Единственная главная кнопка оплаты */}
        <button
          className="primary-btn"
          onClick={handlePayClick}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 16,
            fontWeight: 600,
            height: 50,
            borderRadius: 14,
            marginBottom: 12,
          }}
        >
          <CardIcon width={20} height={20} />
          {isUz ? "To'lovga o'tish" : "Перейти к оплате"}
        </button>

        {/* Проверить оплату после подтверждения */}
        <button
          className="secondary-btn"
          onClick={handleRefreshClick}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 13,
            height: 42,
            borderRadius: 12,
            width: "100%",
          }}
        >
          <RefreshIcon width={16} height={16} />
          {isUz ? "To'lovni tekshirish" : "Проверить оплату"}
        </button>
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 12, margin: 0, color: "var(--hint)" }}>
          RentBot · {isUz ? "Xavfsiz moliyaviy hisobot" : "Безопасный финансовый учёт"}
        </p>
      </div>
    </div>
  );
}
