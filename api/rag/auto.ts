import type { VercelRequest, VercelResponse } from '@vercel/node';

// 자동차보험 약관 RAG. api/rag/ask.ts와 같은 이유로 자기완결형 유지 (Vercel 함수에서 api/ 밖 import 체인 금지).
// 데이터: Supabase auto_documents (supabase/auto_documents.sql, scripts/ingest-auto.mjs 참고)

interface AutoDoc {
  id: string;
  kind: 'clause' | 'injury_grade' | 'disability_grade';
  section: string;
  title: string;
  grade?: number | null;
  amount?: string | null;
  item_no?: number | null;
  page?: number | null;
  content: string;
  similarity?: number;
}

interface RagResult {
  answer: string;
  sources: Array<Record<string, any>>;
  route?: 'text' | 'vector' | 'hybrid';
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SECRET_KEY || '';
  return { 'Content-Type': 'application/json', apikey: key, Authorization: 'Bearer ' + key };
}

const toSource = (d: AutoDoc) => ({ section: d.section, title: d.title, grade: d.grade, amount: d.amount, page: d.page, similarity: d.similarity });

// ── 전체 문서 캐시: 약 400건·5만 자라 한 번 받아 두고 글자 검색에 쓴다 (DB 구조 변경 없음) ──
let docCache: { at: number; rows: AutoDoc[] } | null = null;
const CACHE_MS = 10 * 60 * 1000;

async function loadAllDocs(): Promise<AutoDoc[]> {
  if (docCache && Date.now() - docCache.at < CACHE_MS) return docCache.rows;
  const params = new URLSearchParams({
    select: 'id,kind,section,title,grade,amount,item_no,page,content',
    order: 'kind.desc,grade.asc,item_no.asc,id.asc',
    limit: '2000',
  });
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/auto_documents?${params}`, { headers: supabaseHeaders() });
  if (!res.ok) throw new Error('약관 목록 조회 실패 (' + res.status + ')');
  const rows: AutoDoc[] = await res.json();
  docCache = { at: Date.now(), rows };
  return rows;
}

// 띄어쓰기·기호 차이를 무시하고 비교한다 ("대퇴골" ↔ "대퇴 골두", "감액비율" ↔ "감액 비율")
const squash = (s: string) => s.replace(/[\s·・,.()（）\[\]「」｢｣"'“”‘’\-–—~]/g, '').toLowerCase();
const stripHeader = (s: string) => s.replace(/^\[[^\]]+\]\s*/, '');

// 질문에서 검색어 뽑기: 조사·어미를 떼고 2글자 이상만 남긴다
const STOPWORDS = new Set([
  'kb', 'kb손해보험', '자동차보험', '자보', '약관', '보험', '알려줘', '알려주세요', '설명해줘', '얼마', '얼마인가요', '얼마예요',
  '무엇', '뭐야', '뭔가요', '어떻게', '어떤', '어떻게되나요', '있나요', '되나요', '인가요', '경우', '관련', '대해', '대한', '내용',
]);
const ENDINGS = /(입니까|인가요|인지요|이에요|예요|이야|인가|인지|나요|까요|해요|에서는|에게는|으로는|이라면|라면|에서|에게|으로|이란|란|하면|했을때|할때|되면|은|는|이|가|을|를|의|에|로|와|과|도|만)$/;

function questionTerms(question: string): string[] {
  const out: string[] = [];
  for (const raw of question.replace(/[?？!.,~·「」"'()]/g, ' ').split(/\s+/)) {
    let w = raw.trim().toLowerCase();
    for (let i = 0; i < 2; i++) {
      const cut = w.replace(ENDINGS, '');
      if (cut !== w && cut.length >= 2) w = cut;
    }
    if (w.length >= 2 && !STOPWORDS.has(w)) out.push(squash(w));
  }
  return [...new Set(out)].filter(w => w.length >= 2);
}

// 글자 검색: 드문 단어일수록 가중치를 높게(IDF) 주고, 제목에 있으면 가산. 검색어가 2개 이상이면 2개 이상 겹쳐야 후보.
function keywordSearch(question: string, all: AutoDoc[], limit = 5): AutoDoc[] {
  const terms = questionTerms(question);
  if (!terms.length) return [];
  const bodies = all.map(d => squash(d.title + ' ' + stripHeader(d.content)));
  const titles = all.map(d => squash(d.title));
  const N = all.length;
  const weights = terms.map(t => {
    const df = bodies.filter(b => b.includes(t)).length;
    return df ? Math.log(1 + N / df) : 0;
  });
  const need = Math.min(2, terms.filter((_, j) => weights[j] > 0).length);
  if (!need) return [];

  return all
    .map((d, i) => {
      let score = 0, hits = 0;
      terms.forEach((t, j) => {
        if (!bodies[i].includes(t)) return;
        hits++;
        score += weights[j] * (titles[i].includes(t) ? 1.5 : 1);
      });
      return { d, score, hits };
    })
    .filter(x => x.hits >= need)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.d);
}

// ── "OO 몇 급?" 단순 조회: 임베딩/LLM 없이 상해·후유장애 급수표에서 바로 찾는다 ──
const GRADE_QUESTION = /몇\s*급|몇\s*등급|등급이?\s*(어떻게|뭐)/;
const COMPLEX_HINTS = ['비교', '차이', '왜', '이유', '조건', '해석', '계산', '어떻게 산정', '가능한가'];

function gradeKinds(question: string): AutoDoc['kind'][] {
  if (/후유\s*장애|장해|장애/.test(question)) return ['disability_grade'];
  if (/상해|부상|다친|다쳤/.test(question)) return ['injury_grade'];
  return ['injury_grade', 'disability_grade'];
}

function extractTerm(question: string): string {
  return question
    .replace(/KB손해보험|KB|자동차보험|자보|약관/g, ' ')
    .replace(/(후유\s*장애|장해|상해|부상)\s*(등급|급수)?/g, ' ')
    .replace(/몇\s*(등급|급)\s*(인가요|이에요|입니다|이야|인지|입니까|일까요|되나요|인가|이니|나와요|나오나요|받나요|받아요)?/g, ' ')
    .replace(/등급이?\s*(어떻게|뭐)\s*\S*/g, ' ')
    .replace(/[?？!.,~]/g, ' ')
    .replace(/(은|는|이|가|의|을|를|으로|로|하면|이면|면)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 시행령 별표1 비고(상하지 공통 1~3항) 요약. 급수표 항목은 별도 표기가 없으면 "수술한 경우" 기준이라 함께 보여줘야 오해가 없다.
const FRACTURE_RULE =
  '※ 수술 여부에 따른 급수 조정 (상해구분 적용기준 · 상하지 공통)\n' +
  '  · 급수표 항목은 "수술을 시행하지 않은"이라고 적혀 있지 않으면 수술한 경우 기준입니다.\n' +
  '  · 보존적 치료(수술 안 함) 골절: 해당 등급보다 2급 낮게\n' +
  '  · 도수 정복 또는 경피적 핀고정술: 해당 등급보다 1급 낮게\n' +
  '  · 개방성 골절·탈구(거스틸로 2형 이상, 개방창 1cm 이상): 1급 높게\n' +
  '  · 골절에 주요 말초신경 손상 동반: 1급 높게 / 소아(만 13세 미만): 성인보다 1급 낮게(성장판 손상 동반 시 동일)';

function formatGradeList(words: string[], rows: AutoDoc[]): string {
  const label = (k: AutoDoc['kind']) => (k === 'injury_grade' ? '상해' : '후유장애');
  const out: string[] = [`"${words.join(' + ')}" 해당 항목 ${rows.length}건 (자동차손해배상보장법 시행령 급수표)`];

  for (const kind of ['injury_grade', 'disability_grade'] as const) {
    const ofKind = rows.filter(r => r.kind === kind);
    if (!ofKind.length) continue;
    out.push('', `■ ${label(kind)}급수표`);
    const grades = [...new Set(ofKind.map(r => r.grade))];
    for (const g of grades) {
      const items = ofKind.filter(r => r.grade === g);
      out.push(`▸ ${label(kind)} ${g}급 (책임보험 한도 ${items[0].amount})`);
      for (const r of items) out.push(`   · ${r.content.replace(/^\[[^\]]+\]\s*/, '')}`);
    }
  }

  if (rows.some(r => r.kind === 'injury_grade') && words.some(w => /골절|탈구|골/.test(w))) out.push('', FRACTURE_RULE);
  out.push(
    '',
    '※ 금액은 책임보험(대인배상Ⅰ) 한도입니다. 자기신체사고는 가입금액별로 다르니 "자기신체사고 N급 얼마?"로 물어보세요.',
  );
  return out.join('\n');
}

async function tryGradeLookup(question: string): Promise<RagResult | null> {
  if (!GRADE_QUESTION.test(question) || COMPLEX_HINTS.some(h => question.includes(h))) return null;
  const term = extractTerm(question);
  if (term.length < 2) return null;

  const kinds = gradeKinds(question);
  // "손가락 하나 잃으면" → ["손가락", "잃"]: 수량 표현은 버리고 활용 어미를 떼서 약관 표현("잃은 사람")과 맞춘다
  const words = term
    .split(' ')
    .filter(w => !/^(하나|한|두|세|네|\d+개?|한개|두개|개)$/.test(w))
    .map(w => w.replace(/(었으면|았으면|으면|면|어서|아서|었는데|았는데|으니|었다|았다|으)$/, ''))
    .filter(Boolean);
  if (!words.some(w => w.length >= 2)) return null;
  const attempts = [[term], words.length > 1 ? words : null].filter(Boolean) as string[][];

  const all = await loadAllDocs().catch(() => null);
  if (!all) return null;
  const pool = all.filter(d => kinds.includes(d.kind));

  for (const ws of attempts) {
    const keys = ws.map(squash).filter(Boolean);
    const rows = pool.filter(d => {
      const body = squash(stripHeader(d.content));
      return keys.every(k => body.includes(k));
    }).slice(0, 40);
    if (!rows.length) continue;

    return { answer: formatGradeList(ws, rows), sources: rows.map(toSource), route: 'text' };
  }
  return null;
}

// ── 벡터검색 + LLM ──
async function ragQuery(question: string): Promise<RagResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !OPENAI_API_KEY) {
    throw new Error('RAG 환경변수(OPENAI_API_KEY / SUPABASE_URL / SUPABASE_SECRET_KEY)가 설정되어 있지 않습니다.');
  }

  const lookup = await tryGradeLookup(question);
  if (lookup) return lookup;

  const embRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OPENAI_API_KEY },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: question.replace(/\n/g, ' ') }),
  });
  if (!embRes.ok) throw new Error('임베딩 실패: ' + (await embRes.text()));
  const embedding = (await embRes.json()).data[0].embedding;

  const matchRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/match_auto_docs`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({ query_embedding: embedding, match_count: 10, filter_kind: null }),
  });
  if (!matchRes.ok) throw new Error('검색 실패 (' + matchRes.status + '): ' + (await matchRes.text()));
  const vectorDocs: AutoDoc[] = await matchRes.json();

  // 짧은 질문은 의미 검색만으로 핵심 조항(예: 별표4 동승자 감액비율)을 놓칠 수 있어, 글자 검색 결과를 앞에 붙인다.
  const all = await loadAllDocs().catch(() => [] as AutoDoc[]);
  const keywordDocs = keywordSearch(question, all, 5);
  const seen = new Set<string>();
  const docs = [...keywordDocs, ...vectorDocs].filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true))).slice(0, 14);
  if (!docs.length) return { answer: '관련 약관 데이터를 찾을 수 없습니다.', sources: [] };

  const ctx = docs.map((d, i) => `[참고${i + 1}] ${d.title} (약관 ${d.page}쪽)\n${d.content}`).join('\n\n---\n\n');

  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OPENAI_API_KEY },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content:
            '당신은 자동차보험 약관 전문 AI 어시스턴트입니다. 아래 KB손해보험 개인용자동차보험 보통약관(별표1~5, 자동차손해배상보장법 시행령 상해·후유장애 구분표) 데이터만 근거로 답변하세요.\n' +
            '- 급수·금액·비율이 있으면 먼저 밝히고, 어느 별표 또는 시행령 표 기준인지 참고 문서 제목 그대로 출처를 밝히세요.\n' +
            '- 대인배상(책임보험 한도)과 자기신체사고(가입금액별) 금액을 섞지 말고 구분해서 설명하세요.\n' +
            '- 위자료·간병비·휴업손해 등 항목별 금액을 물으면 해당 항목 표의 금액으로 답하세요. 상해급수표의 "책임보험 한도" 금액을 항목 금액으로 답하면 안 됩니다.\n' +
            '- 비율·금액 구간표는 질문의 수치가 "이상/미만/초과" 경계 안에 실제로 들어가는 구간을 하나씩 대조해서 고르고, 고른 구간을 답에 함께 적으세요.\n' +
            '- 질문 내용에 해당할 수 있는 급수 항목이 여러 개면 대표 하나만 고르지 말고 모두 나열하세요.\n' +
            '- 산정 방식이 필요한 질문은 약관의 산식을 그대로 보여주세요.\n' +
            '- 데이터에 없는 내용은 추측하지 말고 "제공된 약관 범위에서 확인되지 않습니다"라고 답하세요.\n' +
            '3~6문장으로 답변하세요.\n\n[약관 데이터]\n' + ctx,
        },
        { role: 'user', content: question },
      ],
    }),
  });
  if (!chatRes.ok) throw new Error('답변 생성 실패: ' + (await chatRes.text()));
  const answer = (await chatRes.json()).choices[0].message.content;

  return { answer, sources: docs.map(toSource), route: keywordDocs.length ? 'hybrid' : 'vector' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body || {};
  if (!question || !String(question).trim()) return res.status(400).json({ error: '질문이 비어있습니다.' });

  try {
    res.json(await ragQuery(String(question).trim()));
  } catch (err: any) {
    console.error('[Auto RAG Error]', err?.message);
    res.status(500).json({ error: '서버 오류: ' + (err?.message || '알 수 없는 오류') });
  }
}
