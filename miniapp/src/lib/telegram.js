// Обёртка над window.Telegram.WebApp — с безопасными фолбэками,
// чтобы приложение можно было открыть и в обычном браузере при разработке.
const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();

  // Наша палитра зафиксирована (не следует системной теме пользователя),
  // поэтому просим Telegram покрасить свою "родную" шапку и фон под наш
  // светлый дизайн — иначе в тёмной теме получится разнобой: тёмная шапка
  // Telegram сверху и наш всегда светлый интерфейс снизу.
  try {
    tg.setHeaderColor("#FFFFFF");
    tg.setBackgroundColor("#FAFAFA");
  } catch {
    // Старые версии Telegram-клиента могут не поддерживать эти методы —
    // тогда просто оставляем их тему как есть, это не критично.
  }
}

export function getTelegramUser() {
  const user = tg?.initDataUnsafe?.user;
  if (user) return user;
  // Фолбэк для разработки в браузере
  return { id: 123456789, first_name: "Тест", username: "test_user" };
}

export function hapticImpact(style = "light") {
  tg?.HapticFeedback?.impactOccurred(style);
}

export function showMainButton(text, onClick) {
  if (!tg) return;
  tg.MainButton.setText(text);
  tg.MainButton.show();
  tg.MainButton.onClick(onClick);
}

export function hideMainButton() {
  tg?.MainButton?.hide();
}

export function openLink(url) {
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, "_blank");
  }
}

export default tg;
