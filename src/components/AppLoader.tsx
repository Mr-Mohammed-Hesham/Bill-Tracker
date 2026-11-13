import React from 'react';
import { Cloud, Sparkles } from 'lucide-react';

interface AppLoaderProps {
  message?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  message = 'جاري مزامنة الميزانية وقاعدة البيانات...',
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden"
      dir="rtl"
    >
      {/* Ambient optimistic glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] bg-gradient-to-tr from-emerald-500/20 via-teal-400/15 to-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Glowing Logo Frame */}
        <div className="relative mb-6">
          <div
            className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-amber-400 opacity-75 blur-md animate-spin"
            style={{ animationDuration: '6s' }}
          />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-400 shadow-2xl shadow-emerald-500/25 overflow-hidden">
            <img
              src="/logo.jpg"
              alt="Bills Tracker"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-950">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">
          Bills Tracker
        </h1>
        <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-6">
          رفيقك الذكي لإدارة مصروفات ومدخرات المنزل
        </p>

        {/* Dynamic Shimmer Progress Bar */}
        <div className="w-52 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3 relative">
          <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full animate-shimmer" />
        </div>

        {/* Live Sync Text */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Cloud className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};
