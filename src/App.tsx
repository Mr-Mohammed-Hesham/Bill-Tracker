import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  Settings,
  Sun,
  Moon,
  LogOut,
  Plus,
} from 'lucide-react';
import {
  createExpense,
  createIncome,
  createSaving,
  deleteExpense,
  deleteIncome,
  deleteSaving,
  isAllowedEmail,
  saveHouseholdSettings,
  signOutUser,
  subscribeToAuth,
  subscribeToHouseholdData,
  toggleExpenseStatus,
  updateExpense,
  updateIncome,
  updateSaving,
  type ExpenseInput,
  type IncomeInput,
  type SavingInput,
} from './services/firebase';
import {
  DEFAULT_HOUSEHOLD_SETTINGS,
  getCurrentMonthISO,
  getMemberDisplayName,
  type ExpenseEntry,
  type HouseholdSettings,
  type IncomeEntry,
  type SavingEntry,
} from './types/finance';
import { AppLoader } from './components/AppLoader';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { SavingsView } from './components/SavingsView';
import {
  ExpenseModal,
  IncomeModal,
  SavingModal,
  SettingsModal,
} from './components/EntryModals';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import logoImg from './assets/logo.jpg';

type TabMode = 'dashboard' | 'expenses' | 'incomes' | 'savings';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6"
          dir="rtl"
        >
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-lg">
            <h1 className="text-lg font-bold mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function BillsTrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [savings, setSavings] = useState<SavingEntry[]>([]);
  const [settings, setSettings] = useState<HouseholdSettings>(DEFAULT_HOUSEHOLD_SETTINGS);
  const [dataLoading, setDataLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabMode>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthISO());
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);

  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);

  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<SavingEntry | null>(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    intent: 'danger' | 'logout';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'تأكيد',
    cancelLabel: 'إلغاء',
    intent: 'danger',
    onConfirm: async () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bills_tracker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bills_tracker_theme', 'light');
    }
  };

  // Auth listener
  useEffect(() => {
    const unsub = subscribeToAuth((authUser) => {
      setUser(authUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Firestore real-time subscription ONLY when user is authorized
  useEffect(() => {
    if (!authReady || !user || !isAllowedEmail(user.email)) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const unsub = subscribeToHouseholdData(
      (partial) => {
        if (partial.incomes !== undefined) setIncomes(partial.incomes);
        if (partial.expenses !== undefined) setExpenses(partial.expenses);
        if (partial.savings !== undefined) setSavings(partial.savings);
        if (partial.settings !== undefined) setSettings(partial.settings);
        setDataLoading(false);
      },
      (err) => {
        setDataLoading(false);
        addToast('تعذر المزامنة مع السحابة: تحقق من الصلاحيات أو الاتصال', 'error');
        console.error(err);
      }
    );

    return () => unsub();
  }, [authReady, user, addToast]);

  // Handlers
  const handleSaveExpense = async (input: ExpenseInput, editingId?: string) => {
    if (editingId) {
      await updateExpense(editingId, input);
      addToast('تم تحديث المصروف بنجاح', 'success');
    } else {
      await createExpense(input);
      addToast('تم تسجيل المصروف بنجاح', 'success');
    }
  };

  const handleToggleExpenseStatus = async (entry: ExpenseEntry) => {
    try {
      await toggleExpenseStatus(entry.id, entry.status);
      addToast(
        entry.status === 'pending' ? 'تم تحديد الفاتورة كمدفوعة' : 'تم تحويل الحالة إلى مستحقة',
        'success'
      );
    } catch {
      addToast('تعذر تحديث حالة الفاتورة', 'error');
    }
  };

  const handleDeleteExpense = (entry: ExpenseEntry) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف المصروف',
      message: `هل أنت متأكد من حذف "${entry.title}" نهائياً من السجل السحابي؟`,
      confirmLabel: 'تأكيد الحذف',
      cancelLabel: 'إلغاء',
      intent: 'danger',
      onConfirm: async () => {
        await deleteExpense(entry.id);
        addToast('تم حذف المصروف', 'info');
      },
    });
  };

  const handleSaveIncome = async (input: IncomeInput, editingId?: string) => {
    if (editingId) {
      await updateIncome(editingId, input);
      addToast('تم تحديث مصدر الدخل بنجاح', 'success');
    } else {
      await createIncome(input);
      addToast('تمت إضافة مصدر الدخل بنجاح', 'success');
    }
  };

  const handleDeleteIncome = (entry: IncomeEntry) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف مصدر الدخل',
      message: `هل أنت متأكد من حذف "${entry.title}" من سجل الدخل؟`,
      confirmLabel: 'تأكيد الحذف',
      cancelLabel: 'إلغاء',
      intent: 'danger',
      onConfirm: async () => {
        await deleteIncome(entry.id);
        addToast('تم حذف مصدر الدخل', 'info');
      },
    });
  };

  const handleSaveSaving = async (input: SavingInput, editingId?: string) => {
    if (editingId) {
      await updateSaving(editingId, input);
      addToast('تم تحديث حركة التوفير', 'success');
    } else {
      await createSaving(input);
      addToast('تم تسجيل حركة التوفير بنجاح', 'success');
    }
  };

  const handleDeleteSaving = (entry: SavingEntry) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف حركة التوفير',
      message: `هل أنت متأكد من حذف "${entry.title}" من سجل التوفير؟`,
      confirmLabel: 'تأكيد الحذف',
      cancelLabel: 'إلغاء',
      intent: 'danger',
      onConfirm: async () => {
        await deleteSaving(entry.id);
        addToast('تم حذف حركة التوفير', 'info');
      },
    });
  };

  const handleSaveSettings = async (newSettings: HouseholdSettings) => {
    await saveHouseholdSettings(newSettings);
    addToast('تم حفظ إعدادات الميزانية', 'success');
  };

  const requestSignOut = () => {
    setConfirmState({
      isOpen: true,
      title: 'تأكيد تسجيل الخروج',
      message: 'هل أنت متأكد من رغبتك في تسجيل الخروج من تطبيق Bills Tracker؟',
      confirmLabel: 'تسجيل الخروج',
      cancelLabel: 'البقاء في التطبيق',
      intent: 'logout',
      onConfirm: async () => {
        await signOutUser();
        addToast('تم تسجيل الخروج بنجاح', 'info');
      },
    });
  };

  const handleConfirmAction = async () => {
    setConfirmLoading(true);
    try {
      await confirmState.onConfirm();
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    } catch {
      addToast('تعذر إتمام العملية', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  if (!authReady) {
    return <AppLoader message="جاري التحقق من الجلسة السحابية..." />;
  }

  if (!user || !isAllowedEmail(user.email)) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <LoginPage currentUser={user} onAuthorizedLogin={setUser} onFeedback={addToast} />
        <PWAInstallButton variant="floating" onFeedback={addToast} />
      </>
    );
  }

  if (dataLoading) {
    return <AppLoader message="جاري مزامنة المصروفات والمدخرات..." />;
  }

  const navItems: Array<{
    id: TabMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeColor: string;
  }> = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: LayoutDashboard,
      activeColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'expenses',
      label: 'المصروفات',
      icon: Receipt,
      activeColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'incomes',
      label: 'الدخل',
      icon: Wallet,
      activeColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      id: 'savings',
      label: 'التوفير',
      icon: PiggyBank,
      activeColor: 'text-sky-600 dark:text-sky-400',
    },
  ];

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row overflow-x-hidden"
      dir="rtl"
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <OfflineIndicator />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen p-5 justify-between">
        <div className="space-y-7">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Bills Tracker"
              className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/70 shrink-0 shadow-sm"
            />
            <div className="min-w-0">
              <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                Bills Tracker
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                {settings.householdName}
              </div>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="التنقل الرئيسي">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <span>إعدادات الميزانية والعملة</span>
          </button>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {getMemberDisplayName(user.email)}
              </p>
              <p className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400 truncate" dir="ltr">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={requestSignOut}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-10">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand / Section title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={logoImg}
              alt="Bills Tracker"
              className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/70 lg:hidden shrink-0"
            />
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate">
              <span className="lg:hidden">Bills Tracker</span>
              <span className="hidden lg:inline">
                {activeTab === 'dashboard'
                  ? 'نظرة عامة على الميزانية'
                  : activeTab === 'expenses'
                    ? 'سجل المصروفات والفواتير'
                    : activeTab === 'incomes'
                      ? 'مصادر الدخل الشهري'
                      : 'التوفير والأهداف'}
              </span>
            </span>
          </div>

          {/* Zone 2: Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton variant="header" onFeedback={addToast} />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              title="تبديل الوضع الليلي / النهاري"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              aria-label="إعدادات الميزانية"
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={requestSignOut}
              aria-label="تسجيل الخروج"
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-500 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              className="hidden sm:flex min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>مصروف سريع</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 py-5 sm:py-6">
          {activeTab === 'dashboard' ? (
            <DashboardView
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              incomes={incomes}
              expenses={expenses}
              savings={savings}
              settings={settings}
              onOpenExpenseModal={(entry) => {
                setEditingExpense(entry || null);
                setExpenseModalOpen(true);
              }}
              onOpenIncomeModal={(entry) => {
                setEditingIncome(entry || null);
                setIncomeModalOpen(true);
              }}
              onOpenSavingModal={(entry) => {
                setEditingSaving(entry || null);
                setSavingModalOpen(true);
              }}
              onToggleExpenseStatus={handleToggleExpenseStatus}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'expenses' || activeTab === 'incomes' ? (
            <TransactionsView
              mode={activeTab}
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              expenses={expenses}
              incomes={incomes}
              settings={settings}
              onAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onEditExpense={(entry) => {
                setEditingExpense(entry);
                setExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onToggleExpenseStatus={handleToggleExpenseStatus}
              onAddIncome={() => {
                setEditingIncome(null);
                setIncomeModalOpen(true);
              }}
              onEditIncome={(entry) => {
                setEditingIncome(entry);
                setIncomeModalOpen(true);
              }}
              onDeleteIncome={handleDeleteIncome}
            />
          ) : (
            <SavingsView
              selectedMonth={selectedMonth}
              savings={savings}
              settings={settings}
              onAddSaving={() => {
                setEditingSaving(null);
                setSavingModalOpen(true);
              }}
              onEditSaving={(entry) => {
                setEditingSaving(entry);
                setSavingModalOpen(true);
              }}
              onDeleteSaving={handleDeleteSaving}
            />
          )}
        </main>
      </div>

      {/* Floating Quick Install Button */}
      <PWAInstallButton variant="floating" onFeedback={addToast} />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="التنقل السفلي"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-4 h-16 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
                  isActive ? item.activeColor : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        editingEntry={editingExpense}
        defaultMonth={selectedMonth}
        currency={settings.currency}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
      />

      <IncomeModal
        isOpen={incomeModalOpen}
        editingEntry={editingIncome}
        defaultMonth={selectedMonth}
        currency={settings.currency}
        onClose={() => {
          setIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
      />

      <SavingModal
        isOpen={savingModalOpen}
        editingEntry={editingSaving}
        defaultMonth={selectedMonth}
        currency={settings.currency}
        onClose={() => {
          setSavingModalOpen(false);
          setEditingSaving(null);
        }}
        onSave={handleSaveSaving}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        settings={settings}
        onClose={() => setSettingsModalOpen(false)}
        onSave={handleSaveSettings}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        intent={confirmState.intent}
        loading={confirmLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BillsTrackerApp />
    </ErrorBoundary>
  );
}
