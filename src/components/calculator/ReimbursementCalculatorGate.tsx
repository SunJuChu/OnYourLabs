import React from 'react';
import { Lock } from 'lucide-react';
import ReimbursementCalculatorApp from './ReimbursementCalculatorApp';

interface ReimbursementCalculatorGateProps {
  mode: 'demo' | 'drive';
  isDriveConnected: boolean;
  onGoogleSignIn: () => void;
  onSwitchToDriveMode: () => void;
}

export default function ReimbursementCalculatorGate({
  mode,
  isDriveConnected,
  onGoogleSignIn,
  onSwitchToDriveMode,
}: ReimbursementCalculatorGateProps) {
  const isUnlocked = mode === 'drive' && isDriveConnected;

  if (!isUnlocked) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-14 h-14 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-[#0891b2]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-black text-slate-800">💊 실손의료비 환급금 계산기</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              1~5세대 실손보험 자기부담금 및 예상 환급금을 실시간으로 계산해주는 기능입니다.
              <br />
              구글 드라이브 연동 로그인 후 바로 사용하실 수 있습니다.
            </p>
          </div>

          {mode === 'drive' ? (
            <button
              onClick={onGoogleSignIn}
              className="w-full bg-gradient-to-r from-[#0d2461] to-[#0abde3] hover:from-[#0a1e52] hover:to-[#0891b2] text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-cyan-200"
            >
              지금 연동 로그인
            </button>
          ) : (
            <button
              onClick={onSwitchToDriveMode}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              구글 드라이브 모드로 전환
            </button>
          )}
        </div>
      </div>
    );
  }

  return <ReimbursementCalculatorApp />;
}
