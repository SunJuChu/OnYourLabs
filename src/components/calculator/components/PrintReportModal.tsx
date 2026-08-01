import React from 'react';
import { CalculationResult, CalculationInput } from '../types';
import { X, Printer, ShieldCheck } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult;
  input: CalculationInput;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  result,
  input,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static print:block">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden print:shadow-none print:border-none print:max-h-none">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              실손보험 환급금 계산 상세 보고서
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄 / PDF 저장</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 font-sans print:p-0">
          {/* Header Title */}
          <div className="border-b-2 border-blue-600 pb-4 flex justify-between items-end">
            <div>
              <div className="text-xs font-bold text-blue-600 tracking-wider">
                ACTUAL COST INSURANCE REPORT
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                실손의료비 환급 예상금 산출 내역서
              </h1>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>발행일자: {new Date().toLocaleDateString('ko-KR')}</div>
              <div>산출자: 실손보험 환급금 계산기</div>
            </div>
          </div>

          {/* Section 1: Conditions */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-gray-500">가입 세대:</span>{' '}
              <strong className="text-blue-600">{result.generationName}</strong>
            </div>
            <div>
              <span className="text-gray-500">병원 유형:</span>{' '}
              <strong>{result.hospitalLevelName}</strong>
            </div>
            <div>
              <span className="text-gray-500">진료 구분:</span>{' '}
              <strong>
                {input.medicalType === 'outpatient' ? '외래 (통원)' : input.medicalType === 'inpatient' ? '입원 치료' : '처방 약제비'}
              </strong>
            </div>
            <div>
              <span className="text-gray-500">통원 보장 한도:</span>{' '}
              <strong>{(input.limits.outpatientLimitPerVisit / 10000).toLocaleString()}만원</strong>
            </div>
          </div>

          {/* Section 2: Financial Breakdown Table */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              1. 진료비 발생 및 공제 산출 상세
            </h3>
            <table className="w-full text-xs border-collapse border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <th className="border border-gray-200 dark:border-gray-700 p-2.5 text-left">구분</th>
                  <th className="border border-gray-200 dark:border-gray-700 p-2.5 text-right">진료비 발생액</th>
                  <th className="border border-gray-200 dark:border-gray-700 p-2.5 text-right">자기부담 공제액</th>
                  <th className="border border-gray-200 dark:border-gray-700 p-2.5 text-left">공제 적용 기준</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 font-medium">급여 본인부담금</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right">{input.expenses.coveredSelfPaid.toLocaleString()}원</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right font-semibold text-rose-600">-{result.deductionDetail.coveredDeductible.toLocaleString()}원</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-gray-500">병원급 최소 공제 vs 자기부담률</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 font-medium">일반 비급여</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right">{input.expenses.uncoveredExpense.toLocaleString()}원</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right font-semibold text-rose-600">-{result.deductionDetail.uncoveredDeductible.toLocaleString()}원</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-gray-500">비급여 자기부담률 적용</td>
                </tr>
                {(input.expenses.specialManualTherapy + input.expenses.specialInjection + input.expenses.specialMri) > 0 && (
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-700 p-2.5 font-medium">3대 비급여 특약</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right font-medium">
                      {(input.expenses.specialManualTherapy + input.expenses.specialInjection + input.expenses.specialMri).toLocaleString()}원
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right font-semibold text-rose-600">-{result.deductionDetail.specialDeductible.toLocaleString()}원</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-gray-500">특약 별도 공제율 적용</td>
                  </tr>
                )}
                {result.deductionDetail.exceededLimitDeduction > 0 && (
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-700 p-2.5 font-medium">보장한도 초과차감</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right">-</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right font-semibold text-rose-600">-{result.deductionDetail.exceededLimitDeduction.toLocaleString()}원</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-gray-500">1회당 통원 한도 초과분</td>
                  </tr>
                )}
                <tr className="bg-blue-50/50 dark:bg-blue-950/30 font-bold">
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5">합계</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right">{result.totalMedicalExpense.toLocaleString()}원</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-right text-rose-600">-{result.deductionDetail.totalDeductible.toLocaleString()}원</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2.5 text-blue-600">예상 환급액 산출완료</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Final Summary Result Box */}
          <div className="p-4 rounded-xl bg-blue-600 text-white flex justify-between items-center shadow-lg">
            <div>
              <div className="text-xs text-blue-100">최종 예상 실손 환급금 (보험금)</div>
              <div className="text-xs text-blue-200 mt-0.5">총 발생 비용 대비 보장률: {result.coveragePercentage}%</div>
            </div>
            <div className="text-2xl font-black">
              {result.reimbursementAmount.toLocaleString()} 원
            </div>
          </div>

          {/* Section 4: Notice */}
          <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800">
            <p>* 본 보고서는 표준 실손보험 약관 기준 추정치이며, 실제 수령 보험금은 개별 계약 약관 및 특약 조건, 기존 청구 이력에 따라 다를 수 있습니다.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
