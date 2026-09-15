import db from "../db/index.js";

export const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || "6079747111");
export const DAY_MS = 86400000;

export function calculateUserStatus(user) {
  if (!user) return null;

  const now = Date.now();
  const isAdmin = Number(user.telegram_id) === ADMIN_TELEGRAM_ID;

  const trialEndsMs = user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : 0;
  const subscribedUntilMs = user.subscribed_until ? new Date(user.subscribed_until).getTime() : 0;

  const trialActive = trialEndsMs > now;
  const subscriptionActive = subscribedUntilMs > now;

  const trialDaysLeft = trialActive ? Math.max(1, Math.ceil((trialEndsMs - now) / DAY_MS)) : 0;
  const subscriptionDaysLeft = subscriptionActive
    ? Math.max(1, Math.ceil((subscribedUntilMs - now) / DAY_MS))
    : 0;

  const access = isAdmin || trialActive || subscriptionActive;

  let statusType = "expired";
  if (isAdmin) {
    statusType = "admin";
  } else if (subscriptionActive) {
    statusType = "subscribed";
  } else if (trialActive) {
    statusType = "trial";
  }

  return {
    ...user,
    is_admin: isAdmin,
    access,
    status_type: statusType, // 'admin' | 'subscribed' | 'trial' | 'expired'
    trial_active: trialActive,
    subscription_active: subscriptionActive,
    trial_days_left: trialDaysLeft,
    subscription_days_left: subscriptionDaysLeft,
  };
}

export function getUserAccessStatus(telegramId) {
  if (!telegramId) return null;
  const user = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(telegramId);
  if (!user) return null;
  return calculateUserStatus(user);
}

// Middleware для защиты роутов от пользователей с истёкшим доступом
export function requireAccess(req, res, next) {
  const telegramId =
    req.body?.telegram_id ||
    req.query?.telegram_id ||
    req.headers["x-telegram-id"] ||
    req.params?.telegramId;

  if (!telegramId) {
    return next();
  }

  const status = getUserAccessStatus(telegramId);
  if (!status) {
    return next(); // пользователь ещё не зарегистрирован, пропускаем (зарегистрируется)
  }

  if (!status.access) {
    return res.status(403).json({
      error: "subscription_expired",
      message: "Срок действия подписки или пробного периода истёк. Пожалуйста, оплатите подписку.",
      access: false,
    });
  }

  next();
}
