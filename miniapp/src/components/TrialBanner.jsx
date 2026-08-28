import React from "react";

export default function TrialBanner({ status }) {
  if (!status) return null;

  if (status.subscription_active) return null; // платный — баннер не нужен

  if (status.trial_active) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(status.trial_ends_at) - new Date()) / 86400000)
    );
    return (
      <div className="trial-banner">
        Бесплатный период: осталось {daysLeft} {daysLeft === 1 ? "день" : "дней"}
      </div>
    );
  }

  return (
    <div className="trial-banner" style={{ background: "var(--accent-red)" }}>
      Бесплатный период закончился · 200 000 сум/мес
    </div>
  );
}
