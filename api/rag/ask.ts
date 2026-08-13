import type { VercelRequest, VercelResponse } from '@vercel/node';

// 이 파일은 의도적으로 완전히 자기완결형(self-contained)이다.
// lib/rag/*.ts를 import하는 버전이 프로덕션(Vercel Node 함수)에서
// 핸들러 코드가 아예 실행되지 못하고 FUNCTION_INVOCATION_FAILED로 죽는 문제가 있어
// (로컬 tsx/Express + Vite 빌드에서는 번들러 기반 모듈 해석이라 재현되지 않음),
// api/ 바깥 상대경로 다중 파일 import 체인을 없애기 위해 전부 이 파일 안으로 인라인했다.
// (server.ts 로컬 개발 경로는 lib/rag/rag.ts를 그대로 계속 사용 — 그쪽은 정상 동작 확인됨)

// ── insurers ──────────────────────────────────────────────
const INSURERS = [
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

function detectCompanies(question: string): string[] {
  return INSURERS.filter(name => question.includes(name));
}

const COMPARE_ALL_HINTS = ['보험사별', '보험사마다', '각 사', '각사', '전체 보험사', '모든 보험사', '10개사', '전사', '비교'];

function isCompareAllIntent(question: string): boolean {
  return COMPARE_ALL_HINTS.some(hint => question.includes(hint));
}

// ── classify ──────────────────────────────────────────────
const COMPLEX_HINTS = [
  '비교', '차이', '왜', '이유', '기준', '조건', '해석',
  '동시수술', '중복', '인정', '지급', '면책', '한도', '청구',
  '어떻게', '어떤 경우', '가능한가', '누가', '얼마',
];

const SIMPLE_CLASS_QUESTION = /몇\s*종/;

function isSimpleClassQuestion(question: string): boolean {
  if (!SIMPLE_CLASS_QUESTION.test(question)) return false;
  if (COMPLEX_HINTS.some(hint => question.includes(hint))) return false;
  return true;
}

function extractSurgeryTerm(question: string): string {
  let term = question;

  for (const name of INSURERS) {
    term = term.replaceAll(name, ' ');
  }

  term = term
    .replace(/몇\s*종류?\s*(수술)?\s*(인가요|이에요|입니다|이야|인지|입니까|일까요|되나요|인가|이니)?\s*\??/g, ' ')
    .replace(/[?？!!.,]/g, ' ')
    .trim();

  term = term.replace(/(은|는|이|가|의|을|를)\s*$/, '').trim();

  return term;
}

const SYNONYMS: Record<string, string> = {
  치질: '치핵',
  축농증: '부비동',
};

function candidateTerms(term: string): string[] {
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

  return candidates;
}

// ── rag ───────────────────────────────────────────────────
function getSupabaseHeaders() {
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SECRET_KEY || '',
    Authorization: 'Bearer ' + SUPABASE_SECRET_KEY,
  };
}

interface Doc {
  category: string;
  table?: string;
  content: string;
  surgery_name?: string;
  surgery_class?: string;
  similarity?: number;
  [key: string]: any;
}

interface RagResult {
  answer: string;
  sources: Array<Record<string, any>>;
}

async function trySimpleLookup(question: string): Promise<RagResult | null> {
  if (!isSimpleClassQuestion(question)) return null;

  const term = extractSurgeryTerm(question);
  if (!term || term.length < 2) return null;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const companies = detectCompanies(question);

  for (const candidate of candidateTerms(term)) {
    const params = new URLSearchParams({
      select: 'category,table,surgery_name,surgery_class',
      surgery_name: `ilike.*${candidate}*`,
      order: 'category.asc',
      limit: '30',
    });
    if (companies.length) {
      params.set('category', `in.(${companies.join(',')})`);
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/surgery_documents?${params.toString()}`, {
      headers: getSupabaseHeaders(),
    });
    if (!res.ok) continue;
    const rows = await res.json();
    if (!rows.length) continue;

    const lines = rows.map((r: Doc) => `${r.category}${r.table ? ' (' + r.table + ')' : ''}: ${r.surgery_name} → ${r.surgery_class}종 수술`);
    return {
      answer: `[텍스트 매칭 결과, "${candidate}" 검색]\n` + lines.join('\n'),
      sources: rows.map((r: Doc) => ({ category: r.category, table: r.table, surgery_name: r.surgery_name, surgery_class: r.surgery_class })),
    };
  }

  return null;
}

async function matchDocs(embedding: number[], question: string): Promise<Doc[]> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const companies = detectCompanies(question);
  const compareAll = isCompareAllIntent(question);
  const needsWideFetch = companies.length > 0 || compareAll;
  const matchCount = companies.length > 1 ? Math.min(100, companies.length * 30) : needsWideFetch ? 40 : 5;

  const matchRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_surgery_docs`, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify({ query_embedding: embedding, match_count: matchCount, filter_type: null }),
  });
  if (!matchRes.ok) throw new Error('검색 실패 (' + matchRes.status + '): ' + (await matchRes.text()));
  let docs: Doc[] = await matchRes.json();

  if (companies.length === 1) {
    const filtered = docs.filter(d => companies.includes(d.category));
    docs = (filtered.length ? filtered : docs).slice(0, 5);
  } else if (companies.length > 1 || compareAll) {
    const pool = companies.length ? docs.filter(d => companies.includes(d.category)) : docs;
    const byCompany = new Map<string, Doc[]>();
    for (const d of (pool.length ? pool : docs)) {
      if (!byCompany.has(d.category)) byCompany.set(d.category, []);
      byCompany.get(d.category)!.push(d);
    }
    const limit = companies.length ? Math.max(10, companies.length * 5) : 10;
    const rounded: Doc[] = [];
    let more = true;
    while (more && rounded.length < limit) {
      more = false;
      for (const list of byCompany.values()) {
        if (list.length) {
          rounded.push(list.shift()!);
          more = true;
          if (rounded.length >= limit) break;
        }
      }
    }
    docs = rounded;
  } else {
    docs = docs.slice(0, 5);
  }

  return docs;
}

async function ragQuery(question: string): Promise<RagResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !OPENAI_API_KEY) {
    throw new Error('RAG 환경변수(OPENAI_API_KEY / SUPABASE_URL / SUPABASE_SECRET_KEY)가 설정되어 있지 않습니다.');
  }

  const simple = await trySimpleLookup(question);
  if (simple) return simple;

  const embRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OPENAI_API_KEY },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: question.replace(/\n/g, ' ') }),
  });
  if (!embRes.ok) throw new Error('임베딩 실패: ' + (await embRes.text()));
  const emb = (await embRes.json()).data[0].embedding;

  const docs = await matchDocs(emb, question);
  if (!docs.length) return { answer: '관련 약관 데이터를 찾을 수 없습니다.', sources: [] };

  const ctx = docs
    .map((d, i) => `[참고${i + 1}] ${d.category || ''} ${d.table ? '(' + d.table + ')' : ''} ${d.surgery_class ? '[' + d.surgery_class + '종]' : ''}\n${d.content}`)
    .join('\n\n---\n\n');

  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OPENAI_API_KEY },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: `당신은 수술비 보험 약관 전문 AI 어시스턴트입니다. 아래 약관 데이터만 근거로 답변하세요. 수술 종수를 먼저 명시하고, 어느 보험사와 어느 표(참고 문서에 적힌 괄호 안 표 이름) 기준인지 정확히 밝히세요. 표 이름을 추측하지 말고 참고 문서에 적힌 그대로만 사용하세요. 3~5문장으로 답변하세요.\n\n[약관 데이터]\n${ctx}`,
        },
        { role: 'user', content: question },
      ],
    }),
  });
  if (!chatRes.ok) throw new Error('답변 생성 실패: ' + (await chatRes.text()));
  const answer = (await chatRes.json()).choices[0].message.content;

  return {
    answer,
    sources: docs.map(d => ({
      category: d.category,
      table: d.table,
      surgery_name: d.surgery_name,
      surgery_class: d.surgery_class,
      similarity: d.similarity,
    })),
  };
}

// ── handler ───────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: '질문이 비어있습니다.' });
  }

  try {
    const result = await ragQuery(String(question).trim());
    res.json(result);
  } catch (err: any) {
    console.error('[RAG Error]', err?.message);
    res.status(500).json({ error: '서버 오류: ' + (err?.message || '알 수 없는 오류') });
  }
}
