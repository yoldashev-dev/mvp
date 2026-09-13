---
name: miniapp-design-system
description: >-
  Enforces the unified UI design system, styling patterns, component conventions,
  color palette, dark mode handling, SVG icon guidelines, and bilingual rules for the RentBot Telegram Mini App.
  Activate whenever creating, modifying, styling, or reviewing UI components, pages, modals, cards, or layouts in the miniapp.
---

# RentBot Mini App Design System

This skill defines the visual language, design system, component patterns, and UI standards for the **RentBot Telegram Mini App**. Every page and component must strictly follow these rules to maintain a coherent, high-contrast, premium mobile aesthetic.

---

## 1. Core Design Philosophy

- **Minimalist & Clean:** Inspired by Apple iOS and Telegram native design. High scannability, ample whitespace, clear visual hierarchy.
- **Strict NO-EMOJI Rule in UI Controls:**
  - **NEVER** use raw emojis (e.g. 📊, 💳, ⚙️, ☀️, 🌙, ✅, ❌) inside cards, tab buttons, form fields, headers, or action buttons.
  - Emojis render inconsistently across Android, iOS, Windows, and custom Telegram themes.
  - **ALWAYS** use line vector SVG icons from `miniapp/src/components/Icon.jsx` (Feather/Lucide style, `stroke="currentColor"`, `strokeWidth={1.8}`).
- **Bilingual By Default:** Every label, placeholder, toast, and status text must support both Uzbek (`uz`) and Russian (`ru`) via `useSettings()`.
- **Haptic Feedback:** Call `hapticImpact('light' | 'medium' | 'heavy')` from `../lib/telegram.js` on primary button taps, modal opens, and toggle actions.

---

## 2. Color Palette & Dark Mode Tokens

Styles are declared in `miniapp/src/styles.css`. Always use CSS variables. Never hardcode static hex colors for text, backgrounds, or borders.

| CSS Variable | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- |
| `var(--bg)` | `#FAFAFA` | `#121214` | Application background |
| `var(--surface)` | `#FFFFFF` | `#1E1E24` | Card & modal background |
| `var(--ink)` | `#111111` | `#FFFFFF` | Primary text and dark buttons |
| `var(--hint)` | `#8C8C8C` | `#8E8E93` | Secondary text, labels, units |
| `var(--line)` | `#E5E5E5` | `#2C2C34` | Subtle borders, dividers |
| `var(--line-strong)` | `#1A1A1A` | `#3D3D48` | Focused borders, active outlines |
| `var(--accent)` | `#3B6EFF` | `#3B82F6` | Primary blue: income, progress, active tabs |
| `var(--accent-alert)` | `#DC2626` | `#EF4444` | Red: expenses, debts, errors, alerts |

---

## 3. Standard Component Patterns

### A. Card (`.card`)
Cards are the foundational building block for content.

```jsx
<div className="card">
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon width={18} height={18} style={{ color: "var(--accent)" }} />
      <p className="card-title" style={{ margin: 0 }}>
        {isUz ? "Sarlavha" : "Заголовок"}
      </p>
    </div>
    {/* Optional status pill */}
    <span className="pill pill-green">{isUz ? "Faol" : "Активен"}</span>
  </div>

  {/* Main content */}
</div>
```

### B. Metrics & Numbers
```jsx
<p className="big-number">
  {value}
  <span className="sum-unit">{currencySymbol}</span>
</p>
```
- `.big-number`: 32px, `font-weight: 500`, `letter-spacing: -0.02em`, tabular numbers.
- `.sum-unit`: 15px, `color: var(--hint)`, margin-left 4px.

### C. Status Pills (`.pill`)
- Active / Positive: `<span className="pill pill-green">Faol / Активен</span>`
- Expired / Overdue / Warning: `<span className="pill pill-red">Kechikkan / Просрочен</span>`
- Neutral: `<span className="pill pill-gold">Neytral</span>`

### D. Progress Bars
```jsx
<div className="progress-track" style={{ margin: "12px 0 6px" }}>
  <div className="progress-fill" style={{ width: `${percent}%` }} />
</div>
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--hint)" }}>
  <span>{isUz ? "Boshlanishi" : "Старт"}</span>
  <span>{isUz ? "Jami" : "Всего"}</span>
</div>
```

### E. Buttons
1. **Primary Button (`.primary-btn`):**
   Full-width prominent call to action.
   ```jsx
   <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
     {loading ? (isUz ? "Kutilmoqda…" : "Обрабатываю…") : (isUz ? "Saqlash" : "Сохранить")}
   </button>
   ```
2. **Secondary Button (`.secondary-btn`):**
   Subtle outline button for secondary actions.
3. **Tab Toggle Buttons (`.tab-btn`):**
   Pill-shaped toggle buttons. Active state uses `.active`.
   ```jsx
   <button className={"tab-btn" + (selected === "opt" ? " active" : "")} onClick={...}>
     Label
   </button>
   ```
4. **Action Pair Buttons (`.action-btn`):**
   Large icon-over-text buttons for quick transaction entry (Income: dark, Expense: surface outline).

### F. Lists and Rows (`.more-row` & `.list-row`)
For menu lists and settings items:
```jsx
<Link className="more-row" to="/target">
  <span className="more-row-left">
    <Icon className="more-row-icon" width={20} height={20} />
    {label}
  </span>
  <ChevronRightIcon className="more-row-chevron" width={18} height={18} />
</Link>
```

---

## 4. Vector SVG Icons (`Icon.jsx`)

Always import and use icons from `miniapp/src/components/Icon.jsx`:
- Navigation: `HomeIcon`, `TargetIcon`, `HandshakeIcon`, `MoreIcon`
- Tools & Settings: `SettingsIcon`, `ClockIcon`, `ChartIcon`, `CalculatorIcon`, `CardIcon`
- Controls: `PlusIcon`, `MinusIcon`, `CloseIcon`, `ChevronRightIcon`
- Status & Badges: `CheckIcon`, `AlertIcon`, `ShieldCheckIcon`, `SparklesIcon`
- Preferences: `GlobeIcon`, `CoinsIcon`, `SunIcon`, `MoonIcon`

When creating new icons in `Icon.jsx`:
- Inherit default attributes using `{...base}`: `viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth={1.8}`, `fill="none"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.
- Size icons using standard dimensions: `width={18}`/`height={18}` for titles/items, `width={20}`/`height={20}` for nav/action buttons.

---

## 5. Toast Notifications & Haptics

```jsx
import { useToast } from "../lib/toast.jsx";
import { hapticImpact } from "../lib/telegram.js";

const showToast = useToast();

// Success
hapticImpact("medium");
showToast(isUz ? "Muvaffaqiyatli saqlandi!" : "Успешно сохранено!", "success");

// Error
hapticImpact("heavy");
showToast(errorMessage(err), "error");
```

---

## 6. Pre-Commit Verification Checklist

Before completing any UI change in the miniapp:
1. [ ] Are all text elements bilingual (supporting both `isUz` and Russian)?
2. [ ] Are there zero raw emojis in UI buttons, tabs, or headers?
3. [ ] Are all colors mapped to CSS variables (`var(--...)`)?
4. [ ] Does the screen look correct in both Light mode and Dark mode?
5. [ ] Does `npm.cmd run build` in `miniapp` compile cleanly with 0 errors?
