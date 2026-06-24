import React, { useState } from 'react';
import { GoogleUser } from '../types';
import { 
  FolderLock, 
  Layers, 
  FileText, 
  Info, 
  LogOut, 
  Search, 
  Filter, 
  HelpCircle, 
  CheckCircle,
  Database,
  ExternalLink,
  Activity,
  Stethoscope,
  Bookmark
} from 'lucide-react';

interface SidebarProps {
  mode: 'demo' | 'drive';
  setMode: (mode: 'demo' | 'drive') => void;
  googleUser: GoogleUser | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  selectedCategory: 'all' | '생명보험' | '손해보험';
  setSelectedCategory: (cat: 'all' | '생명보험' | '손해보험') => void;
  selectedInsurer: string;
  setSelectedInsurer: (insurer: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  insurersList: string[];
  hasLifeFolder: boolean;
  hasNonLifeFolder: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function Sidebar({
  mode,
  setMode,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  selectedCategory,
  setSelectedCategory,
  selectedInsurer,
  setSelectedInsurer,
  searchTerm,
  setSearchTerm,
  insurersList,
  hasLifeFolder,
  hasNonLifeFolder,
  refreshing,
  onRefresh,
}: SidebarProps) {
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  const [showKcdHelper, setShowKcdHelper] = useState(false);
  const [kcdSearchTerm, setKcdSearchTerm] = useState('');
  const [activeKcdCategory, setActiveKcdCategory] = useState<'all' | 'cancer' | 'brain' | 'heart'>('all');

  const kcdFastData = [
    { code: 'C16', name: '위암 (위의 악성 신생물)', type: 'cancer' },
    { code: 'C34', name: '폐암 (기관지 및 폐)', type: 'cancer' },
    { code: 'C50', name: '유방암', type: 'cancer' },
    { code: 'D01', name: '대장점막내암 (제자리암)', type: 'cancer' },
    { code: 'I63', name: '뇌경색증 (설계다빈도)', type: 'brain' },
    { code: 'I60', name: '지주막하출혈', type: 'brain' },
    { code: 'I61', name: '뇌내출혈', type: 'brain' },
    { code: 'I20', name: '협심증 (보장분석 필수)', type: 'heart' },
    { code: 'I21', name: '급성 심근경색증', type: 'heart' },
    { code: 'I25', name: '만성 허혈성 심장병', type: 'heart' },
  ];

  return (
    <aside className="w-80 bg-slate-100/95 text-slate-800 border-r border-slate-200/80 flex flex-col h-full overflow-y-auto select-none font-sans">
      {/* Streamlit Brand Title */}
      <div className="p-6 border-b border-slate-200/80 flex flex-col gap-1.5 bg-slate-100/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF4B4B] rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-slate-800">
            Insurance PDF Explorer
          </h1>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-400">
          <span>Streamlit Engine</span>
          <span>v1.34.0 (포털 전용)</span>
        </div>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Step 1: Mode Configuration */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            ⚙️ 작동 방식 설정
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMode('demo')}
              className={`py-1.5 text-xs font-bold rounded-lg transition px-2 text-center cursor-pointer ${
                mode === 'demo'
                  ? 'bg-white text-[#FF4B4B] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✨ 데모 모드
            </button>
            <button
              onClick={() => setMode('drive')}
              className={`py-1.5 text-xs font-bold rounded-lg transition px-2 text-center cursor-pointer ${
                mode === 'drive'
                  ? 'bg-white text-[#FF4B4B] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🔗 구글 드라이브
            </button>
          </div>
        </div>

        {/* Google Drive Auth Panel */}
        {mode === 'drive' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 block">
                Google Drive 연동
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase transition flex items-center gap-1 ${
                googleUser 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                {googleUser ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    연결됨
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    오프라인
                  </>
                )}
              </span>
            </div>

            {googleUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <img
                    src={googleUser.picture || "https://lh3.googleusercontent.com/a/default-user=s40"}
                    alt={googleUser.name}
                    className="w-8 h-8 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{googleUser.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{googleUser.email}</p>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                  <div className="flex justify-between">
                    <span>📁 생명보험 폴더:</span>
                    <span className={hasLifeFolder ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                      {hasLifeFolder ? "확인됨" : "미발견"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>📁 손해보험 폴더:</span>
                    <span className={hasNonLifeFolder ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                      {hasNonLifeFolder ? "확인됨" : "미발견"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center disabled:opacity-50 shadow-sm"
                  >
                    {refreshing ? "동기화 중..." : "🔄 드라이브 동기화"}
                  </button>
                  <button
                    onClick={onGoogleSignOut}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-2 rounded-xl border border-slate-200 transition cursor-pointer"
                    title="로그아웃"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 leading-relaxed text-left">
                  구글 클라우드 보안 토큰을 활용해 생명보험 및 손해보험 폴더의 PDF 파일에 접근합니다.
                </p>
                <button
                  onClick={onGoogleSignIn}
                  className="w-full bg-[#FF4B4B] hover:bg-red-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold items-center justify-center gap-2 flex transition cursor-pointer shadow-md shadow-red-100"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 48 48">
                    <path fill="currentColor" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="currentColor" opacity="0.9" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="currentColor" opacity="0.8" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="currentColor" opacity="0.95" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Google 로그인 연동</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Main Filters */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 space-y-4 shadow-sm">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            🔍 데이터 필터설정
          </label>

          {/* Search Term */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              소식지 제목 검색
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="예: 삼성생명, 5월..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-400 focus:bg-white transition"
            />
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              분류 그룹 필터
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 cursor-pointer focus:outline-none focus:bg-white transition"
            >
              <option value="all">📁 전체 영역 보기 (All)</option>
              <option value="생명보험">🧬 생명보험 (Life)</option>
              <option value="손해보험">🛡️ 손해보험 (Non-Life)</option>
            </select>
          </div>

          {/* Insurer Filter */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              보장 보험사 지정
            </span>
            <select
              value={selectedInsurer}
              onChange={(e) => setSelectedInsurer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 cursor-pointer focus:outline-none focus:bg-white transition"
            >
              <option value="all">🏢 전체 보험사 대상</option>
              {insurersList.map(inf => (
                <option key={inf} value={inf}>{inf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KCD-8 질병사인분류 연동 도우미 한국어 위젯 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-sm" id="kcd-helper-widget">
          <div className="flex items-center justify-between border-b border-rose-50 pb-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-[#FF4B4B]" />
              🩺 KCD-8 질병코드 연동기
            </span>
            <button
              onClick={() => setShowKcdHelper(!showKcdHelper)}
              className="text-[10px] text-slate-400 font-bold hover:text-slate-700 transition cursor-pointer"
            >
              {showKcdHelper ? "간단히" : "도움말"}
            </button>
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              KCD 8차 표준 공식 포털 연계 위젯입니다. 질병명을 검색하여 직접 매칭하고 설계 가이드에 활용하세요.
            </p>

            {/* Quick Link Button */}
            <a
              href="https://www.koicd.kr/kcd/kcd.do?degree=08"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition text-[#FF4B4B] cursor-pointer"
            >
              <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                KCD-8차 공식 포털 바로가기
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-[#FF4B4B]" />
            </a>

            {/* Simulated Search & Outer Portal Action */}
            <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
                🔍 질병코드 / 검색어
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={kcdSearchTerm}
                  onChange={(e) => setKcdSearchTerm(e.target.value)}
                  placeholder="예: 암, 뇌경색, 협심증..."
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (!kcdSearchTerm.trim()) {
                      alert("검색어를 입력해 주세요!");
                      return;
                    }
                    const searchUrl = `https://www.koicd.kr/kcd/kcd.do?degree=08&searchWord=${encodeURIComponent(kcdSearchTerm.trim())}`;
                    window.open(searchUrl, '_blank');
                  }}
                  className="bg-[#FF4B4B] hover:bg-red-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs transition cursor-pointer shrink-0"
                >
                  포털 검색
                </button>
              </div>
            </div>

            {/* 3대 질병 다빈도 퀵 매칭보드 */}
            <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5 select-none">
                  <Bookmark className="w-3 h-3 text-[#FF4B4B]" />
                  3대 질병 다빈도 담보 코드
                </span>
                <span className="text-[9px] text-[#FF4B4B] font-mono font-bold uppercase font-bold">kcd-8차</span>
              </div>

              {/* Category mini Tabs */}
              <div className="grid grid-cols-4 gap-0.5 bg-slate-100 p-0.5 rounded-lg select-none">
                {(['all', 'cancer', 'brain', 'heart'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveKcdCategory(cat)}
                    className={`text-[9px] font-black py-0.5 rounded transition cursor-pointer ${
                      activeKcdCategory === cat
                        ? 'bg-[#FF4B4B] text-white font-bold'
                        : 'text-slate-400 hover:text-slate-700 font-bold'
                    }`}
                  >
                    {cat === 'all' ? '전체' : cat === 'cancer' ? '암' : cat === 'brain' ? '뇌' : '심장'}
                  </button>
                ))}
              </div>

              {/* Filtered Code Items list */}
              <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {kcdFastData
                  .filter(item => activeKcdCategory === 'all' || item.type === activeKcdCategory)
                  .map((item, id) => (
                    <div
                      key={id}
                      onClick={() => {
                        setKcdSearchTerm(item.code);
                        const searchUrl = `https://www.koicd.kr/kcd/kcd.do?degree=08&searchWord=${item.code}`;
                        window.open(searchUrl, '_blank');
                      }}
                      className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg hover:border-red-200 hover:bg-[#FF4B4B]/5 transition text-left cursor-pointer group"
                      title="클릭 시 공식 포털에서 원문 조회"
                    >
                      <div className="flex items-center gap-1.5 text-left">
                        <span className={`text-[9px] leading-none font-black px-1.5 py-0.5 rounded ${
                          item.type === 'cancer' ? 'bg-orange-50 text-orange-600' :
                          item.type === 'brain' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {item.code}
                        </span>
                        <span className="text-[10px] text-slate-600 font-semibold truncate max-w-[130px]">
                          {item.name}
                        </span>
                      </div>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-300 group-hover:text-[#FF4B4B] transition" />
                    </div>
                  ))}
              </div>
            </div>

            {/* Extra Help section */}
            {showKcdHelper && (
              <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] text-slate-500 leading-relaxed space-y-1.5 font-sans animate-fade-in text-left">
                <p className="font-bold text-[#FF4B4B] flex items-center gap-1">
                  <span>💡</span> KCD 매칭 가이드:
                </p>
                <p>
                  한국표준질병사인분류(KCD-8)는 보험금 청구 및 담보 심사 기준이 되는 핵심 분류체계입니다.
                </p>
                <div className="space-y-0.5 pl-1.5 border-l border-slate-200">
                  <p>• <span className="font-bold text-slate-700">C코드</span>: 일반암, 고액암 등 악성종양</p>
                  <p>• <span className="font-bold text-slate-700">D코드</span>: 유사암, 소액암에 주로 해당하는 경계성/제자리암 및 양성종양</p>
                  <p>• <span className="font-bold text-slate-700">I코드</span>: 뇌혈관 및 심장질환 보장 범위 심사 핵심</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Set up help Card inside styling */}
        <div className="bg-[#262730] p-4.5 rounded-2xl shadow-md text-slate-200">
          <button
            onClick={() => setShowSetupHelp(!showSetupHelp)}
            className="w-full flex items-center justify-between text-xs font-bold text-white hover:text-red-300 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#ff4b4b]" />
              드라이브 폴더 가이드
            </span>
            <span className="text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded">{showSetupHelp ? "닫기" : "보기"}</span>
          </button>
          
          {showSetupHelp && (
            <div className="mt-3 text-[11px] text-slate-300 leading-relaxed space-y-2.5 font-sans border-t border-white/10 pt-3">
              <p className="font-bold text-[#FF4B4B]">📁 내 드라이브 연동 구조:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                <li>
                  구글 드라이브 최상위에 <strong className="text-white">생명보험</strong>과 <strong className="text-white">손해보험</strong> 폴더를 만듭니다.
                </li>
                <li>
                  그 아래에 각 보험사 월간 PDF 안내자료를 업로드합니다.
                </li>
                <li>
                  로그인 완료 즉시 보드와 자동 연동을 지원합니다.
                </li>
              </ol>
              <p className="text-slate-400 text-[10px] italic">
                * 띄어쓰기 없이 폴더명을 지정하십시오.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Streamlit Custom Styled Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-200/40 text-center">
        <p className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
          Made with <span className="text-[#ff4b4b] animate-pulse">❤</span> Streamlit Bento Engine
        </p>
        <p className="text-[9px] text-slate-400">
          Google Cloud Partner Authorized
        </p>
      </div>
    </aside>
  );
}
