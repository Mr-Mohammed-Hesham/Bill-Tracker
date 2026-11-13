export type ExpenseCategory =
  | 'food'
  | 'utilities'
  | 'housing'
  | 'transport'
  | 'health'
  | 'shopping'
  | 'family'
  | 'entertainment'
  | 'other';

export type ExpenseEntryType = 'daily' | 'bill';
export type ExpenseStatus = 'paid' | 'pending';
export type SavingKind = 'deposit' | 'withdraw';

export interface IncomeEntry {
  id: string;
  title: string;
  source: string;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  notes: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExpenseEntry {
  id: string;
  title: string;
  category: ExpenseCategory;
  entryType: ExpenseEntryType;
  status: ExpenseStatus;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  notes: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SavingEntry {
  id: string;
  title: string;
  goalName: string;
  kind: SavingKind;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  notes: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HouseholdSettings {
  householdName: string;
  currency: string;
  monthlyBudgetLimit: number;
  monthlySavingsTarget: number;
  updatedByUid?: string;
  updatedAt?: unknown;
}

export const DEFAULT_HOUSEHOLD_SETTINGS: HouseholdSettings = {
  householdName: 'ميزانية المنزل',
  currency: 'ج.م',
  monthlyBudgetLimit: 15000,
  monthlySavingsTarget: 3000,
};

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  barClass: string;
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  {
    id: 'food',
    label: 'طعام ومقاضي',
    color: '#059669',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    barClass: 'bg-emerald-600 dark:bg-emerald-500',
  },
  {
    id: 'utilities',
    label: 'فواتير وخدمات',
    color: '#d97706',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-400',
    barClass: 'bg-amber-600 dark:bg-amber-500',
  },
  {
    id: 'housing',
    label: 'سكن وإيجار',
    color: '#2563eb',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-400',
    barClass: 'bg-blue-600 dark:bg-blue-500',
  },
  {
    id: 'transport',
    label: 'مواصلات وبنزين',
    color: '#0891b2',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    textClass: 'text-cyan-700 dark:text-cyan-400',
    barClass: 'bg-cyan-600 dark:bg-cyan-500',
  },
  {
    id: 'health',
    label: 'صحة وصيدلية',
    color: '#e11d48',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-400',
    barClass: 'bg-rose-600 dark:bg-rose-500',
  },
  {
    id: 'shopping',
    label: 'تسوق وملابس',
    color: '#7c3aed',
    bgClass: 'bg-violet-50 dark:bg-violet-950/40',
    textClass: 'text-violet-700 dark:text-violet-400',
    barClass: 'bg-violet-600 dark:bg-violet-500',
  },
  {
    id: 'family',
    label: 'أسرة وتعليم',
    color: '#0d9488',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    textClass: 'text-teal-700 dark:text-teal-400',
    barClass: 'bg-teal-600 dark:bg-teal-500',
  },
  {
    id: 'entertainment',
    label: 'ترفيه وخروجات',
    color: '#ea580c',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    textClass: 'text-orange-700 dark:text-orange-400',
    barClass: 'bg-orange-600 dark:bg-orange-500',
  },
  {
    id: 'other',
    label: 'مصروفات أخرى',
    color: '#64748b',
    bgClass: 'bg-slate-100 dark:bg-slate-800/70',
    textClass: 'text-slate-700 dark:text-slate-300',
    barClass: 'bg-slate-500 dark:bg-slate-400',
  },
];

export const INCOME_SOURCES = [
  'الراتب الأساسي',
  'دخل الزوجة',
  'عمل إضافي / فريلانس',
  'مكافأة / حافز',
  'عائد استثمار / إيجار',
  'مصدر دخل آخر',
];

export const SAVING_GOALS = [
  'صندوق الطوارئ',
  'توفير المنزل',
  'التزامات / أقساط مستقبلية',
  'سفر وإجازة',
  'استثمار / ذهب',
  'هدف خاص',
];

export const CURRENCY_OPTIONS = [
  { value: 'ج.م', label: 'جنيه مصري (ج.م)' },
  { value: 'ر.س', label: 'ريال سعودي (ر.س)' },
  { value: 'د.إ', label: 'درهم إماراتي (د.إ)' },
  { value: '$', label: 'دولار أمريكي ($)' },
  { value: '€', label: 'يورو (€)' },
];

export function getCategoryMeta(category: ExpenseCategory): CategoryMeta {
  return EXPENSE_CATEGORIES.find((c) => c.id === category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

export function getCurrentDateISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthISO(): string {
  return getCurrentDateISO().slice(0, 7);
}

export function shiftMonth(monthISO: string, delta: number): string {
  const [yStr, mStr] = monthISO.split('-');
  const year = Number(yStr);
  const month = Number(mStr) - 1;
  const date = new Date(year, month + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export function formatMonthArabic(monthISO: string): string {
  const [yStr, mStr] = monthISO.split('-');
  const mIdx = Number(mStr) - 1;
  if (mIdx < 0 || mIdx > 11 || !yStr) return monthISO;
  return `${ARABIC_MONTHS[mIdx]} ${yStr}`;
}

export function formatAmount(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function getMemberDisplayName(email?: string | null): string {
  if (!email) return 'غير محدد';
  const norm = email.trim().toLowerCase();
  if (norm === 'mr.mohamed.hesham93@gmail.com') return 'محمد هشام';
  if (norm === 'mohammedhesham872@gmail.com') return 'حساب المنزل';
  return email;
}
