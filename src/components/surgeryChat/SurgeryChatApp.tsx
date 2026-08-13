import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageCircleQuestion, Loader2, FileSearch } from 'lucide-react';

interface Source {
  category?: string;
  table?: string;
  surgery_name?: string;
  surgery_class?: string;
  similarity?: number;
}

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  sources?: Source[];
  isError?: boolean;
}

// 원클릭 예시 질문 (rag-pipeline 테스트 페이지에서 쓰던 예시를 그대로 재사용)
const SAMPLE_QUESTIONS = [
  '치질 수술은 몇 종 수술인가요?',
  '유방 절제술은 별표61 기준으로 몇 종인가요?',
  '삼성생명이랑 메리츠는 동시수술 지급 기준이 어떻게 다른가요?',
  '요실금 수술은 누가 청구할 수 있나요?',
  '보험사별로 척추 수술 종수를 비교해줘',
];

export default function SurgeryChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'bot', text: data.error, isError: true }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: data.answer, sources: data.sources }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'bot', text: '오류: ' + (err?.message || '요청에 실패했습니다.'), isError: true }]);
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
        <h2 className="text-sm font-black text-white flex items-center gap-2">
          <MessageCircleQuestion className="w-4 h-4 text-[#0abde3]" />
          수술비 약관 RAG 챗봇
        </h2>
        <p className="text-[11px] text-white/50 mt-1 font-semibold">
          10개 보험사 수술비 특약 약관 원문 기반으로 답변합니다. API 키는 서버에서만 사용되며 화면에 노출되지 않습니다.
        </p>
      </div>

      {/* Sample questions */}
      <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
        {SAMPLE_QUESTIONS.map(q => (
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
            <p className="text-xs font-semibold">궁금한 수술비 약관 내용을 물어보세요.</p>
            <p className="text-[10px] text-slate-350">예: "OO수술 몇 종이야?", "삼성생명이랑 메리츠 동시수술 기준 비교"</p>
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
                    <p key={si}>
                      • {s.category}{s.table ? ` (${s.table})` : ''}{s.surgery_name ? ` ${s.surgery_name}` : ''}{s.surgery_class ? ` [${s.surgery_class}종]` : ''}
                    </p>
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
          placeholder="궁금한 수술비 약관 내용을 물어보세요"
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
