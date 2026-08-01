import React from 'react';
import { CalculationLimits } from '../types';
import { Calculator, RotateCcw, Sliders, ShieldAlert } from 'lucide-react';

interface LimitsAndOptionsProps {
  limits: CalculationLimits;
  onChangeLimit: (field: keyof CalculationLimits, value: number) => void;
  onCalculate: () => void;
  onReset: () => void;
}

export const LimitsAndOptions: React.FC<LimitsAndOptionsProps> = ({
  limits,
  onChangeLimit,
  onCalculate,
  onReset,
}) => {
  return (
    <div className="space-y-4">
      {/* Step 4: Limits & Options */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-sm transition-colors">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            4
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>보장 한도 및 추가 설정</span>
            <Sliders className="w-4 h-4 text-gray-400" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 통원 1회당 보장 한도 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              외래(통원) 1회당 보장 한도
            </label>
            <div className="flex gap-2">
              <select
                value={limits.outpatientLimitPerVisit}
                onChange={(e) => onChangeLimit('outpatientLimitPerVisit', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={200000}>20만원 (일반적인 3~4세대 한도)</option>
                <option value={250000}>25만원 (일반적인 1~2세대 한도)</option>
                <option value={300000}>30만원 (최대한도)</option>
                <option value={100000}>10만원 (소액 한도)</option>
                <option value={500000}>50만원 (특약 한도)</option>
              </select>
            </div>
          </div>

          {/* 처방약 1회당 보장 한도 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              처방 약제 1회당 보장 한도
            </label>
            <div className="flex gap-2">
              <select
                value={limits.pharmacyLimitPerVisit}
                onChange={(e) => onChangeLimit('pharmacyLimitPerVisit', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={50000}>5만원 (표준 한도)</option>
                <option value={100000}>10만원 (확장 한도)</option>
                <option value={30000}>3만원</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>보장 한도를 초과하는 진료비는 자기부담금과 별도로 지급액에서 차감 계산됩니다.</span>
        </div>
      </div>

      {/* Step 5: Action Buttons (Calculated & Reset) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onCalculate}
          className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <Calculator className="w-5 h-5" />
          <span>환급금 계산하기</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="py-3.5 px-5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span>초기화</span>
        </button>
      </div>
    </div>
  );
};
