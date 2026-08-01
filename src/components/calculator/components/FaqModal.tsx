import React, { useState } from 'react';
import { FAQS } from '../data/insuranceRules';
import { X, HelpCircle, ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                실손보험 청구 가이드 & 자주 묻는 질문
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                실손 청구 필수 제출 서류 및 공제액 계산 궁금증 해결
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Section: Essential Documents */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xs font-bold text-blue-900 dark:text-blue-100 flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>실손보험 청구 시 필수 서류 체크리스트</span>
            </h3>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5 pl-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span><strong>통원/외래:</strong> 진료비 영수증, 진료비 세부내역서</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span><strong>입원:</strong> 입퇴원확인서(병명/질병코드 명시), 진료비 세부내역서</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span><strong>비급여 주사료:</strong> 의사 소견서 또는 주사제 처방전 (치료 목적 명시)</span>
              </li>
            </ul>
          </div>

          {/* Section: FAQ Accordion */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
              자주 묻는 질문 (FAQ)
            </h3>
            {FAQS.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left bg-gray-50/80 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800/60 font-semibold text-xs text-gray-900 dark:text-white flex items-center justify-between"
                  >
                    <span>Q. {faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {isOpen && (
                    <div className="p-3.5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      A. {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold transition"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
