// surgery_documents.category 에 실제로 들어있는 보험사명 목록 (rag-pipeline rows.json 기준으로 확인됨).
// 질문 안에서 특정 보험사가 언급됐는지 감지할 때 공용으로 사용한다.
// (rag-pipeline/lib/insurers.js 와 동일 로직 — 그쪽이 원본, 이쪽은 OnYourLabs 통합용 포트)
export const INSURERS = [
  'DB손해보험',
  'KB손해보험',
  '교보생명',
  '메리츠',
  '미래에셋생명',
  '삼성생명',
  '삼성화재',
  '신한라이프',
  '한화생명',
  '현대해상',
];

// 질문에서 보험사명이 정확히 언급된 경우만 감지한다.
// ('삼성'처럼 삼성생명/삼성화재 둘 다에 해당할 수 있는 애매한 표현은 일부러 매칭하지 않음)
export function detectCompanies(question: string): string[] {
  return INSURERS.filter(name => question.includes(name));
}

// "여러 보험사를 한꺼번에 비교/전체 조회"하려는 의도로 보이는 질문인지 판단.
const COMPARE_ALL_HINTS = ['보험사별', '보험사마다', '각 사', '각사', '전체 보험사', '모든 보험사', '10개사', '전사', '비교'];

export function isCompareAllIntent(question: string): boolean {
  return COMPARE_ALL_HINTS.some(hint => question.includes(hint));
}
