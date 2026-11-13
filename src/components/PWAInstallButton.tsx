import React from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'floating';
  onFeedback?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onFeedback,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        onFeedback?.('تم تثبيت Bills Tracker بنجاح على جهازك', 'success');
      }
      return;
    }

    if (isIOS) {
      onFeedback?.(
        'للتثبيت على iPhone: اضغط زر المشاركة في Safari ثم اختر "إضافة إلى الشاشة الرئيسية"',
        'info'
      );
      return;
    }

    onFeedback?.(
      'جاري تحضير التثبيت المباشر... إذا لم يظهر تلقائياً اختر "تثبيت التطبيق" من قائمة المتصفح',
      'info'
    );
  };

  if (variant === 'floating') {
    return (
      <button
        id="btn-floating-install-pwa"
        type="button"
        onClick={handleClick}
        aria-label="تثبيت التطبيق مباشرة"
        title="تثبيت Bills Tracker مباشرة على الهاتف أو سطح المكتب"
        className="fixed bottom-20 left-4 lg:bottom-6 lg:left-6 z-40 w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-white/25"
      >
        <Download className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      id="btn-install-pwa-header"
      type="button"
      onClick={handleClick}
      title="تثبيت التطبيق مباشرة على الجهاز"
      className="min-h-[40px] px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
    >
      <Download className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline">تثبيت التطبيق</span>
    </button>
  );
};
