import { useState, useEffect, useMemo } from 'react';
import {
  CalculationInput,
  InsuranceGeneration,
  MedicalType,
  HospitalLevel,
  ExpenseBreakdown,
  CalculationLimits,
  SavedCalculation,
} from './types';
import { calculateInsuranceRefund } from './utils/calculator';
import { Header } from './components/Header';
import { GenerationSelector } from './components/GenerationSelector';
import { HospitalSelector } from './components/HospitalSelector';
import { ExpenseInputForm } from './components/ExpenseInputForm';
import { LimitsAndOptions } from './components/LimitsAndOptions';
import { ResultPanel } from './components/ResultPanel';
import { GenerationGuideModal } from './components/GenerationGuideModal';
import { HistoryModal } from './components/HistoryModal';
import { FaqModal } from './components/FaqModal';
import { PrintReportModal } from './components/PrintReportModal';

const DEFAULT_EXPENSES: ExpenseBreakdown = {
  coveredSelfPaid: 50000,
  uncoveredExpense: 100000,
  specialManualTherapy: 150000,
  specialInjection: 0,
  specialMri: 0,
  pharmacyExpense: 0,
};

const DEFAULT_LIMITS: CalculationLimits = {
  outpatientLimitPerVisit: 200000,
  specialLimitPerVisit: 200000,
  pharmacyLimitPerVisit: 50000,
  manualTherapyAnnualCount: 0,
};

export default function ReimbursementCalculatorApp() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Inputs State
  const [generation, setGeneration] = useState<InsuranceGeneration>('4gen');
  const [medicalType, setMedicalType] = useState<MedicalType>('outpatient');
  const [hospitalLevel, setHospitalLevel] = useState<HospitalLevel>('clinic');
  const [expenses, setExpenses] = useState<ExpenseBreakdown>(DEFAULT_EXPENSES);
  const [limits, setLimits] = useState<CalculationLimits>(DEFAULT_LIMITS);

  // Modals State
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState<boolean>(false);

  // Saved Calculations State (localStorage)
  const [savedHistory, setSavedHistory] = useState<SavedCalculation[]>(() => {
    try {
      const stored = localStorage.getItem('silson_calc_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync localStorage
  useEffect(() => {
    try {
      localStorage.setItem('silson_calc_history', JSON.stringify(savedHistory));
    } catch (e) {
      console.error(e);
    }
  }, [savedHistory]);

  // Real-time calculation calculation
  const calculationInput: CalculationInput = useMemo(
    () => ({
      generation,
      medicalType,
      hospitalLevel,
      expenses,
      limits,
    }),
    [generation, medicalType, hospitalLevel, expenses, limits]
  );

  const calculationResult = useMemo(() => {
    return calculateInsuranceRefund(calculationInput);
  }, [calculationInput]);

  // Handlers
  const handleExpenseChange = (field: keyof ExpenseBreakdown, value: number) => {
    setExpenses((prev) => ({ ...prev, [field]: value }));
  };

  const handleLimitChange = (field: keyof CalculationLimits, value: number) => {
    setLimits((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setGeneration('4gen');
    setMedicalType('outpatient');
    setHospitalLevel('clinic');
    setExpenses({
      coveredSelfPaid: 0,
      uncoveredExpense: 0,
      specialManualTherapy: 0,
      specialInjection: 0,
      specialMri: 0,
      pharmacyExpense: 0,
    });
    setLimits(DEFAULT_LIMITS);
    showToast('계산기 입력이 초기화되었습니다.');
  };

  const handleSaveResult = () => {
    if (calculationResult.totalMedicalExpense === 0) {
      showToast('진료비를 입력한 후 저장해주세요.');
      return;
    }

    const newItem: SavedCalculation = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: `${calculationResult.generationName} (${calculationResult.hospitalLevelName})`,
      input: calculationInput,
      result: calculationResult,
    };

    setSavedHistory((prev) => [newItem, ...prev]);
    showToast('계산 결과가 이력에 저장되었습니다.');
  };

  const handleLoadSaved = (saved: SavedCalculation) => {
    setGeneration(saved.input.generation);
    setMedicalType(saved.input.medicalType);
    setHospitalLevel(saved.input.hospitalLevel);
    setExpenses(saved.input.expenses);
    setLimits(saved.input.limits);
    showToast(`${saved.title} 내역을 불러왔습니다.`);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllSaved = () => {
    if (confirm('저장된 계산 이력을 모두 삭제하시겠습니까?')) {
      setSavedHistory([]);
      showToast('모든 저장 이력이 삭제되었습니다.');
    }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Header */}
      <Header
        onNewCalculation={handleReset}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenFaq={() => setIsFaqOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        savedCount={savedHistory.length}
      />

      {/* App Main Layout matching reference image */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (Inputs: Steps 1 ~ 5) - 7 cols */}
          <div className="lg:col-span-7 space-y-5">
            {/* Step 1: Generation Selection */}
            <GenerationSelector
              selectedGen={generation}
              onSelectGen={setGeneration}
              onOpenGuide={() => setIsGuideOpen(true)}
            />

            {/* Step 2: Hospital & Medical Service Type */}
            <HospitalSelector
              medicalType={medicalType}
              hospitalLevel={hospitalLevel}
              generation={generation}
              onSelectMedicalType={setMedicalType}
              onSelectHospitalLevel={setHospitalLevel}
            />

            {/* Step 3: Medical Expense Breakdown */}
            <ExpenseInputForm
              expenses={expenses}
              medicalType={medicalType}
              generation={generation}
              onChangeExpense={handleExpenseChange}
            />

            {/* Step 4 & 5: Limits, Options & Primary Calculate / Reset Action */}
            <LimitsAndOptions
              limits={limits}
              onChangeLimit={handleLimitChange}
              onCalculate={() => showToast('실시간 환급금이 정상 계산되었습니다.')}
              onReset={handleReset}
            />
          </div>

          {/* Right Column (Results Panel & Export Actions) - 5 cols */}
          <div className="lg:col-span-5">
            <ResultPanel
              result={calculationResult}
              input={calculationInput}
              onSaveResult={handleSaveResult}
              onReset={handleReset}
              onOpenPrintReport={() => setIsPrintReportOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <GenerationGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectGeneration={(gen) => setGeneration(gen)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedList={savedHistory}
        onLoadCalculation={handleLoadSaved}
        onDeleteCalculation={handleDeleteSaved}
        onClearAll={handleClearAllSaved}
      />

      <FaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
      />

      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        result={calculationResult}
        input={calculationInput}
      />

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>© 2026 실손보험 환급금 계산기. All rights reserved.</p>
        <p className="mt-1 text-[11px] text-gray-400">
          본 계산기는 세대별 실손보험 약관 기준에 따른 예상 산출 수치이며, 개별 약관 조건 및 특약 가입 여부에 따라 실제 지급액과 상이할 수 있습니다.
        </p>
      </footer>
    </div>
  );
}
