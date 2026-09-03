import React, { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";

export default function Subscription({ telegramId }) {
  const showToast = useToast();
  const [status, setStatus] = useState(null);
  const [paying, setPaying] = useState(false);

  const load = () => {
    api
      .get(`/api/users/${telegramId}/status`)
      .then((r) => setStatus(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [telegramId]);

  const pay = async () => {
    setPaying(true);
    try {
      // Заглушка — в проде здесь будет переход на Payme/Click checkout
      await api.post(`/api/users/${telegramId}/subscribe`);
      showToast("Оплата прошла успешно!", "success");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  if (!status) return null;

  return (
    <div>
      <div className="card">
        <p className="card-title">Бесплатный период</p>
        {status.trial_active ? (
          <p className="big-number">
            {status.trial_days_left}
            <span className="sum-unit">{dayWord(status.trial_days_left)} осталось</span>
          </p>
        ) : (
          <p className="muted">Бесплатный период закончился</p>
        )}
      </div>

      <div className="card">
        <p className="card-title">Подписка</p>
        {status.subscription_active ? (
          <>
            <p className="big-number">
              {status.subscription_days_left}
              <span className="sum-unit">{dayWord(status.subscription_days_left)} осталось</span>
            </p>
            <p className="muted" style={{ marginTop: 6 }}>
              200 000 сум/мес · продлится автоматически
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 12px" }}>
              200 000 сум / месяц — доступ ко всем функциям без ограничений.
            </p>
            <button className="primary-btn" onClick={pay} disabled={paying}>
              {paying ? "Обрабатываю…" : "Оплатить 200 000 сум"}
            </button>
            <p className="muted" style={{ marginTop: 10 }}>
              Оплата через Payme / Click
            </p>
          </>
        )}
      </div>

      {!status.trial_active && !status.subscription_active && (
        <div className="card" style={{ borderColor: "var(--accent-alert)" }}>
          <p className="muted" style={{ color: "var(--accent-alert)" }}>
            Доступ к приложению ограничен — оформите подписку, чтобы продолжить пользоваться ботом.
          </p>
        </div>
      )}
    </div>
  );
}

function dayWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дня";
  return "дней";
}
