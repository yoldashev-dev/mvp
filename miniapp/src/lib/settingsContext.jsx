import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const SettingsContext = createContext({
  language: "ru",
  currency: "uzs",
  theme: "light",
  currencySymbol: "сум",
  updateSettings: () => {},
});

export function SettingsProvider({ telegramId, children }) {
  const [settings, setSettings] = useState({
    language: "ru",
    currency: "uzs",
    theme: "light",
  });

  useEffect(() => {
    if (!telegramId) return;

    api
      .get(`/api/users/${telegramId}/settings`)
      .then((res) => {
        if (res.data) {
          const loaded = {
            language: res.data.language || "ru",
            currency: res.data.currency || "uzs",
            theme: res.data.theme || "light",
          };
          setSettings(loaded);
          applyTheme(loaded.theme);
        }
      })
      .catch(() => {});
  }, [telegramId]);

  const applyTheme = (theme) => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  const updateSettings = async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);

    if (updates.theme) {
      applyTheme(updates.theme);
    }

    try {
      await api.patch(`/api/users/${telegramId}/settings`, updates);
    } catch (err) {
      console.error("Failed to persist settings:", err);
    }
  };

  const currencySymbol =
    settings.currency === "rub"
      ? "₽"
      : settings.language === "uz"
      ? "so'm"
      : "сум";

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        currencySymbol,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
