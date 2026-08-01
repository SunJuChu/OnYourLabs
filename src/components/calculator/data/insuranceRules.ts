import { InsuranceGeneration, HospitalLevel } from '../types';

export interface GenerationInfo {
  id: InsuranceGeneration;
  title: string;
  subtitle: string;
  period: string;
  badge: string;
  description: string;
  coveredRate: string;
  uncoveredRate: string;
  minDeductibleText: string;
  keyFeatures: string[];
  color: string;
}

export const GENERATION_INFOS: Record<InsuranceGeneration, GenerationInfo> = {
  '1gen': {
    id: '1gen',
    title: '1세대 실손보험',
    subtitle: '구(舊)실손 / 표준화 이전',
    period: '~ 2009년 9월 가입',
    badge: '100%~자기부담 최저',
    description: '자기부담금이 없거나 최저 수준(자기부담률 0%). 통원 시 5천원~1만원 정액 공제.',
    coveredRate: '100%',
    uncoveredRate: '100%',
    minDeductibleText: '통원 5,000원 ~ 10,000원 (약제 5,000원)',
    keyFeatures: [
      '급여/비급여 구분 없이 발생비용 100% 보장 (약관별 상이)',
      '통원 1회당 정액 공제 (의원 5천원, 종합병원 1만원 등)',
      '3대 특약 구분 없음 (비급여 도수/주사/MRI 모두 일반 비급여로 보장)',
      '재가입 주기 없음 (100세 만기 자동갱신)'
    ],
    color: 'border-blue-500 bg-blue-50/50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
  },
  '2gen': {
    id: '2gen',
    title: '2세대 실손보험',
    subtitle: '표준화 실손 (선택형/표준형)',
    period: '2009년 10월 ~ 2017년 3월',
    badge: '급여/비급여 80~90% 보장',
    description: '급여/비급여 자기부담률 10% 또는 20%. 병원급별 최소공제액과 비교하여 큰 금액 차감.',
    coveredRate: '80% ~ 90%',
    uncoveredRate: '80% ~ 90%',
    minDeductibleText: '의원 1만 / 병원 1.5만 / 상급 2만 vs 10~20% 중 큰 금액',
    keyFeatures: [
      '표준약관 적용으로 전 보험사 보장 구조 통일',
      '표준형(본인부담 20%)과 선택형II(본인부담 10%) 존재',
      '통원시 병원급별 최소 공제액(1만/1.5만/2만)과 비율공제 중 큰 금액 차감',
      '약제비 최소 공제액 8,000원 적용'
    ],
    color: 'border-indigo-500 bg-indigo-50/50 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200'
  },
  '3gen': {
    id: '3gen',
    title: '3세대 실손보험',
    subtitle: '착한실손',
    period: '2017년 4월 ~ 2021년 6월',
    badge: '3대 특약 30% 분리',
    description: '기본 보장(급여 10~20%, 비급여 20%) + 3대 비급여 특약(도수/주사/MRI 30% 공제) 분리.',
    coveredRate: '80% ~ 90%',
    uncoveredRate: '80%',
    minDeductibleText: '기본: 병원급 공제 vs 10~20% / 特: 2만원 vs 30%',
    keyFeatures: [
      '3대 비급여 특약(도수치료, 비급여 주사, MRI/MRA) 분리 다이어트',
      '3대 특약은 자기부담률 30% 와 최소공제 2만원 중 큰 금액 적용',
      '도수치료 연간 50회/200만원 한도, 주사 50회/250만원 한도',
      '2년간 무사고 청구시 다음해 갱신보험료 10% 할인'
    ],
    color: 'border-sky-500 bg-sky-50/50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200'
  },
  '4gen': {
    id: '4gen',
    title: '4세대 실손보험',
    subtitle: '맞춤형 주계약+특약 (개편 실손)',
    period: '2021년 7월 ~ 2024년',
    badge: '급여 20% / 비급여 30%',
    description: '주계약(급여 20%) 및 특약(비급여 30%) 완전 분리. 비급여 이용량에 따라 할인/할증 적용.',
    coveredRate: '80% (본인부담 20%)',
    uncoveredRate: '70% (본인부담 30%)',
    minDeductibleText: '급여: 1만~2만 vs 20% / 비급여: 3만 vs 30%',
    keyFeatures: [
      '급여 본인부담금 20% (의원/병원 최소 1만원, 종합/상급 최소 2만원)',
      '비급여 본인부담금 30% (최소 공제액 3만원)',
      '비급여 지급보험금에 따른 할인/할증제도 (1단계 할인 ~ 5단계 300% 할증)',
      '도수치료 10회마다 증상 개선 확인 시 연간 최대 50회 보장'
    ],
    color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
  },
  '5gen': {
    id: '5gen',
    title: '5세대 실손보험',
    subtitle: '최신 개정 실손 (2025년~)',
    period: '2025년 이후 개정 가입자',
    badge: '비급여 차등 강화 (30~50%)',
    description: '과잉 비급여 관리 강화. 급여 20~30%, 비급여 30~50% 차등 공제 (중증 질환 예외).',
    coveredRate: '70% ~ 80%',
    uncoveredRate: '50% ~ 70%',
    minDeductibleText: '급여: 1만~2만 vs 20% / 비급여: 3만~5만 vs 30~50%',
    keyFeatures: [
      '비급여 항목 실질 관리 강화 및 과등 치료 공제율 30~50% 확대',
      '중증 및 희귀난치 질환자는 본인부담 완화 (급여 20% 유지)',
      '의료쇼핑 방지 및 합리적 보험료 유지를 위한 최신 구조',
      '최대 환급률은 치료 항목별 의학적 필요성에 따라 정밀 차등'
    ],
    color: 'border-purple-500 bg-purple-50/50 text-purple-900 dark:bg-purple-950/30 dark:text-purple-200'
  }
};

export const HOSPITAL_LEVEL_INFOS: Record<HospitalLevel, { name: string; subtext: string; minDeductibles: Record<InsuranceGeneration, number> }> = {
  clinic: {
    name: '의원급 (동네병원)',
    subtext: '의원, 치과의원, 한의원, 보건소 등',
    minDeductibles: {
      '1gen': 5000,
      '2gen': 10000,
      '3gen': 10000,
      '4gen': 10000,
      '5gen': 10000,
    }
  },
  hospital: {
    name: '병원 / 종합병원',
    subtext: '일반 병원, 종합병원, 한방병원 등',
    minDeductibles: {
      '1gen': 8000,
      '2gen': 15000,
      '3gen': 15000,
      '4gen': 10000,
      '5gen': 15000,
    }
  },
  tertiary: {
    name: '상급종합병원',
    subtext: '대학병원, 지정 상급종합병원 (47개소)',
    minDeductibles: {
      '1gen': 10000,
      '2gen': 20000,
      '3gen': 20000,
      '4gen': 20000,
      '5gen': 20000,
    }
  }
};

export const FAQS = [
  {
    question: '실손보험 급여와 비급여의 차이는 무엇인가요?',
    answer: '급여는 국민건강보험 혜택이 적용되는 진료 항목이며, 비급여는 건강보험이 적용되지 않아 환자가 전액 부담하는 항목(예: 도수치료, 영양주사, 상급병실료 차액 등)입니다. 실손보험에서는 세대별로 급여와 비급여의 자기부담률이 다르게 차감됩니다.'
  },
  {
    question: '병원급별 최소 공제액이란 무엇인가요?',
    answer: '통원(외래) 치료 시 소액 보험금 청구를 조정하기 위해 정해둔 minimum 차감액입니다. 의원 1만원, 병원 1.5만원, 상급종합병원 2만원 등 병원 종류에 따라 차등 적용되며, 실제 자기부담률(10%~30%) 금액과 비교하여 둘 중 더 큰 금액이 공제됩니다.'
  },
  {
    question: '3대 특약(도수치료, 비급여 주사, MRI)은 어떻게 계산되나요?',
    answer: '3세대(2017년 4월~) 이후 가입자는 3대 특약 비급여 항목에 대해 일반 비급여보다 높은 30%의 자기부담률과 1회당 최소 2만원 공제 중 큰 금액이 차감됩니다. 또한 연간 한도 및 횟수 제한(예: 도수치료 연 50회)이 적용됩니다.'
  },
  {
    question: '실손보험 청구 시 어떤 서류가 필요한가요?',
    answer: '기본적으로 진료비 계산서/영수증, 진료비 세부내역서가 필요합니다. 비급여 영양주사의 경우 의사 소견서나 처방전이 필수적이며, 입원 시에는 입퇴원확인서(진단명 포함)가 필요합니다.'
  },
  {
    question: '4세대 실손의 비급여 할인·할증 제도가 무엇인가요?',
    answer: '4세대 실손 가입자는 직전 1년간 비급여 지급보험금이 0원이면 보험료가 할인되며, 100만원 이상 청구 시 금액 구간에 따라 비급여 보험료가 100%~300% 할증되는 차등제도가 적용됩니다 (단, 1~2급 중증질환자 제외).'
  }
];
