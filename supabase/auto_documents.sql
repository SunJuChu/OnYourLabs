-- 자동차보험 약관 RAG 저장소. Supabase SQL Editor에서 한 번 실행한다.
-- surgery_documents와 같은 프로젝트를 쓰되 표/검색함수는 분리해 수술비 답변과 섞이지 않게 한다.

create extension if not exists vector;

create table if not exists auto_documents (
  id text primary key,
  source text not null,
  kind text not null check (kind in ('clause', 'injury_grade', 'disability_grade')),
  section text not null,
  title text not null,
  grade int,
  amount text,
  item_no int,
  page int,
  content text not null,
  embedding vector(1536)
);

create index if not exists auto_documents_kind_grade_idx on auto_documents (kind, grade, item_no);

create or replace function match_auto_docs(
  query_embedding vector(1536),
  match_count int default 8,
  filter_kind text default null
)
returns table (
  id text, kind text, section text, title text, grade int, amount text, page int, content text, similarity float
)
language sql stable
as $$
  select d.id, d.kind, d.section, d.title, d.grade, d.amount, d.page, d.content,
         1 - (d.embedding <=> query_embedding) as similarity
  from auto_documents d
  where d.embedding is not null
    and (filter_kind is null or d.kind = filter_kind)
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- 서버(secret key)만 접근. 브라우저용 anon 키로는 읽지 못하게 RLS를 켜 둔다.
alter table auto_documents enable row level security;
