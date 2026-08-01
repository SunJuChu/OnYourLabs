import React from 'react';
import { SavedCalculation } from '../types';
import { X, History, Trash2, ArrowUpRight, FolderOpen } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedList: SavedCalculation[];
  onLoadCalculation: (saved: SavedCalculation) => void;
  onDeleteCalculation: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  savedList,
  onLoadCalculation,
  onDeleteCalculation,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                저장된 계산 이력 ({savedList.length}건)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                과거 계산한 실손보험 환급 내역을 다시 불러오거나 삭제할 수 있습니다.
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {savedList.length > 0 ? (
            savedList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {item.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                      {item.result.generationName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                    <span>진료비 {item.result.totalMedicalExpense.toLocaleString()}원</span>
                    <span>•</span>
                    <span>{item.result.hospitalLevelName}</span>
                    <span>•</span>
                    <span className="text-gray-400 text-[11px]">{item.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-700">
                  <div className="text-right">
                    <span className="text-xs text-gray-500">환급금</span>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {item.result.reimbursementAmount.toLocaleString()}원
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onLoadCalculation(item);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>불러오기</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCalculation(item.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 space-y-3">
              <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                저장된 계산 내역이 없습니다.
              </p>
              <p className="text-xs text-gray-400">
                계산 결과 우측 상단 '결과 저장' 버튼을 누르면 이곳에 기록됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
          {savedList.length > 0 ? (
            <button
              onClick={onClearAll}
              className="text-xs font-medium text-rose-600 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 삭제</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
