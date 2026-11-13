import React from 'react';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  formatAmount,
  formatMonthArabic,
  getCategoryMeta,
  getMemberDisplayName,
  shiftMonth,
  type ExpenseEntry,
  type HouseholdSettings,
  type IncomeEntry,
  type SavingEntry,
} from '../types/finance';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  savings: SavingEntry[];
  settings: HouseholdSettings;
  onOpenExpenseModal: (entry?: ExpenseEntry | null) => void;
  onOpenIncomeModal: (entry?: IncomeEntry | null) => void;
  onOpenSavingModal: (entry?: SavingEntry | null) => void;
  onToggleExpenseStatus: (entry: ExpenseEntry) => void;
  onNavigateTab: (tab: 'dashboard' | 'expenses' | 'incomes' | 'savings') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedMonth,
  onChangeMonth,
  incomes,
  expenses,
  savings,
  settings,
  onOpenExpenseModal,
  onOpenIncomeModal,
  onOpenSavingModal,
  onToggleExpenseStatus,
  onNavigateTab,
}) => {
  const monthIncomes = incomes.filter((i) => i.month === selectedMonth);
  const monthExpenses = expenses.filter((e) => e.month === selectedMonth);
  const monthSavings = savings.filter((s) => s.month === selectedMonth);

  const totalIncome = monthIncomes.reduce((acc, item) => acc + item.amount, 0);
  const totalExpenses = monthExpenses.reduce((acc, item) => acc + item.amount, 0);
  const paidExpenses = monthExpenses
    .filter((e) => e.status === 'paid')
    .reduce((acc, item) => acc + item.amount, 0);
  const pendingBills = monthExpenses.filter((e) => e.status === 'pending');
  const pendingTotal = pendingBills.reduce((acc, item) => acc + item.amount, 0);

  const monthlyNetSavings = monthSavings.reduce(
    (acc, item) => acc + (item.kind === 'deposit' ? item.amount : -item.amount),
    0
  );
  const cumulativeSavings = savings.reduce(
    (acc, item) => acc + (item.kind === 'deposit' ? item.amount : -item.amount),
    0
  );

  const remainingBalance = totalIncome - totalExpenses - Math.max(0, monthlyNetSavings);
  const budgetUsagePct =
    settings.monthlyBudgetLimit > 0
      ? Math.min(100, Math.round((totalExpenses / settings.monthlyBudgetLimit) * 100))
      : 0;

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => {
    const sum = monthExpenses
      .filter((e) => e.category === cat.id)
      .reduce((acc, item) => acc + item.amount, 0);
    return {
      ...cat,
      total: sum,
      pct: totalExpenses > 0 ? Math.round((sum / totalExpenses) * 100) : 0,
    };
  })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const recentExpenses = monthExpenses.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Month Navigator & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonth(selectedMonth, -1))}
            aria-label="الشهر السابق"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1 md:flex-initial md:min-w-[170px] text-center px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatMonthArabic(selectedMonth)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonth(selectedMonth, 1))}
            aria-label="الشهر التالي"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenExpenseModal(null)}
            className="min-h-[44px] px-2.5 sm:px-4 py-2 rounded-xl bg-gradient-to-l from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-rose-500/20"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>مصروف</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenIncomeModal(null)}
            className="min-h-[44px] px-2.5 sm:px-4 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>دخل</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenSavingModal(null)}
            className="min-h-[44px] px-2.5 sm:px-4 py-2 rounded-xl bg-gradient-to-l from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-sky-600/20"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>توفير</span>
          </button>
        </div>
      </div>

      {/* 4-Column Financial KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي الدخل الشهري
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono-num text-emerald-700 dark:text-emerald-400">
            {formatAmount(totalIncome, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{monthIncomes.length} مصادر دخل مسجلة</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي المصروفات والفواتير
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono-num text-rose-600 dark:text-rose-400">
            {formatAmount(totalExpenses, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
            <span>مدفوع: {formatAmount(paidExpenses, settings.currency)}</span>
            {pendingTotal > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  مستحق: {formatAmount(pendingTotal, settings.currency)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              صافي الباقي من الشهر
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                remainingBalance >= 0
                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold font-mono-num ${
              remainingBalance >= 0
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatAmount(remainingBalance, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {settings.monthlyBudgetLimit > 0
                ? `استهلاك ${budgetUsagePct}% من السقف (${formatAmount(settings.monthlyBudgetLimit, settings.currency)})`
                : 'الدخل مطروحاً منه المصروفات والتوفير'}
            </span>
          </div>
        </div>

        {/* Savings */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              التوفير (الرصيد التراكمي)
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono-num text-sky-600 dark:text-sky-400">
            {formatAmount(cumulativeSavings, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>صافي هذا الشهر: {formatAmount(monthlyNetSavings, settings.currency)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                توزيع المصروفات حسب الفئة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatMonthArabic(selectedMonth)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('expenses')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>كل المصروفات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categoryTotals.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                لم يتم تسجيل مصروفات في {formatMonthArabic(selectedMonth)} بعد.
              </p>
              <button
                type="button"
                onClick={() => onOpenExpenseModal(null)}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-xs font-bold cursor-pointer"
              >
                تسجيل أول مصروف
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryTotals.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon category={cat.id} size="sm" />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono-num shrink-0">
                      <span className="text-slate-900 dark:text-white font-bold">
                        {formatAmount(cat.total, settings.currency)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        {cat.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.barClass}`}
                      style={{ width: `${Math.max(cat.pct, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pending Bills */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                فواتير مستحقة الدفع
              </h2>
              <span className="text-xs font-mono-num text-amber-600 dark:text-amber-400 font-bold">
                {pendingBills.length} فواتير
              </span>
            </div>

            {pendingBills.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                لا توجد فواتير معلقة لهذا الشهر. جميع الالتزامات مسددة.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingBills.map((bill) => (
                  <div key={bill.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon category={bill.category} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {bill.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {getCategoryMeta(bill.category).label} · {bill.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold font-mono-num text-amber-600 dark:text-amber-400">
                        {formatAmount(bill.amount, settings.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleExpenseStatus(bill)}
                        className="min-h-[36px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                      >
                        سداد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Monthly Income Sources */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                مصادر الدخل للشهر
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab('incomes')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
              >
                إدارة الدخل
              </button>
            </div>

            {monthIncomes.length === 0 ? (
              <div className="py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  لم تتم إضافة مصادر دخل لـ {formatMonthArabic(selectedMonth)} بعد.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenIncomeModal(null)}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  إضافة دخل الشهر
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthIncomes.map((inc) => (
                  <div
                    key={inc.id}
                    className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-colors"
                    onClick={() => onOpenIncomeModal(inc)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {inc.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {inc.source} · {inc.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold font-mono-num text-emerald-600 dark:text-emerald-400 shrink-0">
                      +{formatAmount(inc.amount, settings.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Recent Expenses Feed */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            أحدث المصروفات والفواتير
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('expenses')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
          >
            عرض السجل الكامل
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
            لا توجد حركات مسجلة في هذا الشهر.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentExpenses.map((exp) => {
              const cat = getCategoryMeta(exp.category);
              return (
                <div
                  key={exp.id}
                  onClick={() => onOpenExpenseModal(exp)}
                  className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon category={exp.category} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {exp.title}
                        </span>
                        {exp.status === 'paid' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {cat.label} · {exp.entryType === 'bill' ? 'فاتورة' : 'يومي'} · {exp.date} ·{' '}
                        {getMemberDisplayName(exp.createdByEmail)}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-sm font-extrabold font-mono-num text-rose-600 dark:text-rose-400">
                      -{formatAmount(exp.amount, settings.currency)}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      {exp.status === 'paid' ? 'مدفوعة' : 'مستحقة'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
