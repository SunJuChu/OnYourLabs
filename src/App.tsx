import React, { useState, useEffect, useMemo } from 'react';
import { mockNewsletters } from './data/mockNewsletters';
import Sidebar from './components/Sidebar';
import MetricCard from './components/MetricCard';
import NewsletterDetail from './components/NewsletterDetail';
import { Newsletter, GoogleUser, NewsletterSummary } from './types';
import { 
  FileCheck, 
  FolderOpen, 
  RefreshCw, 
  AlertTriangle, 
  HelpCircle,
  Database,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function App() {
  // --- Standard Page Frame vs Popup Detection ---
  // If this window is an OAuth login popup, immediately parse hash and close.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        if (window.opener) {
          // Send token back to parent app page
          window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: accessToken }, '*');
          window.close();
        } else {
          // Fallback: This window itself has redirected Google OAuth. Capture the token directly!
          setGoogleAccessToken(accessToken);
          sessionStorage.setItem('STREAMLIT_GOOGLE_ACCESS_TOKEN', accessToken);
          setSyncError(null);
          // Gently clean the hash without reloading
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    }
  }, []);

  // --- States ---
  const [mode, setMode] = useState<'demo' | 'drive'>('demo');
  const [customClientId, setCustomClientId] = useState<string>(() => {
    return localStorage.getItem('STREAMLIT_GOOGLE_CLIENT_ID') || (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
  });
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('STREAMLIT_GOOGLE_ACCESS_TOKEN') || null;
  });
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isConfiguringClientId, setIsConfiguringClientId] = useState(false);
  
  // Drive Sync States
  const [driveFiles, setDriveFiles] = useState<Newsletter[]>([]);
  const [hasLifeFolder, setHasLifeFolder] = useState(false);
  const [hasNonLifeFolder, setHasNonLifeFolder] = useState(false);
  const [hasEduFolder, setHasEduFolder] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // General Filter States
  const [selectedCategory, setSelectedCategory] = useState<'all' | '생명보험' | '손해보험' | '교육자료'>('all');
  const [selectedInsurer, setSelectedInsurer] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Selection State
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // --- Gemini Real-time AI Analysis States ---
  const [analysisStatus, setAnalysisStatus] = useState<Record<string, {
    loading: boolean;
    error: string | null;
    summary: NewsletterSummary | null;
  }>>({});

  const triggerGeminiAnalysis = async (fileId: string, accessToken: string) => {
    if (analysisStatus[fileId]?.loading) return;

    setAnalysisStatus(prev => ({
      ...prev,
      [fileId]: { loading: true, error: null, summary: null }
    }));

    try {
      console.log(`[Gemini AI Request] 분석 시작... FileID = ${fileId}`);
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId, accessToken })
      });

      if (!response.ok) {
        throw new Error(`AI 분석 서버 연동 실패 (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysisStatus(prev => ({
          ...prev,
          [fileId]: { loading: false, error: null, summary: data.analysis }
        }));
      } else {
        throw new Error(data.error || 'Gemini가 요약 데이터 구조를 추출하지 못했습니다.');
      }
    } catch (err: any) {
      console.error("[Gemini Real-time Analysis Error]:", err);
      setAnalysisStatus(prev => ({
        ...prev,
        [fileId]: { loading: false, error: err.message || '인공지능 로딩 도중 네트워킹 장애가 생겼습니다.', summary: null }
      }));
    }
  };


  // --- Handle OAuth Callback Listener ---
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Allow any origin for development testing, but validate it's Google login success
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.token) {
        const token = event.data.token;
        setGoogleAccessToken(token);
        sessionStorage.setItem('STREAMLIT_GOOGLE_ACCESS_TOKEN', token);
        setSyncError(null);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // --- Save Custom Client ID ---
  const handleSaveClientId = (id: string) => {
    setCustomClientId(id);
    localStorage.setItem('STREAMLIT_GOOGLE_CLIENT_ID', id);
    setIsConfiguringClientId(false);
    // Auto-initiate sign-in popup to avoid extra click
    setTimeout(() => {
      handleGoogleSignIn(id);
    }, 100);
  };

  // --- Fetch User Info when Access Token is available ---
  useEffect(() => {
    if (!googleAccessToken) {
      setGoogleUser(null);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleAccessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGoogleUser({
            name: data.name || '연동 사용자',
            email: data.email || 'joen1224@gmail.com',
            picture: data.picture || ''
          });
        } else {
          console.warn("구글 사용자 정보 획득 실패. 토큰을 유지한 채 기본 계정 정보로 대체합니다.");
          setGoogleUser({
            name: '연동 사용자',
            email: 'joen1224@gmail.com',
            picture: ''
          });
        }
      } catch (err) {
        console.error("사용자 정보 조회 실패:", err);
        setGoogleUser({
          name: '연동 사용자',
          email: 'joen1224@gmail.com',
          picture: ''
        });
      }
    };

    fetchUserInfo();
  }, [googleAccessToken]);

  // --- Core File Listing Logic ---
  const loadDriveFiles = async (token: string) => {
    if (!token) return;
    setRefreshing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/drive/list?accessToken=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 401 || errJson.error === 'TOKEN_EXPIRED') {
          // 토큰 만료 - 자동 로그아웃 후 재로그인 유도
          handleGoogleSignOut();
          throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        }
        throw new Error(errJson.error || `HTTP ${res.status}오류`);
      }
      const data = await res.json();
      if (data.success) {
        setDriveFiles(data.files || []);
        setHasLifeFolder(data.hasLifeFolder);
        setHasNonLifeFolder(data.hasNonLifeFolder);
        setHasEduFolder(data.hasEduFolder || false);
        
        // Auto select first file if current selection is invalid
        if (data.files && data.files.length > 0) {
          setSelectedFileId(data.files[0].id);
        } else {
          setSelectedFileId(null);
        }
      } else {
        throw new Error("구글 드라이브 스캔 결과를 불러오지 못했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setSyncError(err.message || "구글 드라이브 동기화 오류가 발생했습니다.");
    } finally {
      setRefreshing(false);
    }
  };

  // Effect to sync when token changes or when switching to drive mode
  useEffect(() => {
    if (mode === 'drive' && googleAccessToken) {
      loadDriveFiles(googleAccessToken);
    }
  }, [mode, googleAccessToken]);

  // --- Google Sign-In Trigger ---
  const handleGoogleSignIn = (forceClientId?: string) => {
    const clientId = forceClientId || customClientId;
    if (!clientId) {
      setIsConfiguringClientId(true);
      return;
    }

    const redirectUri = window.location.origin;
    const scopes = [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid"
    ];
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `prompt=select_account`;
      
    window.open(authUrl, "GoogleOAuth", "width=600,height=600,status=no,toolbar=no,menubar=no");
  };

  // --- Google Sign-Out Trigger ---
  const handleGoogleSignOut = () => {
    setGoogleAccessToken(null);
    setGoogleUser(null);
    setDriveFiles([]);
    setHasLifeFolder(false);
    setHasNonLifeFolder(false);
    setHasEduFolder(false);
    sessionStorage.removeItem('STREAMLIT_GOOGLE_ACCESS_TOKEN');
  };

  // --- Sync with current Active Dataset ---
  const activeFiles = useMemo(() => {
    return mode === 'drive' ? driveFiles : mockNewsletters;
  }, [mode, driveFiles]);

  // Auto-select first document on mode or folder change
  useEffect(() => {
    if (activeFiles.length > 0) {
      // Check if current selected exists in new list
      const exists = activeFiles.some(f => f.id === selectedFileId);
      if (!exists) {
        setSelectedFileId(activeFiles[0].id);
      }
    } else {
      setSelectedFileId(null);
    }
  }, [activeFiles]);

  // Extract all unique insurers dynamically from active dataset
  const insurersList = useMemo(() => {
    const set = new Set<string>();
    activeFiles.forEach(f => {
      if (f.insurer) set.add(f.insurer);
    });
    return Array.from(set).sort();
  }, [activeFiles]);

  // Apply filters on dataset
  const filteredFiles = useMemo(() => {
    return activeFiles.filter(file => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && file.folder !== selectedCategory) {
        return false;
      }
      // 2. Insurer Filter
      if (selectedInsurer !== 'all' && file.insurer !== selectedInsurer) {
        return false;
      }
      // 3. Search text
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesName = file.name.toLowerCase().includes(query);
        const matchesInsurer = file.insurer.toLowerCase().includes(query);
        const matchesSummary = file.summary.title.toLowerCase().includes(query);
        if (!matchesName && !matchesInsurer && !matchesSummary) {
          return false;
        }
      }
      return true;
    });
  }, [activeFiles, selectedCategory, selectedInsurer, searchTerm]);

  // Selected File Object
  const selectedFile = useMemo(() => {
    return filteredFiles.find(f => f.id === selectedFileId) || filteredFiles[0] || null;
  }, [filteredFiles, selectedFileId]);

  // --- Metric Computations ---
  const metrics = useMemo(() => {
    const totalCount = filteredFiles.length;
    const lifeCount = filteredFiles.filter(f => f.folder === '생명보험').length;
    const nonLifeCount = filteredFiles.filter(f => f.folder === '손해보험').length;
    const eduCount = filteredFiles.filter(f => f.folder === '교육자료').length;
    const isDriveActive = mode === 'drive' && googleAccessToken !== null;
    return {
      total: totalCount,
      life: lifeCount,
      nonLife: nonLifeCount,
      edu: eduCount,
      account: isDriveActive ? googleUser?.email || googleUser?.name || '드라이브 연동' : '데모 사용자'
    };
  }, [filteredFiles, mode, googleAccessToken, googleUser]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. Streamlit Sidebar */}
      <Sidebar
        mode={mode}
        setMode={setMode}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedInsurer={selectedInsurer}
        setSelectedInsurer={setSelectedInsurer}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        insurersList={insurersList}
        hasLifeFolder={hasLifeFolder}
        hasNonLifeFolder={hasNonLifeFolder}
        hasEduFolder={hasEduFolder}
        refreshing={refreshing}
        onRefresh={() => googleAccessToken && loadDriveFiles(googleAccessToken)}
      />

      {/* 2. Main Content Board */}
      <main className="flex-1 overflow-y-auto flex flex-col h-full focus:outline-none">
        
        {/* Top Floating Color Strip mimicking Streamlit */}
        <div className="h-1 w-full bg-gradient-to-r from-[#ff4b4b] via-[#ff6a6a] to-[#ff4b4b] shrink-0" />

        {/* Global Banner and Setup Dialog */}
        {isConfiguringClientId && (
          <div className="m-6 p-6 bg-red-50/50 border border-red-200/60 rounded-3xl shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-[#ff4b4b] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-900">OAuth 크리덴셜 ID 설정 장치</h3>
                <p className="text-[11px] text-slate-650 leading-relaxed font-medium">
                  구글 드라이브와 보드를 직접 연동해 파일을 안전하게 실시간 스캔하려면 구글 클라우드 콘솔(Google Cloud Console)에서 발급한 **클라이언트 ID(Client ID)**가 등록되어야 합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-end max-w-2xl bg-white p-3.5 rounded-2xl border border-red-100">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Input OAuth Client ID:</label>
                <input
                  type="text"
                  placeholder="예: 123456789-abcdefg.apps.googleusercontent.com"
                  defaultValue={customClientId}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 rounded-xl px-3 py-2 text-xs focus:outline-none text-gray-850 focus:ring-1 focus:ring-red-400 transition"
                  id="client-id-input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const input = document.getElementById('client-id-input') as HTMLInputElement;
                    if (input?.value.trim()) {
                      handleSaveClientId(input.value.trim());
                    } else {
                      alert("유효한 클라이언트 ID를 기입해 주십시오.");
                    }
                  }}
                  className="bg-[#ff4b4b] hover:bg-red-650 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer shadow-sm shadow-red-105"
                >
                  저장 및 활성화
                </button>
                <button
                  onClick={() => setIsConfiguringClientId(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-2 px-3.5 rounded-xl transition cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 leading-relaxed bg-red-100/30 p-4 rounded-2xl font-sans space-y-1">
              <p className="font-bold text-red-700">💡 발급방법 요약:</p>
              <p>1. <a href="https://console.cloud.google.com" target="_blank" className="text-red-500 underline font-extrabold">구글 클라우드 콘솔</a> 방문 후 프로젝트 생성</p>
              <p>2. 'OAuth 동의 화면'에서 앱 유형 외부 지정 후 `https://www.googleapis.com/auth/drive.readonly` 스코프 추가</p>
              <p>3. '사용자 인증 정보' 생성에서 **OAuth 클라이언트 ID (웹 애플리케이션)** 발급</p>
              <p>4. 승인된 리디렉션 URI에 현재 앱 도메인 주소(<span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">{window.location.origin}</span>)를 정확히 등록해 주십시오.</p>
            </div>
          </div>
        )}

        {/* Sync Status Banner */}
        {mode === 'drive' && !googleAccessToken && !isConfiguringClientId && (
          <div className="mx-6 mt-6 bg-amber-50/50 border border-amber-200/60 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-black text-slate-800">구글 드라이브 실시간 연동 모드가 선택되었습니다.</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-semibold">
                  좌측 패널에서 구글 로그인을 완료하면 드라이브 내 '생명보험', '손해보험' 폴더의 PDF 파일 목록이 소식지 대시보드에 즉시 실시간 연결됩니다.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              {customClientId ? (
                <button
                  onClick={handleGoogleSignIn}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition shadow-sm cursor-pointer"
                >
                  지금 연동 로그인
                </button>
              ) : (
                <button
                  onClick={() => setIsConfiguringClientId(true)}
                  className="bg-[#ff4b4b] hover:bg-red-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition shadow-sm cursor-pointer shadow-red-100"
                >
                  OAuth 클라이언트 ID 키 등록 장치 열기
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sidebar configured Client ID display if exists */}
        {mode === 'drive' && customClientId && !googleAccessToken && (
          <div className="mx-6 mt-3 flex items-center justify-between bg-slate-100/60 rounded-xl border border-slate-250 px-4 py-2 text-[11px] text-slate-500">
            <span className="truncate max-w-lg">🔑 등록된 클라이언트 ID: <span className="font-mono bg-white border border-slate-200 p-0.5 rounded text-slate-650">{customClientId}</span></span>
            <button 
              onClick={() => setIsConfiguringClientId(true)} 
              className="text-[#ff4b4b] hover:underline font-extrabold cursor-pointer"
            >
              ID 변경
            </button>
          </div>
        )}

        {/* Error Notification */}
        {syncError && (
          <div className="mx-6 mt-6 bg-rose-50/50 border border-rose-200/50 rounded-2xl p-5 flex gap-3.5 text-xs text-rose-800 shadow-sm animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-rose-900">연동 오류가 감지되었습니다</p>
              <p className="leading-relaxed font-semibold">{syncError}</p>
              <p className="text-[10px] text-slate-500 mt-1.5 font-sans">
                💡 조치 요령: 구글 클라우드 콘솔의 OAuth 클라이언트 설정에서 리디렉션 URI가 <span className="underline font-bold text-slate-700">{window.location.origin}</span> 로 오타 없이 명시되었는지 점검바랍니다.
              </p>
            </div>
          </div>
        )}

        {/* Main Body Grid Layout */}
        <div className="p-6 space-y-6 flex-1 flex flex-col">
          
          {/* Dashboard Title Panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight select-none">
                {mode === 'drive' ? '📁 구글 드라이브 동기화 소식지 리서치보드' : '✨ 보험사 월간 핵심 소식지 분석 대시보드'}
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                {mode === 'drive' 
                  ? '구글 드라이브 클라우드 폴더로부터 실시간으로 수집 가공된 최신 뉴스레터 솔루션입니다.' 
                  : '등록된 최신 생명보험 및 손해보험 월간 개정 이슈 일람과 주력 상품에 최적화된 마케팅 기법을 한데 모았습니다.'}
              </p>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap">
              {/* User Account Status Indicator (Top Right Badge) */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold shadow-xs select-none">
                <div className={`w-2 h-2 rounded-full ${googleUser ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`} />
                <span className="text-slate-400 font-extrabold uppercase text-[10px]">사용자:</span>
                <span className="text-slate-705 font-semibold">{googleUser ? googleUser.email : '데모 사용자'}</span>
              </div>

              {/* Sync Refresh Status indicator */}
              {mode === 'drive' && googleAccessToken && (
                <button
                  onClick={() => loadDriveFiles(googleAccessToken)}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
                  <span>{refreshing ? "동기화 스캔 중..." : "새로고침 및 검색"}</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Metrics Row (Exactly resembling st.metric) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="총 소식지 파일"
              value={`${metrics.total}개`}
              delta={mode === 'drive' ? (refreshing ? '스캔중...' : '0.00%') : '+2'}
              deltaType={mode === 'drive' ? 'neutral' : 'increase'}
              icon={<FileCheck className="w-4 h-4 text-slate-400" />}
            />
            <MetricCard
              label="🧬 생명보험 리서치"
              value={`${metrics.life}개`}
              delta={mode === 'drive' ? '-' : '+1'}
              deltaType={mode === 'drive' ? 'neutral' : 'increase'}
              icon={<Layers className="w-4 h-4 text-slate-400" />}
            />
            <MetricCard
              label="🛡️ 손해보험 리서치"
              value={`${metrics.nonLife}개`}
              delta={mode === 'drive' ? '-' : '+1'}
              deltaType={mode === 'drive' ? 'neutral' : 'increase'}
              icon={<FolderOpen className="w-4 h-4 text-slate-400" />}
            />
            <MetricCard
              label="📚 교육자료"
              value={`${metrics.edu}개`}
              delta={mode === 'drive' ? '-' : '-'}
              deltaType="neutral"
              icon={<ArrowRight className="w-4 h-4 text-slate-400" />}
            />
            <MetricCard
              label="활성 세션 계정"
              value={metrics.account}
              delta={mode === 'drive' ? '구글 연결중' : '로컬 오프라인'}
              deltaType="neutral"
              icon={<Sparkles className="w-4 h-4 text-[#ff4b4b]" />}
            />
          </div>

          {/* 4. Column Split Workspace: Master list on left, Details/Iframe on right */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-1 items-start">
            
            {/* Master Document List (2 of 5 cols) */}
            <div className="xl:col-span-2 space-y-4 h-full">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  소식지 문서 파일 목록 ({filteredFiles.length}개 발견)
                </h3>
                {searchTerm && (
                  <span className="text-[9px] bg-red-100 text-[#ff4b4b] px-2.5 py-0.5 rounded-full font-extrabold tracking-wide">
                    필터링 활성
                  </span>
                )}
              </div>

              {filteredFiles.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3.5 shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">포착된 소식지가 존재하지 않습니다</h4>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed mt-1 font-medium">
                      {mode === 'drive' 
                        ? "구글 드라이브 '생명보험' 또는 '손해보험' 폴더 구조에 PDF 파일이 비어있거나, 필터 범위를 만족하는 파일명이 없습니다." 
                        : "설정 범위를 충족하는 가용한 로컬 소식지 데이터가 존재하지 않습니다."}
                    </p>
                  </div>
                  {mode === 'drive' && (
                    <button
                      onClick={() => googleAccessToken && loadDriveFiles(googleAccessToken)}
                      className="bg-slate-905 hover:bg-slate-800 text-white rounded-xl px-3 py-1.5 cursor-pointer text-[10px] font-extrabold"
                    >
                      다시 정적스캔 시도
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFileId === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => setSelectedFileId(file.id)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex justify-between gap-3 select-none ${
                          isSelected
                            ? 'bg-red-50/30 border-[#ff4b4b] shadow-xs scale-[1.01]'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/40'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-400 font-mono tracking-wider">
                            {file.insurer} · {file.publishMonth}
                          </p>
                          <h4 className={`text-xs font-extrabold truncate leading-tight ${
                            isSelected ? 'text-[#ff4b4b]' : 'text-slate-800'
                          }`}>
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {file.folder}
                            </span>
                            <span className="font-mono text-slate-400">{file.size}</span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end">
                          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${
                            isSelected ? 'text-[#ff4b4b] translate-x-1' : 'text-slate-400'
                          }`} />
                          <span className="text-[8px] text-[#FF4B4B] font-mono shrink-0">
                            {file.modifiedTime.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Newsletter Detail View Panel (3 of 5 cols) */}
            <div className="xl:col-span-3 h-full">
              <NewsletterDetail
                file={selectedFile}
                googleAccessToken={googleAccessToken}
                mode={mode}
                analysis={selectedFileId ? (analysisStatus[selectedFileId]?.summary || null) : null}
                isAnalyzing={selectedFileId ? (!!analysisStatus[selectedFileId]?.loading) : false}
                analysisError={selectedFileId ? (analysisStatus[selectedFileId]?.error || null) : null}
                onTriggerAnalysis={() => {
                  if (selectedFileId) {
                    const token = googleAccessToken || "demo_token";
                    setAnalysisStatus(prev => {
                      const updated = { ...prev };
                      delete updated[selectedFileId];
                      return updated;
                    });
                    setTimeout(() => {
                      triggerGeminiAnalysis(selectedFileId, token);
                    }, 50);
                  }
                }}
              />
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
