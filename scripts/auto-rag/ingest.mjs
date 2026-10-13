// 자동차보험 약관 청크(rag-data/*.json)를 임베딩해서 Supabase auto_documents에 upsert한다.
// 사용: node --env-file=.env scripts/auto-rag/ingest.mjs rag-data/kb_auto_rows.json
// 필요 env: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY
import fs from 'fs';

const file = process.argv[2];
if (!file) throw new Error('청크 JSON 경로를 인자로 주세요.');
const { OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error('OPENAI_API_KEY / SUPABASE_URL / SUPABASE_SECRET_KEY 가 필요합니다.');

const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const BATCH = 50;

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);

  const embRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OPENAI_API_KEY },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: batch.map(r => r.content.replace(/\n/g, ' ')) }),
  });
  if (!embRes.ok) throw new Error('임베딩 실패: ' + (await embRes.text()));
  const { data } = await embRes.json();

  const payload = batch.map((r, j) => ({
    id: r.id, source: r.source, kind: r.kind, section: r.section, title: r.title,
    grade: r.grade ?? null, amount: r.amount ?? null, item_no: r.item_no ?? null, page: r.page ?? null,
    content: r.content, embedding: data[j].embedding,
  }));

  const upRes = await fetch(`${SUPABASE_URL}/rest/v1/auto_documents?on_conflict=id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SECRET_KEY,
      Authorization: 'Bearer ' + SUPABASE_SECRET_KEY,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!upRes.ok) throw new Error(`업로드 실패 (${i}~): ` + (await upRes.text()));
  console.log(`업로드 ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
}
console.log('완료');
