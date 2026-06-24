import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricProps {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
}

export default function MetricCard({ label, value, delta, deltaType = 'neutral', icon }: MetricProps) {
  return (
    <div className="bg-white border border-slate-200/90 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:border-slate-300 select-none font-sans group">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
            {label}
          </span>
          {icon && <div className="text-slate-300 group-hover:text-[#ff4b4b] transition-colors duration-300">{icon}</div>}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-none">
            {value}
          </span>
        </div>
      </div>

      {delta && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
          {deltaType === 'increase' && (
            <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              <span>{delta}</span>
            </div>
          )}
          {deltaType === 'decrease' && (
            <div className="flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
              <span>{delta}</span>
            </div>
          )}
          {deltaType === 'neutral' && (
            <div className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
              <Minus className="w-3 h-3 mr-0.5 text-slate-400" />
              <span>{delta}</span>
            </div>
          )}
          <span className="text-[9px] text-slate-400 font-medium">전월 대비</span>
        </div>
      )}
    </div>
  );
}
