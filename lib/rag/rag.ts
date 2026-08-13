// 수술비 약관 RAG 질의응답 핵심 로직 (서버에서만 호출됨, 키는 여기서만 쓰이고 브라우저로 절대 전달되지 않음)
// rag-pipeline/lib/rag.js 를 OnYourLabs 통합용으로 포트한 버전.
// - 데이터/임베딩/Supabase 프로젝트는 rag-pipeline과 동일한 것을 그대로 재사용한다 (별도 DB 구축 안 함).
// - env 로딩 방식만 다름: rag-pipeline은 자체 .env 파서를 쓰지만, 여기서는 OnYourLabs의 기존 관행대로
//   process.env를 그대로 읽는다 (Vercel은 대시보드 env를 자동 주입하고, 로컬은 server.ts의 dotenv/config가 처리).
import { detectCompanies, isCompareAllIntent } from './insurers';
import { isSimpleClassQuestion, extractSurgeryTerm, candidateTerms } from './classify';

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

export interface RagResult {
  answer: string;
  sources: Array<Record<string, any>>;
}

// "OO수술 몇 종?" 류 단순 조회: 임베딩/LLM 없이 surgery_name ILIKE 매칭만으로 바로 답한다.
// 결과가 없으면 null을 돌려주고, 호출부는 기존 벡터검색+LLM 경로로 폴백한다.
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
    if (!res.ok) continue; // 조회 실패 시 다음 후보로, 다 실패하면 벡터검색 경로로 폴백
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

// 벡터검색 결과가 특정 보험사 쪽으로 쏠리는 걸 막기 위한 보험사 인지형 검색.
// - 질문에 특정 보험사가 명시돼 있으면: 해당 보험사 문서만 필터링.
// - "보험사별 비교"류 질문이면: 넉넉히 뽑은 뒤 보험사별로 라운드로빈해서 고르게 담는다.
// - 그 외 일반 질문: 기존처럼 top-k 그대로.
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

export async function ragQuery(question: string): Promise<RagResult> {
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
