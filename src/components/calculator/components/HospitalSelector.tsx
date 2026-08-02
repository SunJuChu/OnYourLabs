import React from 'react';
import { MedicalType, HospitalLevel, InsuranceGeneration, CalculationInput } from '../types';
import { HOSPITAL_LEVEL_INFOS } from '../data/insuranceRules';
import { Stethoscope, Building2, Building, Pill, UserCheck, AlertCircle } from 'lucide-react';

type CustomOptions = NonNullable<CalculationInput['customOptions']>;

interface HospitalSelectorProps {
  medicalType: MedicalType;
  hospitalLevel: HospitalLevel;
  generation: InsuranceGeneration;
  customOptions?: CustomOptions;
  onSelectMedicalType: (type: MedicalType) => void;
  onSelectHospitalLevel: (level: HospitalLevel) => void;
  onChangeCustomOption?: <K extends keyof CustomOptions>(field: K, value: CustomOptions[K]) => void;
}

export const HospitalSelector: React.FC<HospitalSelectorProps> = ({
  medicalType,
  hospitalLevel,
  generation,
  customOptions,
  onSelectMedicalType,
  onSelectHospitalLevel,
  onChangeCustomOption,
}) => {
  const hospitalTypes: HospitalLevel[] = ['clinic', 'hospital', 'tertiary'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-sm transition-colors">
      {/* Step Header */}
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
          2
        </div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          진료 구분 및 병원 유형
        </h2>
      </div>

      {/* 1. Medical Service Type Tabs */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
          진료 구분 선택
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSelectMedicalType('outpatient')}
            className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
              medicalType === 'outpatient'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>외래 (통원)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMedicalType('inpatient')}
            className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
              medicalType === 'inpatient'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>입원 치료</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMedicalType('pharmacy')}
            className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
              medicalType === 'pharmacy'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>처방 약제비</span>
          </button>
        </div>
      </div>

      {/* 2. Hospital Level Picker (Only if outpatient or inpatient) */}
      {medicalType !== 'pharmacy' ? (
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            병원 유형 선택 (최소 공제액 차등 적용)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {hospitalTypes.map((level) => {
              const info = HOSPITAL_LEVEL_INFOS[level];
              const minDeductible = info.minDeductibles[generation];
              const isSelected = hospitalLevel === level;

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onSelectHospitalLevel(level)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {level === 'clinic' && <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    {level === 'hospital' && <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    {level === 'tertiary' && <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                      {info.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                    {info.subtext}
                  </p>
                  <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/50 px-2 py-0.5 rounded w-fit">
                    최소 공제 {minDeductible.toLocaleString()}원
                  </div>
                </button>
              );
            })}
          </div>

          {/* 5세대 전용: '병원/종합병원' 선택 시 실제 등급 세분화 (option c) */}
          {generation === '5gen' && hospitalLevel === 'hospital' && (
            <div className="mt-3 p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl">
              <div className="flex items-start gap-1.5 mb-2 text-[11px] text-purple-700 dark:text-purple-300">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>5세대는 "종합병원 이상"과 "의원/일반병원"의 최소공제액(1만원/2만원) 및 비중증 비급여 입원 300만원 한도 적용 여부가 다릅니다. 실제 방문 기관 등급을 선택해주세요.</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeCustomOption?.('isGeneralHospitalOrAbove', false)}
                  className={`p-2 rounded-lg border text-[11px] font-semibold transition ${
                    !customOptions?.isGeneralHospitalOrAbove
                      ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  일반병원 (최소 1만원)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCustomOption?.('isGeneralHospitalOrAbove', true)}
                  className={`p-2 rounded-lg border text-[11px] font-semibold transition ${
                    customOptions?.isGeneralHospitalOrAbove
                      ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  종합병원 이상 (최소 2만원, 입원 300만원 한도 면제)
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
          * 처방 약제비는 병원급 구분 없이 1회당 정액 공제(1~3세대 5천~8천원, 4~5세대 8천~1만원)가 적용됩니다.
        </div>
      )}
    </div>
  );
};
