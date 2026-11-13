import React, { useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  formatAmount,
  formatMonthArabic,
  getCategoryMeta,
  getMemberDisplayName,
  shiftMonth,
  type ExpenseCategory,
  type ExpenseEntry,
  type HouseholdSettings,
  type IncomeEntry,
} from '../types/finance';
import { CategoryIcon } from './CategoryIcon';

interface TransactionsViewProps {
  mode: 'expenses' | 'incomes';
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  expenses: ExpenseEntry[];
  incomes: IncomeEntry[];
  settings: HouseholdSettings;
  onAddExpense: () => void;
  onEditExpense: (entry: ExpenseEntry) => void;
  onDeleteExpense: (entry: ExpenseEntry) => void;
  onToggleExpenseStatus: (entry: ExpenseEntry) => void;
  onAddIncome: () => void;
  onEditIncome: (entry: IncomeEntry) => void;
  onDeleteIncome: (entry: IncomeEntry) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  mode,
  selectedMonth,
  onChangeMonth,
  expenses,
  incomes,
  settings,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onToggleExpenseStatus,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const monthExpenses = expenses.filter((e) => {
    if (e.month !== selectedMonth) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        getCategoryMeta(e.category).label.includes(q)
      );
    }
    return true;
  });

  const monthIncomes = incomes.filter((i) => {
    if (i.month !== selectedMonth) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q) ||
        (i.notes && i.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalFilteredExpenses = monthExpenses.reduce((acc, item) => acc + item.amount, 0);
  const totalFilteredIncomes = monthIncomes.reduce((acc, item) => acc + item.amount, 0);

  const exportCSV = () => {
    const bom = '\uFEFF';
    let csv = '';
    if (mode === 'expenses') {
      csv += 'التاريخ,الوصف,الفئة,النوع,الحالة,المبلغ,بواسطة,ملاحظات\n';
      monthExpenses.forEach((e) => {
        const row = [
          e.date,
          `"${e.title.replace(/"/g, '""')}"`,
          `"${getCategoryMeta(e.category).label}"`,
          e.entryType === 'bill' ? 'فاتورة' : 'يومي',
          e.status === 'paid' ? 'مدفوعة' : 'مستحقة',
          e.amount,
          `"${getMemberDisplayName(e.createdByEmail)}"`,
          `"${(e.notes || '').replace(/"/g, '""')}"`,
        ];
        csv += row.join(',') + '\n';
      });
    } else {
      csv += 'التاريخ,العنوان,المصدر,المبلغ,بواسطة,ملاحظات\n';
      monthIncomes.forEach((i) => {
        const row = [
          i.date,
          `"${i.title.replace(/"/g, '""')}"`,
          `"${i.source.replace(/"/g, '""')}"`,
          i.amount,
          `"${getMemberDisplayName(i.createdByEmail)}"`,
          `"${(i.notes || '').replace(/"/g, '""')}"`,
        ];
        csv += row.join(',') + '\n';
      });
    }

    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bills-tracker-${mode}-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonth(selectedMonth, -1))}
            aria-label="الشهر السابق"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1 sm:flex-initial sm:min-w-[160px] text-center px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatMonthArabic(selectedMonth)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonth(selectedMonth, 1))}
            aria-label="الشهر التالي"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCSV}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>تصدير CSV</span>
          </button>
          <button
            type="button"
            onClick={mode === 'expenses' ? onAddExpense : onAddIncome}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm ${
              mode === 'expenses'
                ? 'bg-gradient-to-l from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600'
                : 'bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{mode === 'expenses' ? 'إضافة مصروف' : 'إضافة دخل'}</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              mode === 'expenses'
                ? 'بحث في المصروفات أو الفواتير أو الملاحظات...'
                : 'بحث في مصادر الدخل...'
            }
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pr-10 pl-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {mode === 'expenses' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | ExpenseCategory)}
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">كل الفئات</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'paid', label: 'مدفوعة' },
                { id: 'pending', label: 'مستحقة' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as 'all' | 'paid' | 'pending')}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === st.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 lg:mr-auto whitespace-nowrap">
          الإجمالي:{' '}
          <span className="font-mono-num text-sm font-extrabold text-slate-900 dark:text-white">
            {formatAmount(
              mode === 'expenses' ? totalFilteredExpenses : totalFilteredIncomes,
              settings.currency
            )}
          </span>
        </div>
      </div>

      {/* Records List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {mode === 'expenses' ? (
          monthExpenses.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                لا توجد مصروفات مطابقة للبحث في {formatMonthArabic(selectedMonth)}.
              </p>
              <button
                type="button"
                onClick={onAddExpense}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-xs font-bold cursor-pointer"
              >
                إضافة مصروف جديد
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthExpenses.map((exp) => {
                const cat = getCategoryMeta(exp.category);
                return (
                  <div
                    key={exp.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <CategoryIcon category={exp.category} size="md" />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {exp.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleExpenseStatus(exp)}
                            title="تبديل حالة السداد"
                            className={`inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer ${
                              exp.status === 'paid'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {exp.status === 'paid' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>مدفوعة</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                <span>مستحقة</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {cat.label} · {exp.entryType === 'bill' ? 'فاتورة شهرية' : 'مصروف يومي'} ·{' '}
                          <span className="font-mono-num">{exp.date}</span> ·{' '}
                          {getMemberDisplayName(exp.createdByEmail)}
                        </p>
                        {exp.notes && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            {exp.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pr-13 sm:pr-0">
                      <span className="text-base font-extrabold font-mono-num text-rose-600 dark:text-rose-400">
                        -{formatAmount(exp.amount, settings.currency)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditExpense(exp)}
                          aria-label="تعديل"
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(exp)}
                          aria-label="حذف"
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : monthIncomes.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              لم يتم تسجيل مصادر دخل في {formatMonthArabic(selectedMonth)} بعد.
            </p>
            <button
              type="button"
              onClick={onAddIncome}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-xs font-bold cursor-pointer"
            >
              إضافة أول مصدر دخل
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {monthIncomes.map((inc) => (
              <div
                key={inc.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {inc.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {inc.source} · <span className="font-mono-num">{inc.date}</span> ·{' '}
                      {getMemberDisplayName(inc.createdByEmail)}
                    </p>
                    {inc.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {inc.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pr-13 sm:pr-0">
                  <span className="text-base font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400">
                    +{formatAmount(inc.amount, settings.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditIncome(inc)}
                      aria-label="تعديل"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteIncome(inc)}
                      aria-label="حذف"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
