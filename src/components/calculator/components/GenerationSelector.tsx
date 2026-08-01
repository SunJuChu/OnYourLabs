import React from 'react';
import { InsuranceGeneration } from '../types';
import { GENERATION_INFOS } from '../data/insuranceRules';
import { Info, CheckCircle2 } from 'lucide-react';

interface GenerationSelectorProps {
  selectedGen: InsuranceGeneration;
  onSelectGen: (gen: InsuranceGeneration) => void;
  onOpenGuide: () => void;
}

const GENERATIONS: InsuranceGeneration[] = ['1gen', '2gen', '3gen', '4gen', '5gen'];

export const GenerationSelector: React.FC<GenerationSelectorProps> = ({
  selectedGen,
  onSelectGen,
  onOpenGuide,
}) => {
  const currentInfo = GENERATION_INFOS[selectedGen];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-sm transition-colors">
      {/* Header with Step Number */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            1
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            가입 세대 선택
          </h2>
        </div>
        <button
          onClick={onOpenGuide}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
        >
          <Info className="w-3.5 h-3.5" />
          <span>세대별 상세 비교표</span>
        </button>
      </div>

      {/* Generation Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
        {GENERATIONS.map((gen) => {
          const info = GENERATION_INFOS[gen];
          const isSelected = selectedGen === gen;

          return (
            <button
              key={gen}
              type="button"
              onClick={() => onSelectGen(gen)}
              className={`relative p-3 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[92px] ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    {info.title.split(' ')[0]}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                  {info.period}
                </div>
              </div>

              <div className="mt-2">
                <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {info.badge.split(' ')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Generation Details Box */}
      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${currentInfo.color}`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-1">
            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{currentInfo.title}</span>
              <span className="text-[11px] font-normal text-gray-600 dark:text-gray-300">
                ({currentInfo.period})
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {currentInfo.description}
            </p>
            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">급여 보장율:</span> {currentInfo.coveredRate}
              </div>
              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">비급여 보장율:</span> {currentInfo.uncoveredRate}
              </div>
              <div className="sm:col-span-2">
                <span className="font-semibold text-gray-800 dark:text-gray-200">최소 공제기준:</span> {currentInfo.minDeductibleText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
