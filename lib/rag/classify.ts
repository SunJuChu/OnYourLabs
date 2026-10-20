// "OO수술 몇 종이야?" 류의 단순 조회 질문을, 임베딩/LLM 없이도
// surgery_name 텍스트 매칭(ILIKE)만으로 답할 수 있는지 판단하는 로직.
// (rag-pipeline/lib/classify.js 와 동일 로직 — 그쪽이 원본, 이쪽은 OnYourLabs 통합용 포트)
import { INSURERS } from './insurers';

// 이 단어들이 하나라도 들어있으면 "해석/비교/조건"이 필요한 복잡한 질문으로 보고
// 단순 조회 경로를 타지 않는다 (벡터검색 + LLM 경로로 보냄).
const COMPLEX_HINTS = [
  '비교', '차이', '왜', '이유', '기준', '조건', '해석',
  '동시수술', '중복', '인정', '지급', '면책', '한도', '청구',
  '어떻게', '어떤 경우', '가능한가', '누가', '얼마',
];

const SIMPLE_CLASS_QUESTION = /몇\s*종/;

// "유리체", "현대해상 유리체 수술"처럼 수술명 키워드만 던진 짧은 질문도 단순 조회로 본다.
const KEYWORD_ONLY_MAX_LENGTH = 15;

export function isSimpleClassQuestion(question: string): boolean {
  if (COMPLEX_HINTS.some(hint => question.includes(hint))) return false;
  if (SIMPLE_CLASS_QUESTION.test(question)) return true;
  const term = extractSurgeryTerm(question);
  return term.length > 0 && term.length <= KEYWORD_ONLY_MAX_LENGTH && term.split(/\s+/).length <= 3;
}

// 질문에서 보험사명/불필요한 조사·어미를 제거해서 surgery_name 검색에 쓸 핵심어를 뽑아낸다.
// 완벽하지 않은 휴리스틱이므로, 결과가 비면 호출부에서 벡터검색으로 폴백해야 한다.
export function extractSurgeryTerm(question: string): string {
  let term = question;

  for (const name of INSURERS) {
    term = term.replaceAll(name, ' ');
  }

  term = term
    .replace(/몇\s*종류?\s*(수술)?\s*(인가요|이에요|입니다|이야|인지|입니까|일까요|되나요|인가|이니)?\s*\??/g, ' ')
    .replace(/[?？!!.,]/g, ' ')
    .replace(/(알려\s*줘|알려\s*주세요|뭐야|뭐예요|궁금해요?)\s*$/, ' ')
    .trim();

  // 흔한 조사 제거 (문장 끝쪽부터)
  term = term.replace(/(은|는|이|가|의|을|를)\s*$/, '').trim();

  return term;
}

// 일상 용어와 약관 표기(의학 용어)가 달라서 ILIKE로 못 찾는 경우가 있어, 확인된 것만 매핑해둔다.
// (rows.json 실제 데이터로 검증됨: '치질'은 약관엔 '치핵'으로, '축농증'은 '부비동'으로만 나옴)
// 새로운 불일치 사례가 발견되면 여기에 추가하면 됨.
const SYNONYMS: Record<string, string> = {
  치질: '치핵',
  축농증: '부비동',
  초자체: '유리체',
  맹장: '충수',
  쓸개: '담낭',
  디스크: '추간판',
};

// 단어별로 쪼개 검색할 때, 거의 모든 행에 걸려서 의미 없는 단어는 뺀다.
const STOP_TOKENS = ['수술', '관혈', '관혈수술', '종'];

// surgery_name 표기가 "백내장(白內障), 수정체(水晶體) 관혈수술"처럼 한자/쉼표가 섞여 있어서
// 질문에서 뽑은 term을 그대로 ILIKE 하면 못 찾는 경우가 많다.
// 그래서 term -> (동의어 치환) -> (trailing "수술" 제거) -> (공백 제거) 순으로 점점 넓혀가며 여러 후보를 시도한다.
export function candidateTerms(term: string): string[] {
  const candidates: string[] = [];
  const push = (c: string) => {
    const v = c.trim();
    if (v.length >= 2 && !candidates.includes(v)) candidates.push(v);
  };

  const withSynonyms = [term];
  for (const [colloquial, formal] of Object.entries(SYNONYMS)) {
    if (term.includes(colloquial)) withSynonyms.push(term.replaceAll(colloquial, formal));
  }

  for (const t of withSynonyms) {
    push(t);
    const noSurgery = t.replace(/\s*수술\s*$/, '').trim();
    push(noSurgery);
    push(t.replace(/\s+/g, ''));
    push(noSurgery.replace(/\s+/g, ''));
  }

  // 문구 전체로 못 찾으면 단어별로 시도 ("유리체 관혈 수술" → "유리체")
  for (const t of withSynonyms) {
    for (const token of t.split(/\s+/)) {
      const v = token.replace(/수술$/, '');
      if (!STOP_TOKENS.includes(v)) push(v);
    }
  }

  return candidates;
}

// 시각기 63~78항처럼 여러 수술이 content 한 덩어리로 묶여 surgery_name이 비어 있는 행은
// 검색어가 들어있는 문장만 잘라서 보여준다.
export function matchedSnippet(content: string, term: string): string {
  const sentences = content.split(/(?<=[.。])\s+/);
  const hits = sentences.filter(s => s.includes(term));
  const text = (hits.length ? hits : [content]).join(' ');
  return text.length > 200 ? text.slice(0, 200) + '…' : text;
}
