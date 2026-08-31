import React from "react";
import { Link } from "react-router-dom";

export default function TrialBanner({ status }) {
  if (!status) return null;

  if (status.subscription_active) return null; // платный — баннер не нужен

  if (status.trial_active) {
    return (
      <Link to="/subscription" className="trial-banner" style={{ display: "block" }}>
        Бесплатный период: осталось {status.trial_days_left} {dayWord(status.trial_days_left)}
      </Link>
    );
  }

  return (
    <Link to="/subscription" className="trial-banner" style={{ display: "block", background: "var(--accent-red)" }}>
      Бесплатный период закончился · нажмите, чтобы оплатить
    </Link>
  );
}

function dayWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дня";
  return "дней";
}
