import React from 'react';
import { ShieldCheck, RotateCcw, History, BookOpen, HelpCircle, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onNewCalculation: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  onOpenFaq: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewCalculation,
  onOpenHistory,
  onOpenGuide,
  onOpenFaq,
  isDarkMode,
  onToggleDarkMode,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNewCalculation}>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2">
              실손보험 환급금 계산기
              <span className="text-[10px] font-semibold tracking-wide bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                1~5세대 대응
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Actual Cost Medical Expense Insurance Calculator
            </p>
          </div>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={onNewCalculation}
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            title="새 계산 시작"
          >
            <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>새 계산</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="hidden md:inline">계산 이력</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">세대별 안내</span>
          </button>

          <button
            onClick={onOpenFaq}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">자주 묻는 질문</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="테마 전환"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
