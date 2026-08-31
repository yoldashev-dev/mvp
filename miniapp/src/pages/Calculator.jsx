import React, { useState } from "react";
import { hapticImpact } from "../lib/telegram.js";

const KEYS = [
  "C", "±", "%", "÷",
  "7", "8", "9", "×",
  "4", "5", "6", "−",
  "1", "2", "3", "+",
  "0", ",", "=",
];

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);

  const inputDigit = (d) => {
    hapticImpact("light");
    if (fresh || display === "0") {
      setDisplay(d);
      setFresh(false);
    } else {
      setDisplay(display + d);
    }
  };

  const inputComma = () => {
    if (fresh) {
      setDisplay("0,");
      setFresh(false);
      return;
    }
    if (!display.includes(",")) setDisplay(display + ",");
  };

  const clear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const toggleSign = () => {
    if (display === "0") return;
    setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
  };

  const percent = () => {
    setDisplay(String(parseFloat(display.replace(",", ".")) / 100).replace(".", ","));
  };

  const compute = (a, b, operator) => {
    switch (operator) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const chooseOp = (operator) => {
    const current = parseFloat(display.replace(",", "."));
    if (prev !== null && op && !fresh) {
      const result = compute(prev, current, op);
      setDisplay(formatResult(result));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(operator);
    setFresh(true);
  };

  const equals = () => {
    if (op === null || prev === null) return;
    const current = parseFloat(display.replace(",", "."));
    const result = compute(prev, current, op);
    setDisplay(formatResult(result));
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const press = (key) => {
    if (key === "C") return clear();
    if (key === "±") return toggleSign();
    if (key === "%") return percent();
    if (key === ",") return inputComma();
    if (key === "=") return equals();
    if (["+", "−", "×", "÷"].includes(key)) return chooseOp(key);
    inputDigit(key);
  };

  return (
    <div>
      <div className="calc-display">{display}</div>
      <div className="calc-grid">
        {KEYS.map((k, i) => (
          <button
            key={i}
            className={
              "calc-key" +
              (["+", "−", "×", "÷"].includes(k) ? " op" : "") +
              (k === "=" ? " equals" : "") +
              (k === "C" ? " clear" : "")
            }
            onClick={() => press(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <p className="muted" style={{ textAlign: "center", marginTop: 14 }}>
        Обычный калькулятор — для быстрых расчётов на глаз, без сохранения в отчёты.
      </p>
    </div>
  );
}

function formatResult(n) {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace(".", ",");
}
