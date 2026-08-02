export type InsuranceGeneration = '1gen' | '2gen' | '3gen' | '4gen' | '5gen';

export type MedicalType = 'outpatient' | 'inpatient' | 'pharmacy';

export type HospitalLevel = 'clinic' | 'hospital' | 'tertiary'; // 의원, 병원/종합병원, 상급종합병원

export interface ExpenseBreakdown {
  coveredSelfPaid: number;      // 급여 본인부담금 (약국 방문 시: 약제비 계산서상 "본인부담금")
  uncoveredExpense: number;     // 일반 비급여 비용 (약국 방문 시: 약제비 계산서상 "비급여전액본인부담금")
  specialManualTherapy: number; // 3대특약: 도수/체외충격파/증식치료
  specialInjection: number;     // 3대특약: 비급여 주사료
  specialMri: number;           // 3대특약: 비급여 MRI/MRA
  uncoveredRoomFee?: number;    // 5세대 전용: 비급여 상급병실료 차액 (입원)
}

export interface CalculationLimits {
  outpatientLimitPerVisit: number; // 통원(급여+비급여) 1회당 한도 (기본 20만원~30만원)
  specialLimitPerVisit: number;    // 3대 비급여 특약(도수/주사/MRI) 1회당 한도 - 통원 한도와 별도 산정
  pharmacyLimitPerVisit: number;   // 약제 1회당 한도 (기본 5만원~10만원)
  manualTherapyAnnualCount: number; // 도수치료 연간 횟수
}

export interface CalculationInput {
  generation: InsuranceGeneration;
  medicalType: MedicalType;
  hospitalLevel: HospitalLevel;
  expenses: ExpenseBreakdown;
  limits: CalculationLimits;
  customOptions?: {
    isChronicDisease?: boolean; // 희귀/중증 질환 여부
    nonCoveredDiscountStep?: number; // 4세대 비급여 할인/할증 단계 (1~5단계)
    // --- 5세대 전용 옵션 ---
    isSanjeongTeukrye?: boolean; // 5세대: 본인부담 산정특례 대상 질환 여부 (true=중증비급여 특약1 30%, false=비중증비급여 특약2 50%)
    isHealthInsuranceExempt?: boolean; // 5세대: 건강보험/의료급여 미적용자 예외 산식 적용 여부
    admissionDays?: number; // 5세대: 입원일수 (상급병실료 차액 계산용)
    isGeneralHospitalOrAbove?: boolean; // 5세대 전용: hospitalLevel === 'hospital' 선택 시, 실제로는 "종합병원 이상"인지 구분 (기존 3단계 병원 유형 체계는 유지하되 5세대 계산에서만 참조)
  };
}

export interface DeductionDetail {
  coveredDeductible: number;      // 급여 공제액
  uncoveredDeductible: number;    // 비급여 공제액
  specialDeductible: number;      // 3대 특약 공제액
  pharmacyDeductible: number;     // 약제비 공제액
  exceededLimitDeduction: number; // 한도 초과로 인한 차감액
  totalDeductible: number;        // 자기부담금 총액 (총 공제액)
}

export interface CalculationResult {
  totalMedicalExpense: number;    // 총 발생 진료비
  deductionDetail: DeductionDetail;
  reimbursementAmount: number;   // 최종 예상 환급금 (보험금)
  coveragePercentage: number;     // 환급 비율 (%)
  generationName: string;
  hospitalLevelName: string;
  notes: string[];                // 계산 기준 및 유의사항 설명
  breakdownSummary: {
    label: string;
    amount: number;
    description: string;
  }[];
}

export interface SavedCalculation {
  id: string;
  timestamp: string;
  title: string;
  input: CalculationInput;
  result: CalculationResult;
}
