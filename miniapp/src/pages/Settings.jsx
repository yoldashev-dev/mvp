import React from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../lib/settingsContext.jsx";
import { useToast } from "../lib/toast.jsx";
import { hapticImpact } from "../lib/telegram.js";
import { ChevronRightIcon } from "../components/Icon.jsx";

export default function Settings() {
  const showToast = useToast();
  const { language, currency, theme, updateSettings } = useSettings();

  const update = async (key, val) => {
    hapticImpact("medium");
    await updateSettings({ [key]: val });
    const isUz = key === "language" ? val === "uz" : language === "uz";
    showToast(isUz ? "Sozlamalar saqlandi!" : "Настройки сохранены!", "success");
  };

  const isUz = language === "uz";

  return (
    <div>
      <Link
        to="/more"
        className="icon-btn"
        style={{
          padding: "0 0 14px",
          fontSize: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          textDecoration: "none",
          color: "var(--ink)",
        }}
      >
        <ChevronRightIcon
          width={16}
          height={16}
          style={{ transform: "rotate(180deg)" }}
        />
        {isUz ? "Orqaga" : "Назад"}
      </Link>

      {/* Язык / Til */}
      <div className="card">
        <p className="card-title">{isUz ? "Interfeys tili" : "Язык интерфейса"}</p>
        <p className="muted" style={{ marginBottom: 12 }}>
          {isUz
            ? "Ilova va bot xabarlarining tili"
            : "Язык приложения и сообщений бота"}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={"tab-btn" + (language === "ru" ? " active" : "")}
            style={{ flex: 1, padding: "10px 0" }}
            onClick={() => update("language", "ru")}
          >
            🇷🇺 Русский
          </button>
          <button
            type="button"
            className={"tab-btn" + (language === "uz" ? " active" : "")}
            style={{ flex: 1, padding: "10px 0" }}
            onClick={() => update("language", "uz")}
          >
            🇺🇿 O'zbekcha
          </button>
        </div>
      </div>

      {/* Валюта / Valyuta */}
      <div className="card">
        <p className="card-title">{isUz ? "Asosiy valyuta" : "Основная валюта"}</p>
        <p className="muted" style={{ marginBottom: 12 }}>
          {isUz
            ? "Barcha hisob-kitoblar ko'rsatiladigan valyuta"
            : "Валюта для отображения доходов, расходов и отчётов"}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={"tab-btn" + (currency === "uzs" ? " active" : "")}
            style={{ flex: 1, padding: "10px 0" }}
            onClick={() => update("currency", "uzs")}
          >
            🇺🇿 {isUz ? "So'm (UZS)" : "Сум (UZS)"}
          </button>
          <button
            type="button"
            className={"tab-btn" + (currency === "rub" ? " active" : "")}
            style={{ flex: 1, padding: "10px 0" }}
            onClick={() => update("currency", "rub")}
          >
            🇷🇺 {isUz ? "Rubl (₽)" : "Рубль (₽)"}
          </button>
        </div>
      </div>

      {/* Тема / Mavzu */}
      <div className="card">
        <p className="card-title">{isUz ? "Ilova mavzusi" : "Тема оформления"}</p>
        <p className="muted" style={{ marginBottom: 12 }}>
          {isUz
            ? "Kunduzgi yoki tungi ko'rinish"
            : "Светлый или тёмный режим отображения"}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={"tab-btn" + (theme === "light" ? " active" : "")}
            style={{ flex: 1, padding: "10px 0" }}
            onClick={() => update("theme", "light")}
          >
            ☀️ {isUz ? "Yorug'" : "Светлая"}
          </button>
          <button
            type="button"
            className={"tab-btn" + (theme === "dark" ? " active" : "")}
            style={{ flex: 1, padding: "10px 0" }}
            onClick={() => update("theme", "dark")}
          >
            🌙 {isUz ? "Qorong'i" : "Тёмная"}
          </button>
        </div>
      </div>
    </div>
  );
}
