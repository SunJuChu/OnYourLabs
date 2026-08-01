import React, { useState } from 'react';
import { CalculationResult, CalculationInput } from '../types';
import {
  BookmarkPlus,
  Copy,
  Printer,
  FileSpreadsheet,
  Share2,
  RotateCcw,
  Check,
  TrendingUp,
  Sparkles,
  FileText,
} from 'lucide-react';

interface ResultPanelProps {
  result: CalculationResult;
  input: CalculationInput;
  onSaveResult: () => void;
  onReset: () => void;
  onOpenPrintReport: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  input,
  onSaveResult,
  onReset,
  onOpenPrintReport,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  // Copy result text to clipboard
  const handleCopy = () => {
    const text = `[실손보험 환급금 계산 결과]
• 가입 세대: ${result.generationName}
• 병원 유형: ${result.hospitalLevelName}
• 총 발생 진료비: ${result.totalMedicalExpense.toLocaleString()}원
• 총 자기부담금(공제액): ${result.deductionDetail.totalDeductible.toLocaleString()}원
• 예상 환급금(보험금): ${result.reimbursementAmount.toLocaleString()}원 (환급률 ${result.coveragePercentage}%)

계산기 URL: ${window.location.href}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export to CSV file
  const handleExportCSV = () => {
    const rows = [
      ['항목', '금액(원)', '비고'],
      ['총 발생 진료비', result.totalMedicalExpense, '전체 병원비'],
      ['급여 본인부담금', input.expenses.coveredSelfPaid, ''],
      ['일반 비급여', input.expenses.uncoveredExpense, ''],
      ['3대 특약 비급여', input.expenses.specialManualTherapy + input.expenses.specialInjection + input.expenses.specialMri, ''],
      ['처방 약제비', input.expenses.pharmacyExpense, ''],
      ['급여 공제액', result.deductionDetail.coveredDeductible, '차감'],
      ['비급여 공제액', result.deductionDetail.uncoveredDeductible, '차감'],
      ['3대 특약 공제액', result.deductionDetail.specialDeductible, '차감'],
      ['한도 초과 차감', result.deductionDetail.exceededLimitDeduction, '차감'],
      ['최종 예상 환급금', result.reimbursementAmount, `보장 비율 ${result.coveragePercentage}%`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `실손보험_환급금_계산결과_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = () => {
    onSaveResult();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '실손보험 환급금 계산기',
        text: `내 실손보험 예상 환급금은 ${result.reimbursementAmount.toLocaleString()}원입니다.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-md p-5 space-y-5 transition-colors sticky top-20">
      {/* Header: Title & Save */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            📊
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            계산 결과
          </h2>
        </div>

        <button
          onClick={handleSave}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300'
          }`}
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
          <span>{saved ? '저장됨' : '결과 저장'}</span>
        </button>
      </div>

      {/* Section 1: Financial Summary Box */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          금액 요약
        </div>

        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex justify-between items-center">
            <span>총 발생 진료비</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {result.totalMedicalExpense.toLocaleString()} 원
            </span>
          </div>

          <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
            <span>공제금액 (자기부담금)</span>
            <span className="font-semibold">
              -{result.deductionDetail.totalDeductible.toLocaleString()} 원
            </span>
          </div>
        </div>

        {/* Highlighted Primary Box matching reference image */}
        <div className="mt-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-800 dark:text-blue-200 flex items-center gap-1">
              <span>예상 환급금 (보험금)</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-300 mt-0.5">
              보장 비율 <span className="font-bold">{result.coveragePercentage}%</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {result.reimbursementAmount.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 ml-1">원</span>
          </div>
        </div>
      </div>

      {/* Section 2: Detailed Deductions Breakdown */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          세부 공제 내역
        </div>

        {result.breakdownSummary.length > 0 ? (
          <div className="space-y-2 text-xs">
            {result.breakdownSummary.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
              >
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {item.label}
                  </div>
                  {item.description && (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {item.description}
                    </div>
                  )}
                </div>
                <div className="font-bold text-gray-900 dark:text-gray-100">
                  {item.amount.toLocaleString()} 원
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 py-2 text-center">
            공제 내역이 없습니다.
          </div>
        )}
      </div>

      {/* Section 3: Recommendation Box matching image */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 text-xs leading-relaxed text-amber-900 dark:text-amber-200 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>환급금 가이드</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
          {result.notes.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      </div>

      {/* Section 4: Export Buttons matching reference image */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          결과 내보내기
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 복사하기 */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center space-x-1 p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            <span>{copied ? '복사됨' : '복사하기'}</span>
          </button>

          {/* PDF/인쇄 저장 */}
          <button
            type="button"
            onClick={onOpenPrintReport}
            className="flex items-center justify-center space-x-1 p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[11px] font-semibold text-rose-600 dark:text-rose-400 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF 저장</span>
          </button>

          {/* 엑셀 저장 */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-1 p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>엑셀 저장</span>
          </button>

          {/* 보고서 보기 */}
          <button
            type="button"
            onClick={onOpenPrintReport}
            className="flex items-center justify-center space-x-1 p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[11px] font-semibold text-purple-600 dark:text-purple-400 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>보고서 보기</span>
          </button>
        </div>
      </div>

      {/* Section 5: Share & Reset */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>{shared ? '링크 복사 완료' : '결과 공유하기'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="py-2.5 px-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs flex items-center justify-center space-x-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>다시 계산</span>
          </button>
        </div>
      </div>
    </div>
  );
};
