import React, { useState } from 'react';
import { Newsletter, NewsletterSummary } from '../types';
import { 
  FileText, 
  Sparkles, 
  Calendar, 
  HardDrive, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink,
  BookOpen,
  XCircle,
  FileDown,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface NewsletterDetailProps {
  file: Newsletter | null;
  googleAccessToken: string | null;
  mode: 'demo' | 'drive';
  analysis: NewsletterSummary | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  onTriggerAnalysis?: () => void;
}

export default function NewsletterDetail({ 
  file, 
  googleAccessToken, 
  mode,
  analysis,
  isAnalyzing,
  analysisError,
  onTriggerAnalysis
}: NewsletterDetailProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'pdf'>('summary');

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm min-h-[450px]">
        <div className="w-16 h-16 bg-red-50/50 border border-red-100 flex items-center justify-center rounded-2xl text-[#FF4B4B] mb-4 animate-pulse">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800">조회할 소식지를 선택해 주세요</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          좌측 목록에서 열람하고자 하는 소식지를 클릭하면, 핵심 상품 특징 요약 및 원본 PDF 뷰어가 제공됩니다.
        </p>
      </div>
    );
  }

  // Determine PDF access URL
  const pdfUrl = mode === 'drive' && googleAccessToken
    ? `/api/proxy/pdf?fileId=${file.id}&accessToken=${encodeURIComponent(googleAccessToken)}`
    : (file.demoPdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

  // If currently analyzing with Gemini
  if (isAnalyzing) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
        {/* Skeleton Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded-full w-24"></div>
            <div className="h-6 bg-slate-200 rounded-md w-64 md:w-96"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded-xl w-28"></div>
        </div>

        {/* Dynamic Loading Body */}
        <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-6">
          <div className="relative flex justify-center items-center">
            {/* Pulsing AI Energy Outer Ring */}
            <div className="absolute w-24 h-24 rounded-full border border-[#FF4B4B]/30 animate-pulse"></div>
            {/* Spinning Hexagon Ring */}
            <div className="w-16 h-16 bg-red-50 border border-[#FF4B4B]/20 flex items-center justify-center rounded-2xl text-[#FF4B4B] animate-spin [animation-duration:4s]">
              <Cpu className="w-8 h-8 text-[#FF4B4B]" />
            </div>
          </div>

          <div className="space-y-2.5 max-w-sm">
            <h3 className="text-sm font-black text-slate-800 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF4B4B] animate-bounce" />
              Gemini 3.5 Flash 실시간 심층 분석 중
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              구글 드라이브 원본 PDF 내용을 분석 중입니다. 신상품 특징, 핵심 담보 변동 조항 및 현장 제안 꿀팁을 생성하고 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-full text-[10px] font-mono text-slate-450 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
            <span>파일 ID: {file.id.substring(0, 10)}... 해독 중</span>
          </div>
        </div>
      </div>
    );
  }

  // If analysis encountered an error
  if (analysisError) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
        {/* Error Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] uppercase font-bold bg-rose-50 text-rose-600 px-2 rounded-full border border-rose-100">AI 분석 지연</span>
            <span className="text-[10px] text-slate-400 font-mono">File ID: {file.id.substring(0,10)}</span>
          </div>
          <h2 className="text-md font-black text-slate-800 truncate">{file.name}</h2>
        </div>

        {/* Error Content */}
        <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 border border-rose-100/80 rounded-2xl flex items-center justify-center text-[#FF4B4B] shadow-sm">
            <XCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="text-xs font-black text-slate-800">실시간 Gemini AI 분석을 시작하지 못했습니다</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {analysisError}
            </p>
            <p className="text-[10px] text-slate-400">
              ※ 이 대시보드는 보안 환경을 준수해 구글 드라이브로부터 문서를 실시간 해독합니다. API KEY 주입 상태를 다시 살펴주십시오.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {onTriggerAnalysis && (
              <button
                onClick={onTriggerAnalysis}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4.5 py-2 rounded-xl text-xs cursor-pointer shadow-sm transition"
              >
                재분석 요청하기
              </button>
            )}
            <button
              onClick={() => setActiveTab('pdf')}
              className="bg-white hover:bg-slate-50 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer border border-slate-200 transition"
            >
              우선 원본 PDF 열람
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use dynamic analysis summary if cached, else default to file summary
  const isRealtimeAnalyzed = !!analysis;
  const displaySummary: NewsletterSummary = analysis || file.summary;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full font-sans animate-fade-in" id="newsletter-detail-panel">
      
      {/* Detail Header */}
      <div className="p-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
              file.folder === '생명보험' 
                ? 'bg-blue-50/80 text-blue-600 border-blue-150' 
                : 'bg-teal-50/80 text-teal-600 border-teal-150'
            }`}>
              {file.folder === '생명보험' ? '🧬 생명보험' : '🛡️ 손해보험'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">File ID: {file.id.substring(0, 10)}</span>
            {isRealtimeAnalyzed && (
              <span className="flex items-center gap-1 text-[9px] font-black bg-rose-50 text-[#FF4B4B] border border-rose-150 rounded-full px-2 py-0.5 animate-pulse">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 실시간 분석 완료
              </span>
            )}
          </div>
          <h2 className="text-lg font-black text-slate-800 leading-tight">
            {file.name}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {mode === 'drive' && (
            <a
              href={`https://drive.google.com/open?id=${file.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition border border-slate-200 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>드라이브에서 열기</span>
            </a>
          )}
          <a
            href={pdfUrl}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#FF4B4B] hover:bg-red-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow-md shadow-red-100 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF 다운로드</span>
          </a>
        </div>
      </div>

      {/* Meta Indicators Grid (Streamlit style metrics formatted in Bento cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-100 bg-slate-50/40 select-none">
        <div className="p-4.5 border-r border-slate-100/90 text-center lg:text-left">
          <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-0.5">보험 제조사</p>
          <p className="text-xs font-black text-slate-800">{file.insurer}</p>
        </div>
        <div className="p-4.5 border-r border-slate-100/90 text-center lg:text-left">
          <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-0.5">발행 연월</p>
          <p className="text-xs font-bold text-slate-800 flex items-center justify-center lg:justify-start gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {file.publishMonth}
          </p>
        </div>
        <div className="p-4.5 border-r border-slate-100/90 text-center lg:text-left">
          <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-0.5">파일 크기</p>
          <p className="text-xs font-bold text-slate-800 flex items-center justify-center lg:justify-start gap-1">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            {file.size}
          </p>
        </div>
        <div className="p-4.5 text-center lg:text-left">
          <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-0.5">수정 일시</p>
          <p className="text-[11px] font-mono font-medium text-slate-500 block mt-0.5 leading-none">{file.modifiedTime}</p>
        </div>
      </div>

      {/* Embedded Tabs styled like a Slider Switch */}
      <div className="bg-slate-50/55 p-1.5 border-b border-slate-150/60 flex gap-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 text-xs font-extrabold text-center transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl ${
            activeTab === 'summary'
              ? 'bg-white text-[#FF4B4B] shadow-xs border border-slate-200/40 font-black'
              : 'text-slate-450 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 요점 분석 및 셀링포인트
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 py-2 text-xs font-extrabold text-center transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl ${
            activeTab === 'pdf'
              ? 'bg-white text-[#FF4B4B] shadow-xs border border-slate-200/40 font-black'
              : 'text-slate-450 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          원본 PDF 바로보기 (Viewer)
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white min-h-[400px]">
        {activeTab === 'summary' ? (
          <div className="space-y-6">
            
            {/* Gemini AI Trigger Banner for unanalyzed documents */}
            {!isRealtimeAnalyzed && (
              <div className="bg-rose-50/75 border border-rose-150 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in mb-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 bg-red-105 border border-red-200 flex items-center justify-center rounded-xl text-[#FF4B4B] shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-extrabold text-slate-800 text-xs md:text-sm">
                      Gemini 3.5 Flash 실시간 심층 분석 대기 중
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      소식지 원본 PDF 본문을 정밀 해독하여 핵심 개정 요약 정보와 현장 3대 영업 셀링 포인트를 실시간으로 추출할 수 있습니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onTriggerAnalysis}
                  className="shrink-0 flex items-center gap-1.5 bg-[#FF4B4B] hover:bg-red-600 text-white font-black px-4.5 py-2.5 rounded-xl text-xs transition shadow-md shadow-red-100 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>실시간 AI 분석 실행하기</span>
                </button>
              </div>
            )}

            {/* Streamlit Custom Alert Box: st.info() style */}
            <div className="bg-slate-50 border-l-4 border-[#ff4b4b] rounded-r-2xl p-4.5 flex gap-3.5 text-sm text-slate-700">
              <span className="text-xl mt-0.5">📢</span>
              <div className="space-y-1">
                <p className="font-extrabold text-slate-900">{displaySummary.title}</p>
                <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                  본 분석자료는 실제 소식지를 기반으로 하여 실시간 추출한 최신 리서치 세일즈 가이드라인입니다. 상품 비교 및 가치 전파 가이드로 활용하시길 바랍니다.
                </p>
              </div>
            </div>

            {/* Highlights (st.subheader) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 select-none">
                <span>⚡</span> 3대 핵심 개정안내 (Highlights)
              </h3>
              <ul className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 shadow-xs">
                {displaySummary.highlights && displaySummary.highlights.map((hl, idx) => (
                  <li key={idx} className="text-xs text-slate-700 leading-relaxed flex gap-2">
                    <span className="text-[#FF4B4B] font-extrabold font-mono font-bold">{(idx + 1).toString().padStart(2, '0')}.</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products Details */}
            <div className="space-y-3.5 animate-fade-in">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 select-none">
                <span>🎯</span> 주력 추천 상품 포커스
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {displaySummary.mainProducts && displaySummary.mainProducts.map((prod, idx) => (
                  <div key={idx} className="border border-slate-200/70 rounded-2xl p-5 space-y-3.5 hover:border-slate-300 transition-colors bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        {prod.name}
                      </h4>
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">Feature #{idx+1}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2.5">
                        <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          <span>📌</span> 주요 특장점
                        </p>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-600 font-semibold">
                          {prod.features && prod.features.map((f, fIdx) => (
                            <li key={fIdx}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span>🎯</span> 추천 대상고객
                          </p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed pl-1 font-semibold">{prod.target}</p>
                        </div>
                        <div className="border-t border-slate-100 pt-2">
                          <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span>🎁</span> 판매 가치제안 (Benefit)
                          </p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed pl-1 font-semibold">{prod.benefit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Points */}
            <div className="space-y-2.5 bg-red-50/30 p-5 rounded-2xl border border-red-100/50">
              <h3 className="text-xs font-black text-[#FF4B4B] flex items-center gap-1.5 select-none">
                <TrendingUp className="w-4 h-4 text-[#FF4B4B]" />
                현장 우수 상담 기법 (Sales Pitch Tip)
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-black whitespace-pre-line">
                {displaySummary.salesPoint}
              </p>
            </div>

            {/* Warn / Notes */}
            {displaySummary.notes && (
              <div className="text-[11px] text-slate-400 bg-slate-50 rounded-xl p-3.5 italic border border-slate-100 font-mono leading-relaxed select-none">
                {displaySummary.notes}
              </div>
            )}

            {/* Manual Re-analysis Trigger */}
            {mode === 'drive' && googleAccessToken && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={onTriggerAnalysis}
                  className="flex items-center gap-1.5 text-slate-450 hover:text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[11px] transition border border-dashed border-slate-200 hover:border-slate-350 bg-white cursor-pointer select-none"
                >
                  <Cpu className="w-3.5 h-3.5 text-[#FF4B4B]" />
                  <span>소식지 AI 다시 실시간 분석하기</span>
                </button>
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col space-y-3 h-[500px]">
            {mode === 'drive' && !googleAccessToken ? (
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-3.5 bg-slate-50">
                <XCircle className="w-10 h-10 text-amber-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">구글 로그인이 필요합니다</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    실제 구글 드라이브 보안에 의해 보호받고 있는 PDF 파일입니다. 좌측의 구글 대시보드 로그인 후 프록시를 통해 다이렉트 뷰어로 감상할 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 w-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-none absolute inset-0"
                  title={`PDF Viewer: ${file.name}`}
                  allowFullScreen
                />
              </div>
            )}
            <p className="text-[10px] text-slate-400 text-center font-mono select-none">
              ※ 구글 드라이브 API PDF 프록시 스트림 뷰어로 렌더링 중입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
