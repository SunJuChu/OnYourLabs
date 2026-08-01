import React, { useState } from 'react';
import { ExpenseBreakdown, MedicalType, InsuranceGeneration } from '../types';
import { ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';

interface ExpenseInputFormProps {
  expenses: ExpenseBreakdown;
  medicalType: MedicalType;
  generation: InsuranceGeneration;
  onChangeExpense: (field: keyof ExpenseBreakdown, value: number) => void;
}

export const ExpenseInputForm: React.FC<ExpenseInputFormProps> = ({
  expenses,
  medicalType,
  generation,
  onChangeExpense,
}) => {
  const [showSpecialDetails, setShowSpecialDetails] = useState(
    expenses.specialManualTherapy > 0 || expenses.specialInjection > 0 || expenses.specialMri > 0
  );

  const formatNumber = (num: number) => (num === 0 ? '' : num.toLocaleString('ko-KR'));

  const handleInputChange = (field: keyof ExpenseBreakdown, rawValue: string) => {
    const numeric = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    onChangeExpense(field, numeric);
  };

  const addPreset = (field: keyof ExpenseBreakdown, amount: number) => {
    onChangeExpense(field, (expenses[field] || 0) + amount);
  };

  const totalSpecial = expenses.specialManualTherapy + expenses.specialInjection + expenses.specialMri;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-sm transition-colors">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            3
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            진료비 상세 입력
          </h2>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          영수증 항목 참고 (원 단위)
        </span>
      </div>

      <div className="space-y-4">
        {/* 1. 급여 본인부담금 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              급여 본인부담금
            </label>
            <div className="flex gap-1">
              {[50000, 100000, 300000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addPreset('coveredSelfPaid', amt)}
                  className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded font-medium transition"
                >
                  +{(amt / 10000).toLocaleString()}만
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={formatNumber(expenses.coveredSelfPaid)}
              onChange={(e) => handleInputChange('coveredSelfPaid', e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-right text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition outline-none pr-8"
            />
            <span className="absolute right-3 top-2.5 text-xs font-medium text-gray-400">원</span>
          </div>
        </div>

        {/* 2. 일반 비급여 비용 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              일반 비급여 의료비
            </label>
            <div className="flex gap-1">
              {[50000, 100000, 500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addPreset('uncoveredExpense', amt)}
                  className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded font-medium transition"
                >
                  +{(amt / 10000).toLocaleString()}만
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={formatNumber(expenses.uncoveredExpense)}
              onChange={(e) => handleInputChange('uncoveredExpense', e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-right text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition outline-none pr-8"
            />
            <span className="absolute right-3 top-2.5 text-xs font-medium text-gray-400">원</span>
          </div>
        </div>

        {/* 3. 3대 특약 비급여 (Accordion / Toggle) */}
        <div className="border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl p-3.5 transition">
          <button
            type="button"
            onClick={() => setShowSpecialDetails(!showSpecialDetails)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                3대 비급여 특약 항목 (도수/주사/MRI)
              </span>
              {totalSpecial > 0 && (
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                  합계 {totalSpecial.toLocaleString()}원
                </span>
              )}
            </div>
            {showSpecialDetails ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {showSpecialDetails && (
            <div className="mt-3.5 pt-3 border-t border-indigo-100 dark:border-indigo-900/50 space-y-3">
              {(generation === '3gen' || generation === '4gen' || generation === '5gen') && (
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-900/40 p-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{generation === '3gen' ? '3세대' : generation === '4gen' ? '4세대' : '5세대'} 실손은 3대 특약 항목에 대해 30%~40% 자기부담률이 적용됩니다.</span>
                </div>
              )}

              {/* 도수치료 / 체외충격파 / 증식치료 */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  도수치료 / 체외충격파 / 증식치료
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatNumber(expenses.specialManualTherapy)}
                    onChange={(e) => handleInputChange('specialManualTherapy', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-right text-xs focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-gray-400">원</span>
                </div>
              </div>

              {/* 비급여 주사료 */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  비급여 주사료 (마늘주사, 영양주사 등)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatNumber(expenses.specialInjection)}
                    onChange={(e) => handleInputChange('specialInjection', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-right text-xs focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-gray-400">원</span>
                </div>
              </div>

              {/* 비급여 MRI/MRA */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  비급여 MRI / MRA 자기공명영상 진단
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatNumber(expenses.specialMri)}
                    onChange={(e) => handleInputChange('specialMri', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-right text-xs focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-gray-400">원</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. 약제비 (If pharmacy type selected or added) */}
        {medicalType === 'pharmacy' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                처방 약제비 (약국 조제비)
              </label>
              <div className="flex gap-1">
                {[10000, 30000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => addPreset('pharmacyExpense', amt)}
                    className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded font-medium transition"
                  >
                    +{(amt / 10000).toLocaleString()}만
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formatNumber(expenses.pharmacyExpense)}
                onChange={(e) => handleInputChange('pharmacyExpense', e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-right text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition outline-none pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs font-medium text-gray-400">원</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
