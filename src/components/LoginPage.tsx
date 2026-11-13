import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { ShieldCheck, AlertTriangle, LogOut, Sparkles, RefreshCw } from 'lucide-react';
import {
  isAllowedEmail,
  signInWithGoogle,
  signOutUser,
} from '../services/firebase';
import { PWAInstallButton } from './PWAInstallButton';
import logoImg from '../assets/logo.jpg';

interface LoginPageProps {
  currentUser: User | null;
  onAuthorizedLogin: (user: User | null) => void;
  onFeedback?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onAuthorizedLogin,
  onFeedback,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentUser && !isAllowedEmail(currentUser.email)) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4"
        dir="rtl"
      >
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 p-7 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">حساب غير مصرح له بالدخول</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            هذا الحساب غير مدرج ضمن الحسابات المصرح لها بالوصول إلى بيانات التطبيق. يرجى تسجيل الدخول بحساب معتمد.
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              onAuthorizedLogin(null);
            }}
            className="w-full min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج والتبديل لحساب آخر</span>
          </button>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (isAllowedEmail(user.email)) {
        onAuthorizedLogin(user);
      } else {
        await signOutUser();
        setError('عذراً، هذا الحساب غير مصرح له بالدخول. يرجى المحاولة باستخدام الحساب المعتمد.');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError(null);
      } else if (code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة من المتصفح. يرجى السماح بالنوافذ المنبثقة والمحاولة مجدداً.');
      } else {
        setError('تعذر إتمام تسجيل الدخول عبر Google. تأكد من الاتصال بالإنترنت وحاول مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      {/* Optimistic ambient glow */}
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-amber-400/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-7 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative inline-block mb-4">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 rounded-full blur-md opacity-60 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-400 shadow-xl overflow-hidden">
                <img
                  src={logoImg}
                  alt="شعار Bills Tracker"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow border-2 border-white dark:border-slate-900">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Bills Tracker
            </h1>
            <p className="mt-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              إدارة المصروفات اليومية والدخل الشهري والتوفير
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 text-xs text-rose-700 dark:text-rose-300 leading-relaxed flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full min-h-[50px] px-5 py-3.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60 shadow-lg shadow-emerald-600/20 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <>
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.31 0 3.25 2.69 1.25 6.64l3.68 2.84C5.8 6.84 8.65 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-1.99 3.72-4.93 3.72-8.69z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M4.93 14.52A7.19 7.19 0 0 1 4.55 12c0-.88.15-1.73.38-2.52L1.25 6.64A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.25 5.36l3.68-2.84z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.23 1.16-3.35 0-6.2-1.84-7.07-4.86l-3.68 2.84C3.25 21.31 7.31 24 12 24z"
                    />
                  </svg>
                </span>
                <span>تسجيل الدخول بحساب Google</span>
              </>
            )}
          </button>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>مزامنة سحابية آمنة ومشفرة</span>
            </div>
            <PWAInstallButton variant="header" onFeedback={onFeedback} />
          </div>
        </div>
      </div>
    </div>
  );
};
