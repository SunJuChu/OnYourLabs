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
    <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:border-slate-300 select-none font-sans group">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans truncate">
            {label}
          </span>
          {icon && <div className="text-slate-300 group-hover:text-[#0abde3] transition-colors duration-300 shrink-0">{icon}</div>}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
            {value}
          </span>
        </div>
      </div>

      {delta && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
          {deltaType === 'increase' && (
            <div className="flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
              <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
              <span>{delta}</span>
            </div>
          )}
          {deltaType === 'decrease' && (
            <div className="flex items-center text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
              <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />
              <span>{delta}</span>
            </div>
          )}
          {deltaType === 'neutral' && (
            <div className="flex items-center text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-200">
              <Minus className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
              <span>{delta}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
