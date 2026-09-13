import React, { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";
import { useSettings } from "../lib/settingsContext.jsx";
import {
  ClockIcon,
  SparklesIcon,
  CheckIcon,
  AlertIcon,
} from "../components/Icon.jsx";

export default function Subscription({ telegramId }) {
  const showToast = useToast();
  const { language } = useSettings();
  const [status, setStatus] = useState(null);

  const isUz = language === "uz";

  const load = () => {
    api
      .get(`/api/users/${telegramId}/status`)
      .then((r) => setStatus(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [telegramId]);

  if (!status) return null;

  const trialDaysLeft = status.trial_days_left || 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((trialDaysLeft / 7) * 100))
  );

  return (
    <div>
      {/* 7-дневный бесплатный период */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClockIcon width={18} height={18} style={{ color: "var(--accent)" }} />
            <p className="card-title" style={{ margin: 0 }}>
              {isUz ? "7 kunlik sinov davri" : "7-дневный пробный период"}
            </p>
          </div>
          {status.trial_active ? (
            <span className="pill pill-green">
              {isUz ? "Faol" : "Активен"}
            </span>
          ) : (
            <span className="pill pill-red">
              {isUz ? "Tugagan" : "Завершён"}
            </span>
          )}
        </div>

        {status.trial_active ? (
          <>
            <p className="big-number">
              {trialDaysLeft}
              <span className="sum-unit">
                {" "}
                {isUz ? "kun qoldi" : `${dayWord(trialDaysLeft)} осталось`}
              </span>
            </p>

            <div className="progress-track" style={{ margin: "14px 0 8px" }}>
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--hint)",
              }}
            >
              <span>{isUz ? "Bugun" : "Сегодня"}</span>
              <span>{isUz ? "Jami 7 kun" : "Всего 7 дней"}</span>
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: "10px 0 0", fontSize: 14 }}>
            {isUz
              ? "Sinov davri yakunlandi"
              : "Бесплатный период закончился"}
          </p>
        )}
      </div>

      {/* Ограничение при завершении триала */}
      {!status.trial_active && (
        <div className="card" style={{ borderColor: "var(--accent-alert)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <AlertIcon
              width={18}
              height={18}
              style={{ color: "var(--accent-alert)" }}
            />
            <p
              className="card-title"
              style={{ margin: 0, color: "var(--accent-alert)" }}
            >
              {isUz ? "Kirish cheklangan" : "Доступ ограничен"}
            </p>
          </div>
          <p
            className="muted"
            style={{
              color: "var(--accent-alert)",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {isUz
              ? "7 kunlik bepul sinov muddati yakunlandi. Davom ettirish uchun administratorga murojaat qiling."
              : "7-дневный бесплатный период завершился. Для продолжения работы обратитесь к администратору."}
          </p>
        </div>
      )}

      {/* Доступные функции */}
      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <SparklesIcon
            width={18}
            height={18}
            style={{ color: "var(--accent)" }}
          />
          <p className="card-title" style={{ margin: 0 }}>
            {isUz ? "Dastur imkoniyatlari" : "Возможности приложения"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FeatureItem
            title={
              isUz
                ? "Daromad va xarajatlar to'liq hisobi"
                : "Полный учёт доходов и расходов"
            }
            desc={
              isUz
                ? "Cheksiz operatsiyalar va toifalar"
                : "Быстрый ввод операций без ограничений"
            }
          />
          <FeatureItem
            title={
              isUz
                ? "Qarzlar va muddatlar nazorati"
                : "Контроль долгов и сроков"
            }
            desc={
              isUz
                ? "Qarzdorlar ro'yxati va qaytarish sanasi"
                : "Список должников и фиксация дат"
            }
          />
          <FeatureItem
            title={
              isUz
                ? "Moliyaviy maqsadlar"
                : "Финансовые цели"
            }
            desc={
              isUz
                ? "Katta xaridlar uchun jamg'arma rejasi"
                : "Накопления и отслеживание прогресса"
            }
          />
          <FeatureItem
            title={
              isUz
                ? "Oylik tahlil va grafiklar"
                : "Аналитика и графики"
            }
            desc={
              isUz
                ? "Dinamika va oylik sof foyda hisoboti"
                : "Наглядные графики и отчёт за месяц"
            }
          />
          <FeatureItem
            title={
              isUz
                ? "Muntazam to'lovlar"
                : "Регулярные платежи"
            }
            desc={
              isUz
                ? "Ijara, kommunal va boshqa to'lovlar"
                : "Напоминания об аренде и счетах"
            }
          />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ title, desc }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "rgba(59, 110, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--accent)",
        }}
      >
        <CheckIcon width={18} height={18} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          {title}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function dayWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100))
    return "дня";
  return "дней";
}
