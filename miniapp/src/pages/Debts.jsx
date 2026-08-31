import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";

export default function Debts({ telegramId }) {
  const showToast = useToast();
  const [data, setData] = useState(null); // { people, total_owed }
  const [openPerson, setOpenPerson] = useState(null); // id открытой карточки
  const [form, setForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get("/api/debts/people", { params: { telegram_id: telegramId } })
      .then((r) => setData(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [telegramId]);

  const createPerson = async () => {
    const value = amount ? parseInt(amount.replace(/\D/g, ""), 10) : 0;
    if (!name.trim()) {
      showToast("Укажите имя");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/debts/people", {
        telegram_id: telegramId,
        name: name.trim(),
        amount: value || undefined,
      });
      setForm(false);
      setName("");
      setAmount("");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!data) return null;

  if (openPerson) {
    return (
      <PersonDetail
        telegramId={telegramId}
        personId={openPerson}
        onBack={() => {
          setOpenPerson(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">Всего должны вам</p>
        <p className="big-number" style={{ color: data.total_owed > 0 ? "var(--accent-red)" : undefined }}>
          {fmt(data.total_owed)}
          <span className="sum-unit">сум</span>
        </p>
      </div>

      <div className="card">
        <p className="card-title">Люди</p>
        {data.people.length === 0 && (
          <p className="empty-state">Пока никто не должен — добавьте человека, когда дадите в долг.</p>
        )}
        {data.people.map((p) => (
          <div className="list-row" key={p.id} style={{ cursor: "pointer" }} onClick={() => setOpenPerson(p.id)}>
            <span>{p.name}</span>
            <span style={{ color: p.balance > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>
              {fmt(p.balance)} сум ›
            </span>
          </div>
        ))}
      </div>

      {!form ? (
        <button className="primary-btn" onClick={() => setForm(true)}>
          Добавить должника
        </button>
      ) : (
        <div className="card">
          <input
            className="field"
            placeholder="Имя, например Азиз"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            className="field"
            inputMode="numeric"
            placeholder="Сколько должен, сум"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="secondary-btn" onClick={() => setForm(false)}>
              Отмена
            </button>
            <button className="primary-btn" onClick={createPerson} disabled={saving}>
              {saving ? "Сохраняю…" : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonDetail({ telegramId, personId, onBack }) {
  const showToast = useToast();
  const [data, setData] = useState(null); // { debtor, entries, balance }
  const [entryAmount, setEntryAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get(`/api/debts/people/${personId}`)
      .then((r) => setData(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [personId]);

  const addEntry = async (type) => {
    const value = parseInt(entryAmount.replace(/\D/g, ""), 10);
    if (!value) {
      showToast("Введите сумму");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/debts/people/${personId}/entries`, { type, amount: value });
      setEntryAmount("");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removePerson = async () => {
    try {
      await api.delete(`/api/debts/people/${personId}`);
      onBack();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  if (!data) return null;

  return (
    <div>
      <button className="icon-btn" style={{ padding: "0 0 10px", fontSize: 14 }} onClick={onBack}>
        ‹ Назад
      </button>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <p className="card-title" style={{ margin: 0 }}>{data.debtor.name}</p>
          <button className="icon-btn" onClick={removePerson} title="Убрать из списка">
            ✕
          </button>
        </div>
        <p className="big-number" style={{ color: data.balance > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>
          {fmt(data.balance)}
          <span className="sum-unit">сум {data.balance > 0 ? "должен" : "долга нет"}</span>
        </p>
      </div>

      <div className="card">
        <input
          className="field"
          inputMode="numeric"
          placeholder="Сумма, сум"
          value={entryAmount}
          onChange={(e) => setEntryAmount(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary-btn" onClick={() => addEntry("repaid")} disabled={saving}>
            Вернул
          </button>
          <button className="primary-btn" onClick={() => addEntry("lent")} disabled={saving}>
            Дал ещё в долг
          </button>
        </div>
      </div>

      <div className="card">
        <p className="card-title">История</p>
        {data.entries.length === 0 && <p className="empty-state">Записей пока нет</p>}
        {data.entries.map((e) => (
          <div className="list-row" key={e.id}>
            <span>{e.type === "lent" ? "Дал в долг" : "Вернул"}</span>
            <span style={{ color: e.type === "lent" ? "var(--accent-red)" : "var(--accent-green)" }}>
              {e.type === "lent" ? "+" : "−"}
              {fmt(e.amount)} сум
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
