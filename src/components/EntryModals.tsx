import React, { useState, useEffect } from 'react';
import { X, Receipt, Wallet, PiggyBank, Settings } from 'lucide-react';
import {
  CURRENCY_OPTIONS,
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  SAVING_GOALS,
  getCurrentDateISO,
  type ExpenseCategory,
  type ExpenseEntry,
  type ExpenseEntryType,
  type ExpenseStatus,
  type HouseholdSettings,
  type IncomeEntry,
  type SavingEntry,
  type SavingKind,
} from '../types/finance';
import type { ExpenseInput, IncomeInput, SavingInput } from '../services/firebase';
import { CategoryIcon } from './CategoryIcon';

/* ================= EXPENSE / BILL MODAL ================= */

interface ExpenseModalProps {
  isOpen: boolean;
  editingEntry: ExpenseEntry | null;
  defaultMonth: string;
  currency: string;
  onClose: () => void;
  onSave: (input: ExpenseInput, editingId?: string) => Promise<void>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  editingEntry,
  defaultMonth,
  currency,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [entryType, setEntryType] = useState<ExpenseEntryType>('daily');
  const [status, setStatus] = useState<ExpenseStatus>('paid');
  const [date, setDate] = useState(getCurrentDateISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingEntry) {
      setTitle(editingEntry.title);
      setAmount(String(editingEntry.amount));
      setCategory(editingEntry.category);
      setEntryType(editingEntry.entryType);
      setStatus(editingEntry.status);
      setDate(editingEntry.date);
      setNotes(editingEntry.notes || '');
    } else {
      const today = getCurrentDateISO();
      setTitle('');
      setAmount('');
      setCategory('food');
      setEntryType('daily');
      setStatus('paid');
      setDate(today.startsWith(defaultMonth) ? today : `${defaultMonth}-01`);
      setNotes('');
    }
  }, [isOpen, editingEntry, defaultMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!title.trim()) {
      setError('يرجى كتابة وصف المصروف أو الفاتورة');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          title: title.trim(),
          amount: num,
          category,
          entryType,
          status,
          date,
          notes: notes.trim(),
        },
        editingEntry?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ المصروف');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 pt-3 pb-3 sm:px-6 sm:pt-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {editingEntry ? 'تعديل مصروف / فاتورة' : 'تسجيل مصروف أو فاتورة'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Type switcher: Daily vs Bill */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setEntryType('daily');
                setStatus('paid');
              }}
              className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                entryType === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              مصروف يومي
            </button>
            <button
              type="button"
              onClick={() => setEntryType('bill')}
              className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                entryType === 'bill'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              فاتورة شهرية / التزام
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              الوصف
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مقاضي السوبر ماركت، فاتورة الكهرباء..."
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                المبلغ ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                dir="ltr"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                التاريخ
              </label>
              <input
                type="date"
                required
                dir="ltr"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Visual Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              التصنيف
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const selected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`min-h-[44px] p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-2 transition-all cursor-pointer text-right ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CategoryIcon category={cat.id} size="sm" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              حالة السداد
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-[44px]">
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  status === 'paid'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                تم الدفع
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  status === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                مستحقة
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              ملاحظات (اختياري)
            </label>
            <textarea
              rows={2}
              maxLength={400}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل إضافية..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[46px] px-6 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-60 shadow-md shadow-emerald-600/20"
            >
              {saving ? 'جاري الحفظ...' : editingEntry ? 'حفظ التعديلات' : 'إضافة المصروف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= INCOME MODAL ================= */

interface IncomeModalProps {
  isOpen: boolean;
  editingEntry: IncomeEntry | null;
  defaultMonth: string;
  currency: string;
  onClose: () => void;
  onSave: (input: IncomeInput, editingId?: string) => Promise<void>;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  editingEntry,
  defaultMonth,
  currency,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState(INCOME_SOURCES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getCurrentDateISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingEntry) {
      setTitle(editingEntry.title);
      setSource(editingEntry.source);
      setAmount(String(editingEntry.amount));
      setDate(editingEntry.date);
      setNotes(editingEntry.notes || '');
    } else {
      const today = getCurrentDateISO();
      setTitle('');
      setSource(INCOME_SOURCES[0]);
      setAmount('');
      setDate(today.startsWith(defaultMonth) ? today : `${defaultMonth}-01`);
      setNotes('');
    }
  }, [isOpen, editingEntry, defaultMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!title.trim()) {
      setError('يرجى إدخال وصف الدخل');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          title: title.trim(),
          source: source.trim(),
          amount: num,
          date,
          notes: notes.trim(),
        },
        editingEntry?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الدخل');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
        <div className="px-5 pt-3 pb-3 sm:px-6 sm:pt-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {editingEntry ? 'تعديل مصدر دخل' : 'إضافة مصدر دخل شهري'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              مصدر الدخل
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {INCOME_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              البيان / العنوان
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: راتب شهر نوفمبر، مشروع إضافي..."
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                المبلغ ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                dir="ltr"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                تاريخ الاستلام
              </label>
              <input
                type="date"
                required
                dir="ltr"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              ملاحظات (اختياري)
            </label>
            <textarea
              rows={2}
              maxLength={400}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تفاصيل إضافية حول هذا الدخل..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[46px] px-6 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-60 shadow-md shadow-emerald-600/20"
            >
              {saving ? 'جاري الحفظ...' : editingEntry ? 'حفظ التعديلات' : 'إضافة الدخل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= SAVING MODAL ================= */

interface SavingModalProps {
  isOpen: boolean;
  editingEntry: SavingEntry | null;
  defaultMonth: string;
  currency: string;
  onClose: () => void;
  onSave: (input: SavingInput, editingId?: string) => Promise<void>;
}

export const SavingModal: React.FC<SavingModalProps> = ({
  isOpen,
  editingEntry,
  defaultMonth,
  currency,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [goalName, setGoalName] = useState(SAVING_GOALS[0]);
  const [kind, setKind] = useState<SavingKind>('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getCurrentDateISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingEntry) {
      setTitle(editingEntry.title);
      setGoalName(editingEntry.goalName);
      setKind(editingEntry.kind);
      setAmount(String(editingEntry.amount));
      setDate(editingEntry.date);
      setNotes(editingEntry.notes || '');
    } else {
      const today = getCurrentDateISO();
      setTitle('');
      setGoalName(SAVING_GOALS[0]);
      setKind('deposit');
      setAmount('');
      setDate(today.startsWith(defaultMonth) ? today : `${defaultMonth}-01`);
      setNotes('');
    }
  }, [isOpen, editingEntry, defaultMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!title.trim()) {
      setError('يرجى كتابة عنوان حركة التوفير');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          title: title.trim(),
          goalName: goalName.trim(),
          kind,
          amount: num,
          date,
          notes: notes.trim(),
        },
        editingEntry?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ التوفير');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
        <div className="px-5 pt-3 pb-3 sm:px-6 sm:pt-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <PiggyBank className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {editingEntry ? 'تعديل حركة توفير' : 'تسجيل حركة توفير'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setKind('deposit')}
              className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                kind === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              إيداع للتوفير
            </button>
            <button
              type="button"
              onClick={() => setKind('withdraw')}
              className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                kind === 'withdraw'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              سحب من التوفير
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              هدف / صندوق التوفير
            </label>
            <select
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {SAVING_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              الوصف
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: استقطاع توفير الشهر، سحب طوارئ..."
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                المبلغ ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                dir="ltr"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                التاريخ
              </label>
              <input
                type="date"
                required
                dir="ltr"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              ملاحظات (اختياري)
            </label>
            <textarea
              rows={2}
              maxLength={400}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[46px] px-6 py-2 rounded-xl bg-gradient-to-l from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-60 shadow-md shadow-sky-600/20"
            >
              {saving ? 'جاري الحفظ...' : editingEntry ? 'حفظ التعديلات' : 'تسجيل الحركة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= SETTINGS MODAL ================= */

interface SettingsModalProps {
  isOpen: boolean;
  settings: HouseholdSettings;
  onClose: () => void;
  onSave: (settings: HouseholdSettings) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [householdName, setHouseholdName] = useState(settings.householdName);
  const [currency, setCurrency] = useState(settings.currency);
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState(String(settings.monthlyBudgetLimit));
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState(String(settings.monthlySavingsTarget));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setHouseholdName(settings.householdName);
    setCurrency(settings.currency);
    setMonthlyBudgetLimit(String(settings.monthlyBudgetLimit));
    setMonthlySavingsTarget(String(settings.monthlySavingsTarget));
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        householdName: householdName.trim() || 'ميزانية المنزل',
        currency,
        monthlyBudgetLimit: Math.max(0, Number(monthlyBudgetLimit) || 0),
        monthlySavingsTarget: Math.max(0, Number(monthlySavingsTarget) || 0),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
        <div className="px-5 pt-3 pb-3 sm:px-6 sm:pt-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                إعدادات الميزانية المنزلية
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              اسم الميزانية
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              العملة الافتراضية
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                سقف المصروفات الشهري
              </label>
              <input
                type="number"
                min="0"
                step="50"
                dir="ltr"
                value={monthlyBudgetLimit}
                onChange={(e) => setMonthlyBudgetLimit(e.target.value)}
                className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                هدف التوفير الشهري
              </label>
              <input
                type="number"
                min="0"
                step="50"
                dir="ltr"
                value={monthlySavingsTarget}
                onChange={(e) => setMonthlySavingsTarget(e.target.value)}
                className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[46px] px-6 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-700 hover:to-teal-700 cursor-pointer disabled:opacity-60 shadow-md shadow-emerald-600/20"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
