import React, { useState } from 'react';
import { GENERATION_INFOS } from '../data/insuranceRules';
import { InsuranceGeneration } from '../types';
import { X, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface GenerationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGeneration?: (gen: InsuranceGeneration) => void;
}

export const GenerationGuideModal: React.FC<GenerationGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectGeneration,
}) => {
  const [activeTab, setActiveTab] = useState<InsuranceGeneration>('4gen');

  if (!isOpen) return null;

  const currentInfo = GENERATION_INFOS[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                실손보험 1세대~5세대 완벽 비교 가이드
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                가입 시기별 보장 비율 및 공제액 개정 내용 한눈에 보기
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-900/40 p-2 gap-1 overflow-x-auto">
          {(['1gen', '2gen', '3gen', '4gen', '5gen'] as InsuranceGeneration[]).map((gen) => (
            <button
              key={gen}
              onClick={() => setActiveTab(gen)}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition text-center whitespace-nowrap ${
                activeTab === gen
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {GENERATION_INFOS[gen].title.split(' ')[0]} ({GENERATION_INFOS[gen].period.split(' ')[0]})
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Generation Hero Card */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {currentInfo.title} <span className="text-sm font-medium text-blue-700 dark:text-blue-300">({currentInfo.subtitle})</span>
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-0.5">
                  가입 기간: {currentInfo.period}
                </p>
              </div>
              {onSelectGeneration && (
                <button
                  onClick={() => {
                    onSelectGeneration(activeTab);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                >
                  이 세대로 계산하기
                </button>
              )}
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              {currentInfo.description}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-blue-200/60 dark:border-blue-800/60 text-xs">
              <div className="bg-white/80 dark:bg-gray-900/60 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900">
                <span className="text-gray-500 text-[10px]">급여 보장 비율</span>
                <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">{currentInfo.coveredRate}</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-900/60 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900">
                <span className="text-gray-500 text-[10px]">비급여 보장 비율</span>
                <div className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">{currentInfo.uncoveredRate}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/80 dark:bg-gray-900/60 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900">
                <span className="text-gray-500 text-[10px]">통원 최소 공제액</span>
                <div className="font-bold text-gray-900 dark:text-white text-xs">{currentInfo.minDeductibleText}</div>
              </div>
            </div>
          </div>

          {/* Key Features List */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>주요 약관 특징</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentInfo.keyFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300"
                >
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2.5">
              전체 세대 한눈에 비교표
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold">
                  <tr>
                    <th className="p-3 border-b dark:border-gray-700">세대</th>
                    <th className="p-3 border-b dark:border-gray-700">가입기간</th>
                    <th className="p-3 border-b dark:border-gray-700">급여 보장</th>
                    <th className="p-3 border-b dark:border-gray-700">비급여 보장</th>
                    <th className="p-3 border-b dark:border-gray-700">3대 특약</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  <tr className={activeTab === '1gen' ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''}>
                    <td className="p-3">1세대 (구실손)</td>
                    <td className="p-3">~ 2009.09</td>
                    <td className="p-3 text-blue-600 font-bold">100%</td>
                    <td className="p-3 text-blue-600 font-bold">100%</td>
                    <td className="p-3">일반 비급여와 동일 (100%)</td>
                  </tr>
                  <tr className={activeTab === '2gen' ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''}>
                    <td className="p-3">2세대 (표준화)</td>
                    <td className="p-3">2009.10 ~ 2017.03</td>
                    <td className="p-3">80~90%</td>
                    <td className="p-3">80~90%</td>
                    <td className="p-3">일반 비급여와 동일</td>
                  </tr>
                  <tr className={activeTab === '3gen' ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''}>
                    <td className="p-3">3세대 (착한실손)</td>
                    <td className="p-3">2017.04 ~ 2021.06</td>
                    <td className="p-3">80~90%</td>
                    <td className="p-3">80%</td>
                    <td className="p-3 text-amber-600 font-bold">70% (30% 공제 / 2만원)</td>
                  </tr>
                  <tr className={activeTab === '4gen' ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''}>
                    <td className="p-3">4세대 (개편실손)</td>
                    <td className="p-3">2021.07 ~ 2024</td>
                    <td className="p-3">80%</td>
                    <td className="p-3">70%</td>
                    <td className="p-3 text-amber-600 font-bold">70% (30% 공제 / 3만원)</td>
                  </tr>
                  <tr className={activeTab === '5gen' ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''}>
                    <td className="p-3">5세대 (최신개정)</td>
                    <td className="p-3">2025 ~ 현재</td>
                    <td className="p-3">70~80%</td>
                    <td className="p-3">50~70%</td>
                    <td className="p-3 text-rose-600 font-bold">60% (40% 공제 / 4만원)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
