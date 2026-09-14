import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";
import { useSettings } from "../lib/settingsContext.jsx";
import { hapticImpact } from "../lib/telegram.js";
import { CloseIcon, CheckIcon } from "../components/Icon.jsx";

export default function Goal({ telegramId }) {
  const showToast = useToast();
  const { currencySymbol, language } = useSettings();
  const isUz = language === "uz";

  const [items, setItems] = useState(null); // null = загрузка
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    api
      .get("/api/goals/active", { params: { telegram_id: telegramId } })
      .then((r) => setItems(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [telegramId]);

  const createGoal = async () => {
    const value = parseInt(target.replace(/\D/g, ""), 10);
    if (!title.trim() || !value) {
      showToast(isUz ? "Maqsad nomi va summasini kiriting" : "Укажите название и сумму цели");
      return;
    }
    try {
      await api.post("/api/goals", { telegram_id: telegramId, title: title.trim(), target_amount: value });
      hapticImpact("medium");
      setForm(false);
      setTitle("");
      setTarget("");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const cancelGoal = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/api/goals/${id}/cancel`);
      hapticImpact("medium");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const purchaseGoal = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/api/goals/${id}/purchase`);
      hapticImpact("heavy");
      showToast(isUz ? "Xarid bilan tabriklaymiz!" : "Поздравляем с покупкой!", "success");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (items === null) return null;

  return (
    <div>
      {items.length === 0 && (
        <div className="card">
          <p className="card-title">{isUz ? "Hozircha maqsadlar yo'q" : "Пока нет целей"}</p>
          <p className="muted">
            {isUz
              ? "Biznesingiz uchun nima yig'moqchi ekanligingizni qo'shing — masalan, kattaroq muzlatgich yoki yangi uskuna. Bir vaqtning o'zida bir nechta maqsad qo'yish mumkin — tavsiya etilgan jamg'arma summasi ular o'rtasida taqsimlanadi."
              : "Добавь, на что копишь для бизнеса — например, холодильник побольше или новое оборудование. Можно вести сразу несколько целей — рекомендованная сумма для накопления поделится между ними."}
          </p>
        </div>
      )}

      {items.map(({ goal, projection }) => {
        const pct = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
        return (
          <div className="card" key={goal.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p className="card-title" style={{ margin: 0 }}>{goal.title}</p>
              <button
                className="icon-btn"
                onClick={() => cancelGoal(goal.id)}
                disabled={busyId === goal.id}
                title={isUz ? "Maqsadni bekor qilish" : "Отменить цель"}
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>
            <p className="big-number">
              {fmt(goal.saved_amount)}
              <span className="sum-unit">/ {fmt(goal.target_amount)} {currencySymbol}</span>
            </p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="muted">{isUz ? `${pct}% to'plandi` : `${pct}% накоплено`}</p>

            {projection.can_buy_now ? (
              <>
                <p style={{ margin: "10px 0" }}>
                  <span className="pill pill-green" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CheckIcon width={13} height={13} />
                    {isUz ? "Pul yetarli!" : "Хватает денег!"}
                  </span>
                </p>
                <button
                  className="primary-btn"
                  onClick={() => purchaseGoal(goal.id)}
                  disabled={busyId === goal.id}
                >
                  {isUz ? "Sotib olish" : "Купить"}
                </button>
              </>
            ) : projection.daily_for_this_goal > 0 ? (
              <>
                <p style={{ margin: "10px 0 4px" }}>
                  {isUz ? (
                    <>
                      Biznes uchun xavfsiz tarzda kuniga taxminan{" "}
                      <strong>{fmt(projection.daily_for_this_goal)} {currencySymbol}</strong> ajratishingiz mumkin.
                    </>
                  ) : (
                    <>
                      Можешь откладывать примерно{" "}
                      <strong>{fmt(projection.daily_for_this_goal)} {currencySymbol} в день</strong> без риска для бизнеса.
                    </>
                  )}
                </p>
                <p className="muted">
                  {isUz
                    ? (projection.weeks_to_goal
                        ? `Taxminan ${projection.weeks_to_goal} haftada to'playsiz`
                        : `Yana ${projection.days_to_goal} kun to'plash qoldi`)
                    : (projection.weeks_to_goal
                        ? `Накопишь примерно за ${projection.weeks_to_goal} ${weekWord(projection.weeks_to_goal)}`
                        : `Осталось накопить ${projection.days_to_goal} ${dayWord(projection.days_to_goal)}`)}
                </p>
              </>
            ) : (
              <p className="muted" style={{ marginTop: 10 }}>
                {isUz
                  ? "Hozircha jamg'arish uchun bo'sh pul yo'q — daromad majburiy to'lovlarni qoplashiga e'tibor qarating."
                  : "Пока свободных денег на накопление нет — сфокусируйся на том, чтобы прибыль покрывала обязательные платежи."}
              </p>
            )}
          </div>
        );
      })}

      {!form ? (
        <button className="primary-btn" onClick={() => setForm(true)}>
          {items.length === 0
            ? (isUz ? "Maqsad qo'shish" : "Добавить цель")
            : (isUz ? "Yana maqsad qo'shish" : "Добавить ещё одну цель")}
        </button>
      ) : (
        <div className="card">
          <input
            className="field"
            placeholder={isUz ? "Masalan, Kattaroq muzlatgich" : "Например, Холодильник побольше"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <input
            className="field"
            inputMode="numeric"
            placeholder={isUz ? `Narxi qancha, ${currencySymbol}` : `Сколько стоит, ${currencySymbol}`}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button className="secondary-btn" onClick={() => setForm(false)}>
              {isUz ? "Bekor qilish" : "Отмена"}
            </button>
            <button className="primary-btn" onClick={createGoal}>
              {isUz ? "Saqlash" : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function weekWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "неделю";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "недели";
  return "недель";
}

function dayWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дня";
  return "дней";
}
