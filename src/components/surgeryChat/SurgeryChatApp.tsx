import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageCircleQuestion, Loader2, FileSearch, ChevronDown } from 'lucide-react';

// 답변 커버 범위인 10개 보험사 (헤더의 "보험사 목록" 토글에서 펼쳐 보여줌)
const COVERED_INSURERS = [
  'DB손해보험', 'KB손해보험', '교보생명', '메리츠', '미래에셋생명',
  '삼성생명', '삼성화재', '신한라이프', '한화생명', '현대해상',
];

interface Source {
  category?: string;
  table?: string;
  surgery_name?: string;
  surgery_class?: string;
  section?: string;
  title?: string;
  grade?: number | null;
  amount?: string | null;
  page?: number | null;
  similarity?: number;
}

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  sources?: Source[];
  isError?: boolean;
}

type Domain = 'surgery' | 'auto';

const DOMAINS: Record<Domain, {
  label: string;
  endpoint: string;
  title: string;
  badge: string;
  desc: string;
  placeholder: string;
  emptyHint: string;
  samples: string[];
}> = {
  surgery: {
    label: '수술비',
    endpoint: '/api/rag/ask',
    title: '수술비 약관 RAG 챗봇',
    badge: '1-5종 / 1-8종 수술비 특약 전용',
    desc: '10개 보험사 수술비 특약 약관 원문 기반으로 답변합니다.',
    placeholder: '궁금한 수술비 약관 내용을 물어보세요',
    emptyHint: '예: "OO수술 몇 종이야?", "삼성생명이랑 메리츠 동시수술 기준 비교"',
    samples: [
      '치질 수술은 몇 종 수술인가요?',
      '유방 절제술은 별표61 기준으로 몇 종인가요?',
      '삼성생명이랑 메리츠는 동시수술 지급 기준이 어떻게 다른가요?',
      '요실금 수술은 누가 청구할 수 있나요?',
      '보험사별로 척추 수술 종수를 비교해줘',
    ],
  },
  auto: {
    label: '자동차보험',
    endpoint: '/api/rag/auto',
    title: '자동차보험 약관 RAG 챗봇',
    badge: 'KB손해보험 개인용 보통약관 별표',
    desc: '대인·대물 지급기준, 과실상계, 동승자 감액, 자기신체사고, 상해·후유장애 급수표 기반으로 답변합니다.',
    placeholder: '궁금한 자동차보험 약관 내용을 물어보세요',
    emptyHint: '예: "대퇴골 골절 상해 몇 급?", "부상 위자료 5급은 얼마?"',
    samples: [
      '대퇴골 골절은 상해 몇 급인가요?',
      '부상 위자료 5급은 얼마인가요?',
      '사망 시 위자료는 나이에 따라 어떻게 달라지나요?',
      '음주운전 차량에 동승하면 감액비율이 얼마인가요?',
      '자기신체사고 후유장애 3급, 가입금액 1억원이면 얼마 받나요?',
    ],
  },
};

const formatSource = (s: Source) =>
  s.title
    ? `${s.title}${s.amount ? ` · ${s.amount}` : ''}${s.page ? ` (약관 ${s.page}쪽)` : ''}`
    : `${s.category}${s.table ? ` (${s.table})` : ''}${s.surgery_name ? ` ${s.surgery_name}` : ''}${s.surgery_class ? ` [${s.surgery_class}종]` : ''}`;

export default function SurgeryChatApp() {
  const [domain, setDomain] = useState<Domain>('surgery');
  const [histories, setHistories] = useState<Record<Domain, ChatMessage[]>>({ surgery: [], auto: [] });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInsurers, setShowInsurers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cfg = DOMAINS[domain];
  const messages = histories[domain];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    const target = domain;
    const append = (m: ChatMessage) => setHistories(prev => ({ ...prev, [target]: [...prev[target], m] }));

    append({ role: 'user', text: q });
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(DOMAINS[target].endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (data.error) {
        append({ role: 'bot', text: data.error, isError: true });
      } else {
        append({ role: 'bot', text: data.answer, sources: data.sources });
      }
    } catch (err: any) {
      append({ role: 'bot', text: '오류: ' + (err?.message || '요청에 실패했습니다.'), isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/60 bg-gradient-to-r from-[#0d2461] to-[#0a1e52] shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-black text-white flex items-center gap-2 flex-wrap">
            <MessageCircleQuestion className="w-4 h-4 text-[#0abde3] shrink-0" />
            {cfg.title}
            <span className="text-[10px] font-bold text-[#0abde3] bg-white/10 px-2 py-0.5 rounded-full">{cfg.badge}</span>
          </h2>
          <div className="flex bg-white/10 p-0.5 rounded-lg shrink-0">
            {(Object.keys(DOMAINS) as Domain[]).map(d => (
              <button
                key={d}
                onClick={() => !loading && setDomain(d)}
                disabled={loading}
                className={`text-[11px] font-extrabold px-3 py-1 rounded-md transition cursor-pointer disabled:cursor-default ${
                  domain === d ? 'bg-white text-[#0d2461]' : 'text-white/60 hover:text-white'
                }`}
              >
                {DOMAINS[d].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-[11px] text-white/50 font-semibold">{cfg.desc}</p>
          {domain === 'surgery' && (
            <button
              onClick={() => setShowInsurers(v => !v)}
              className="text-[10px] font-extrabold text-[#0abde3] hover:text-white transition cursor-pointer flex items-center gap-0.5 shrink-0"
            >
              보험사 목록
              <ChevronDown className={`w-3 h-3 transition-transform ${showInsurers ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        {domain === 'surgery' && showInsurers && (
          <div className="mt-2 flex flex-wrap gap-1">
            {COVERED_INSURERS.map(name => (
              <span key={name} className="text-[9px] font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded-full">
                {name}
              </span>
            ))}
            <p className="w-full text-[9px] text-white/35 font-semibold mt-1">
              * 이 10개사 1-5종/1-8종 수술비 특약 분류 외 담보는 답변 대상이 아닙니다.
            </p>
          </div>
        )}
      </div>

      {/* Sample questions */}
      <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
        {cfg.samples.map(q => (
          <button
            key={q}
            onClick={() => ask(q)}
            disabled={loading}
            className="text-[11px] font-bold bg-white border border-slate-200 text-slate-600 rounded-full px-3 py-1.5 hover:border-[#0abde3] hover:text-[#0891b2] transition cursor-pointer disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2 py-10">
            <FileSearch className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-semibold">{cfg.placeholder}.</p>
            <p className="text-[10px] text-slate-350">{cfg.emptyHint}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#0d2461] text-white font-semibold'
                  : m.isError
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                    : 'bg-slate-100 text-slate-800 font-medium'
              }`}
            >
              {m.text}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10px] text-slate-500 font-semibold space-y-0.5">
                  <p className="text-slate-400 font-bold">참고 문서</p>
                  {m.sources.slice(0, 8).map((s, si) => (
                    <p key={si}>• {formatSource(s)}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              약관 검색 및 답변 생성 중...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-5 py-4 border-t border-slate-200/60 bg-white shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={cfg.placeholder}
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0abde3] focus:bg-white transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[#0abde3] hover:bg-[#0891b2] disabled:opacity-40 disabled:cursor-default text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          전송
        </button>
      </form>
    </div>
  );
}
