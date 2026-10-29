# OnYourLabs 인수인계 문서

작성일: 2026-10-29
새 Claude 계정에서 이 프로젝트를 이어서 작업하기 위한 맥락 정리. 새 대화를 시작할 때 이 파일을 먼저 읽게 하면 된다.

---

## 1. 프로젝트 한 줄 요약

보험 설계사(FC)용 웹 대시보드. 보험사 소식지 PDF 열람·AI 요약, 실손의료비 계산기, 약관 RAG 챗봇(수술비·자동차보험)을 한 화면에서 제공한다.

| 항목 | 값 |
|---|---|
| 배포 주소 | https://on-your-labs.vercel.app (루트는 `/landing.html`, 대시보드는 `/dashboard`) |
| GitHub | https://github.com/SunJuChu/OnYourLabs (`main` 브랜치에 push하면 Vercel 자동 배포) |
| 로컬 작업 폴더 | `C:\Users\박노언\OneDrive\바탕 화면\소식지_temp` (예전 `소식지` 폴더는 비어 있으니 쓰지 말 것) |
| Supabase 프로젝트 | `tvlpqhzdchqvjsjuqmqh` (수술비·자동차보험 RAG 공용) |
| 브랜드 색 | 딥 네이비 `#0d2461`, 틸 `#0abde3` / `#0891b2`, 오렌지 포인트 `#f59e0b`, 폰트 Noto Sans KR + Inter |

## 2. 기술 구성

- 프론트: React 19 + TypeScript + Vite + Tailwind CSS v4 (`@tailwindcss/vite`), 아이콘 lucide-react
- 배포: Vercel. `api/` 폴더의 파일이 각각 서버리스 함수가 된다.
- 로컬 개발: `npm run dev` → `server.ts`(Express + Vite 미들웨어, 포트 3000). Vercel 함수와 같은 경로를 흉내 낸다.
- AI: OpenAI(`text-embedding-3-small` 임베딩, `gpt-4o-mini` 답변) + Supabase pgvector. 소식지 요약은 Gemini(`api/gemini/analyze.ts`).

### 주요 파일

| 경로 | 역할 |
|---|---|
| `src/App.tsx` | 메인 화면. `activeView`로 소식지 / 실손계산기 / 약관챗봇 전환 |
| `src/components/Sidebar.tsx` | 사이드바 (메뉴, 데모/구글드라이브 모드, 필터) |
| `src/components/calculator/` | 실손의료비 계산기 |
| `src/components/surgeryChat/SurgeryChatApp.tsx` | 약관 챗봇 화면. 머리글에서 [수술비 \| 자동차보험] 전환 |
| `api/rag/ask.ts` | 수술비 약관 RAG (테이블 `surgery_documents`, 함수 `match_surgery_docs`) |
| `api/rag/auto.ts` | 자동차보험 약관 RAG (테이블 `auto_documents`, 함수 `match_auto_docs`) |
| `lib/rag/*.ts` | 수술비 RAG 로직. **로컬 server.ts 전용** (아래 주의사항 참고) |
| `api/drive/list.ts`, `api/proxy/pdf.ts` | 구글 드라이브 폴더(생명보험/손해보험/교육자료) PDF 목록·열람 |
| `supabase/auto_documents.sql` | 자동차보험 테이블·검색함수 생성 SQL (이미 실행 완료) |
| `scripts/auto-rag/` | 약관 PDF → 텍스트 추출 → 청크 분할 → Supabase 적재 스크립트 |
| `rag-data/kb_auto_rows.json` | 자동차보험 약관 청크 414건 (이미 Supabase에 적재 완료) |

### 환경변수 (값은 이 문서에 없음. Vercel과 로컬 `.env`에 있음)

- `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`(service_role 키) — RAG 챗봇
- `GEMINI_API_KEY` — 소식지 AI 요약
- `VITE_GOOGLE_CLIENT_ID` — 구글 로그인(드라이브 연동) 기본 클라이언트 ID
- Vercel 쪽 키는 Sensitive로 저장돼 다시 볼 수 없다. 새로 필요하면 원래 발급처(OpenAI, Supabase 대시보드)에서 받는다.
- `.env` 파일은 압축본에 넣지 않았다. 로컬 작업 시 `소식지_temp\.env`를 그대로 쓰거나 새로 만든다.

## 3. 반드시 알아둘 주의사항 (과거에 실제로 터진 문제)

1. **`api/` 파일은 자기완결형으로 유지.** `api/rag/ask.ts`가 `lib/rag/*`를 import하자 Vercel에서 함수가 즉시 죽었다(FUNCTION_INVOCATION_FAILED). 그래서 `api/rag/*.ts`는 필요한 로직을 전부 파일 안에 넣는다. `lib/rag`는 로컬 `server.ts`만 쓴다. 수술비 로직을 고치면 `api/rag/ask.ts`와 `lib/rag/*` **양쪽을 같이** 고쳐야 한다.
2. **React onClick에 함수를 그대로 넘기지 말 것.** `onClick={handleGoogleSignIn}`이 클릭 이벤트 객체를 client_id로 넘겨서 구글 로그인이 `invalid_client`로 전부 막혔다. 인자가 있는 함수는 `onClick={() => fn()}`.
3. **구글 OAuth 동의 화면은 "테스트" 모드.** 새 사용자는 Google Cloud Console에서 테스트 사용자로 추가해야 로그인된다.
4. **키는 채팅에 붙여넣지 않는다.** `.env`에 직접 넣고, Claude에게는 "넣었어"라고만 말한다. (2026-10에 OpenAI 키가 채팅에 노출돼 재발급함)
5. **Supabase 키 구분:** `role: anon`(공개용, 읽기 전용) 말고 `service_role` 키를 `SUPABASE_SECRET_KEY`에 쓴다.

## 4. 기능별 현황

### 소식지 대시보드
- 데모 모드(샘플 데이터)와 구글 드라이브 모드(드라이브 안 `생명보험`/`손해보험`/`교육자료` 폴더 PDF 자동 수집)를 제공한다.
- 2026-09: 저작권 우려로 사이드바 분류 필터의 **소식지·교안 버튼을 "준비중"으로 닫아 둠**.
- 2026-10: **변호사 상담 결과 소식지는 사용 가능**으로 정리됨. → "준비중" 해제 여부는 아직 결정·작업 안 함.

### 실손의료비 계산기
- `src/components/calculator/`에 구현돼 있다. 세대별 규칙은 `data/insuranceRules.ts`에 있다.

### 수술비 약관 RAG 챗봇
- 10개 보험사(DB손해보험, KB손해보험, 교보생명, 메리츠, 미래에셋생명, 삼성생명, 삼성화재, 신한라이프, 한화생명, 현대해상)의 1-5종/1-8종 수술비 특약을 다룬다.
- 데이터는 별도 `rag-pipeline` 프로젝트로 만들어 넣었다. 그 프로젝트는 이 PC에 없다.
- 2026-10-20 PR #1 반영 내용: 키워드 검색 범위 확대, 동의어 추가, 보험사 미지정 질문은 전체 보험사에서 고르게 선택, 답변에 검색 경로 표시.

### 자동차보험 약관 RAG 챗봇 (2026-10-13 추가)
- 출처: KB손해보험 개인용자동차보험 보통약관 PDF(전체 231쪽) 중 **60~89쪽**. 사용자가 이 범위를 지정했다.
  - 제59~62조(일반사항), 별표1 대인배상 지급기준(사망·부상·후유장애), 별표2 대물배상, 별표3 과실상계, 별표4 동승자 감액비율, 별표5 자기신체사고, 부표 지연이자
  - 자동차손해배상보장법 시행령 [별표1] 상해 1~14급 구분(항목 248건), [별표2] 후유장애 1~14급 구분(항목 139건), 각 적용기준·비고
- 수술비와 **데이터·검색함수·답변 지시문을 분리**했다. 화면만 하나로 쓴다.
- "○○ 몇 급?" 질문은 AI 없이 급수표에서 해당 항목을 **급수별로 전부 나열**한다. 골절·탈구 질문이면 **수술 여부에 따른 급수 조정기준**(보존치료 −2급, 핀고정 −1급, 개방성 +1급 등)을 함께 보여준다.
- 위자료·노동능력상실률 구간표처럼 PDF에서 열이 갈라진 표는 원문 짝대로 재구성했다. 자주 묻는 금액표는 독립 청크로 한 번 더 넣었다.
- 데이터를 추가할 때는 `scripts/auto-rag/extract.mjs`로 쪽 범위를 뽑고, 청크 JSON을 만든 뒤 `node --env-file=.env scripts/auto-rag/ingest.mjs <json>`으로 넣는다. id 기준 upsert라 다시 넣어도 중복되지 않는다. `chunk-kb-60-89.mjs`는 60~89쪽 배치 전용이라 다른 쪽에는 그대로 쓰지 말 것.
- 로컬 빠른 확인: `npx tsx --env-file=.env scripts/auto-rag/try.ts "질문"`

## 5. 남은 과제 (우선순위 순)

1. **자동차보험 짧은 질문 검색 약함.** 배포본에서 "음주운전 차량 동승 감액비율은?"에 "확인되지 않습니다"가 나왔다. "음주운전 차량에 동승하면 감액비율이 얼마인가요?"는 정답(40%)이 나온다. 의미 검색 상위 결과에 별표4가 안 걸리는 문제로 보인다. 키워드 보조 검색이나 match_count 확대를 검토한다.
2. **띄어쓰기 차이로 급수 항목 누락.** "대퇴골"로 찾으면 약관상 "대퇴 골두 골절"(상해 2급 10호)이 빠진다. 공백을 제거한 비교 컬럼이나 동의어 처리가 필요하다.
3. **소식지 "준비중" 해제 여부 결정.** 변호사 상담으로 사용 가능해졌다. 교안은 여전히 닫아 둘지 확인이 필요하다.
4. 자동차보험 약관 추가 범위 (60~89쪽 외 본문 조항 등)는 사용자가 쪽 번호를 지정하면 진행한다.
5. 참고 아이디어: angle.im 보험 데모처럼 3단 대시보드(목표 트리 / AI 활동 피드 / 결재 대기 카드 + 하단 KPI 스파크라인)로 개편하는 것. 가능 여부만 확인했고 착수는 안 했다.

## 6. 사용자 작업 방식 메모

- 한국어로 대화한다. 비개발자라 단계별·클릭 위치까지 설명하는 걸 선호한다.
- 변경 후 GitHub push → Vercel 자동 배포까지 해 주는 걸 기대한다. 단, 배포 전에 외부 준비(DB, 키)가 필요하면 먼저 알려 준다.
- 큰 데이터는 사용자가 범위(PDF 쪽 번호 등)를 지정해 준다.
- 정부지원금 관계로 2026-10-29부터 약 2개월간 새 Claude 계정에서 OnYourLabs 작업을 진행한다.
