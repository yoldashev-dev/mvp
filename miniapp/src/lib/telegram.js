// Обёртка над window.Telegram.WebApp — с безопасными фолбэками,
// чтобы приложение можно было открыть и в обычном браузере при разработке.
const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
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
