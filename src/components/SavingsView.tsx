import React from 'react';
import { Plus, PiggyBank, Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import {
  formatAmount,
  formatMonthArabic,
  getMemberDisplayName,
  type HouseholdSettings,
  type SavingEntry,
} from '../types/finance';

interface SavingsViewProps {
  selectedMonth: string;
  savings: SavingEntry[];
  settings: HouseholdSettings;
  onAddSaving: () => void;
  onEditSaving: (entry: SavingEntry) => void;
  onDeleteSaving: (entry: SavingEntry) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  selectedMonth,
  savings,
  settings,
  onAddSaving,
  onEditSaving,
  onDeleteSaving,
}) => {
  const totalCumulative = savings.reduce(
    (acc, s) => acc + (s.kind === 'deposit' ? s.amount : -s.amount),
    0
  );
  const monthSavings = savings.filter((s) => s.month === selectedMonth);
  const monthNet = monthSavings.reduce(
    (acc, s) => acc + (s.kind === 'deposit' ? s.amount : -s.amount),
    0
  );

  const targetProgress =
    settings.monthlySavingsTarget > 0
      ? Math.min(100, Math.max(0, Math.round((monthNet / settings.monthlySavingsTarget) * 100)))
      : 0;

  // Aggregate by goalName
  const goalMap = new Map<string, number>();
  savings.forEach((s) => {
    const prev = goalMap.get(s.goalName) || 0;
    goalMap.set(s.goalName, prev + (s.kind === 'deposit' ? s.amount : -s.amount));
  });
  const goalsList = Array.from(goalMap.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">صندوق التوفير والأهداف</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            متابعة التوفير التراكمي وأهداف الادخار الشهرية للمنزل
          </p>
        </div>

        <button
          type="button"
          onClick={onAddSaving}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إيداع أو سحب توفير</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              إجمالي رصيد التوفير التراكمي
            </span>
            <PiggyBank className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono-num text-blue-700 dark:text-blue-400">
            {formatAmount(totalCumulative, settings.currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            عبر {savings.length} حركة مسجلة
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            صافي توفير {formatMonthArabic(selectedMonth)}
          </span>
          <div className="text-2xl font-extrabold font-mono-num text-slate-900 dark:text-white mt-2">
            {formatAmount(monthNet, settings.currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            الهدف الشهري: {formatAmount(settings.monthlySavingsTarget, settings.currency)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>نسبة تحقق هدف الشهر</span>
            <span className="font-mono-num text-slate-900 dark:text-white">{targetProgress}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden my-3">
            <div
              className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
              style={{ width: `${targetProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {targetProgress >= 100
              ? 'ممتاز، تم تحقيق هدف التوفير الشهري'
              : `متبقي ${formatAmount(Math.max(0, settings.monthlySavingsTarget - monthNet), settings.currency)} للهدف`}
          </p>
        </div>
      </div>

      {/* Goals Breakdown */}
      {goalsList.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            الأرصدة حسب صندوق التوفير
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalsList.map(([goal, total]) => (
              <div
                key={goal}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4"
              >
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{goal}</p>
                <p className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white mt-1">
                  {formatAmount(total, settings.currency)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Savings History */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">سجل حركات التوفير</h3>
        </div>
        {savings.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              لم يتم تسجيل أي مبالغ توفير بعد.
            </p>
            <button
              type="button"
              onClick={onAddSaving}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              تسجيل أول مبلغ توفير
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {savings.map((s) => (
              <div
                key={s.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      s.kind === 'deposit'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {s.kind === 'deposit' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.goalName} · <span className="font-mono-num">{s.date}</span> ·{' '}
                      {getMemberDisplayName(s.createdByEmail)}
                    </p>
                    {s.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {s.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span
                    className={`text-base font-extrabold font-mono-num ${
                      s.kind === 'deposit'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {s.kind === 'deposit' ? '+' : '-'}
                    {formatAmount(s.amount, settings.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditSaving(s)}
                      aria-label="تعديل"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSaving(s)}
                      aria-label="حذف"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
