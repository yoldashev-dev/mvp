import db from "../db/index.js";

/**
 * Считает финансовую картину пользователя и даёт рекомендацию:
 * сколько можно откладывать на цели, не уходя в минус.
 *
 * Логика (простая, но честная для MVP):
 *  1. Берём чистую прибыль (доход - расход) за последние N дней.
 *  2. Считаем средний дневной доход и прибыль.
 *  3. Вычитаем ближайшие обязательные платежи (напоминания: аренда и т.п.)
 *     на ближайшие 30 дней.
 *  4. То, что остаётся после "обязательной подушки", делим:
 *     - 50% можно откладывать на цели
 *     - 50% остаётся как резерв бизнеса (буфер на форс-мажоры)
 *  5. Если после вычета обязательных платежей ничего не остаётся —
 *     рекомендация 0 и предупреждение.
 */
const LOOKBACK_DAYS = 30;
const SAVE_RATE = 0.5; // доля свободной прибыли, которую можно откладывать

export function getFinancialSnapshot(telegramId) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);

  const rows = db
    .prepare(
      `SELECT type, amount, created_at FROM transactions
       WHERE telegram_id = ? AND date(created_at) >= date(?)`
    )
    .all(telegramId, since);

  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const profit = income - expense;

  const daysWithData = new Set(rows.map((r) => r.created_at.slice(0, 10))).size || 1;
  const avgDailyProfit = profit / daysWithData;

  const reminders = db
    .prepare(`SELECT amount FROM reminders WHERE telegram_id = ? AND is_active = 1`)
    .all(telegramId);
  const upcomingFixedCosts = reminders.reduce((s, r) => s + (r.amount || 0), 0);

  const projectedMonthlyProfit = avgDailyProfit * 30;
  const freeAfterFixedCosts = Math.max(0, projectedMonthlyProfit - upcomingFixedCosts);

  const recommendedMonthlySaving = Math.round(freeAfterFixedCosts * SAVE_RATE);
  const recommendedDailySaving = Math.round(recommendedMonthlySaving / 30);

  const warning =
    projectedMonthlyProfit < upcomingFixedCosts
      ? "Внимание: при текущем темпе прибыли может не хватить на обязательные платежи (аренда и т.п.). Пока лучше не откладывать на цели."
      : null;

  return {
    period_days: LOOKBACK_DAYS,
    income_total: income,
    expense_total: expense,
    profit_total: profit,
    avg_daily_profit: Math.round(avgDailyProfit),
    projected_monthly_profit: Math.round(projectedMonthlyProfit),
    upcoming_fixed_costs: upcomingFixedCosts,
    recommended_monthly_saving: recommendedMonthlySaving,
    recommended_daily_saving: recommendedDailySaving,
    warning,
  };
}

/**
 * Прогноз по конкретной цели. Если у пользователя несколько активных целей —
 * рекомендованная сумма делится между ними поровну (activeGoalsCount).
 */
export function getGoalProjection(telegramId, goal, activeGoalsCount = 1) {
  const snapshot = getFinancialSnapshot(telegramId);
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const share = Math.max(1, activeGoalsCount);

  const dailyForThisGoal = Math.floor(snapshot.recommended_daily_saving / share);
  const monthlyForThisGoal = Math.floor(snapshot.recommended_monthly_saving / share);

  const canBuyNow = remaining <= 0;

  if (canBuyNow) {
    return { ...snapshot, remaining: 0, can_buy_now: true, days_to_goal: 0, weeks_to_goal: 0 };
  }

  if (dailyForThisGoal <= 0) {
    return {
      ...snapshot,
      remaining,
      can_buy_now: false,
      days_to_goal: null,
      weeks_to_goal: null,
      daily_for_this_goal: 0,
      monthly_for_this_goal: 0,
    };
  }

  const daysToGoal = Math.ceil(remaining / dailyForThisGoal);
  const weeksToGoal = Math.ceil(daysToGoal / 7);

  return {
    ...snapshot,
    remaining,
    can_buy_now: false,
    daily_for_this_goal: dailyForThisGoal,
    monthly_for_this_goal: monthlyForThisGoal,
    days_to_goal: daysToGoal,
    // Если накопление меньше 2 недель — удобнее показывать в днях, а не в неделях
    weeks_to_goal: daysToGoal > 13 ? weeksToGoal : null,
  };
}
