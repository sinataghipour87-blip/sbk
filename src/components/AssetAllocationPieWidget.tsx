import React, { useId } from 'react';
import { PieChart as PieIcon, ShieldAlert, Coins, Lock, TrendingUp, Sparkles } from 'lucide-react';
import { TradePosition } from '../types/trading';

interface AssetAllocationPieWidgetProps {
  balance: number;
  activePositions: TradePosition[];
}

export const AssetAllocationPieWidget: React.FC<AssetAllocationPieWidgetProps> = ({
  balance,
  activePositions,
}) => {
  const gradientId = useId();
  const safePositions = activePositions || [];

  // 1. Calculate allocated margins
  // Primary (Regular) positions margin
  const primaryPositions = safePositions.filter((p) => !p.hedgeActive && !p.isRecoveryTrade);
  const primaryMargin = primaryPositions.reduce((acc, p) => acc + (p.margin || 0), 0);

  // Hedge & Recovery positions margin
  const hedgePositions = safePositions.filter((p) => p.hedgeActive || p.isRecoveryTrade);
  const hedgeMargin = hedgePositions.reduce((acc, p) => acc + (p.margin || 0), 0);

  // Free Margin
  const freeMargin = Math.max(0, balance);

  // Total Portfolio Capital
  const totalEquity = Math.max(1, freeMargin + primaryMargin + hedgeMargin);

  // Percentages
  const freePct = (freeMargin / totalEquity) * 100;
  const primaryPct = (primaryMargin / totalEquity) * 100;
  const hedgePct = (hedgeMargin / totalEquity) * 100;

  // SVG Donut Chart Geometry (Radius = 42, Circumference = 2 * PI * 42 = 263.89)
  const radius = 40;
  const circ = 2 * Math.PI * radius;

  const freeStroke = (freePct / 100) * circ;
  const primaryStroke = (primaryPct / 100) * circ;
  const hedgeStroke = (hedgePct / 100) * circ;

  // Stroke offsets
  const freeOffset = 0;
  const primaryOffset = -freeStroke;
  const hedgeOffset = -(freeStroke + primaryStroke);

  return (
    <div className="bg-[#030d1a] border border-cyan-800/40 rounded-2xl p-3.5 space-y-3.5 shadow-xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-600/40 text-cyan-400">
            <PieIcon className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              توزیع دارایی و پوزیشن‌ها
              <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-600/30">
                Pie Chart زنده
              </span>
            </h3>
            <span className="text-[10px] text-slate-400">مارجین آزاد، پوزیشن‌های اصلی و هدج</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] text-slate-400 block font-mono">کل ارزش دارایی</span>
          <span className="text-xs font-black font-mono text-cyan-300">
            ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* SVG Donut/Pie Chart & Legend */}
      <div className="flex items-center gap-4">
        {/* SVG Circle Graphic */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#07192e"
              strokeWidth="11"
            />

            {/* Segment 1: Free Margin (Emerald) */}
            {freePct > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="11"
                strokeDasharray={`${freeStroke} ${circ - freeStroke}`}
                strokeDashoffset={freeOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Segment 2: Primary Open Trades (Cyan) */}
            {primaryPct > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#06b6d4"
                strokeWidth="11"
                strokeDasharray={`${primaryStroke} ${circ - primaryStroke}`}
                strokeDashoffset={primaryOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Segment 3: Hedge & Recovery Positions (Amber) */}
            {hedgePct > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="11"
                strokeDasharray={`${hedgeStroke} ${circ - hedgeStroke}`}
                strokeDashoffset={hedgeOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Center Info in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] text-slate-400 font-mono">آزاد</span>
            <span className="text-xs font-black font-mono text-emerald-400">
              {freePct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-2 flex-1 text-xs font-mono">
          {/* Free Margin */}
          <div className="bg-[#051324] border border-cyan-950 p-1.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-[11px] text-slate-300">مارجین آزاد (Free)</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-400">
                ${freeMargin.toFixed(1)}
              </span>
              <span className="text-[9px] text-slate-400 block">({freePct.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Primary Active Positions */}
          <div className="bg-[#051324] border border-cyan-950 p-1.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="text-[11px] text-slate-300">پوزیشن‌های اصلی ({primaryPositions.length})</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-cyan-300">
                ${primaryMargin.toFixed(1)}
              </span>
              <span className="text-[9px] text-slate-400 block">({primaryPct.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Hedge & Recovery Positions */}
          <div className="bg-[#051324] border border-cyan-950 p-1.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="text-[11px] text-slate-300">پوزیشن‌های هدج ({hedgePositions.length})</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-amber-400">
                ${hedgeMargin.toFixed(1)}
              </span>
              <span className="text-[9px] text-slate-400 block">({hedgePct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Leverage Status Bar */}
      <div className="bg-[#020b17] border border-cyan-900/40 rounded-xl p-2 flex items-center justify-between text-[10px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>ظرفیت درگیر سرمایه:</span>
        </div>
        <span className={`font-mono font-bold ${
          (100 - freePct) > 65 ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {(100 - freePct).toFixed(1)}% ({((100 - freePct) > 65 ? 'حالت بافر بالا' : 'ریسک امن و پایدار')})
        </span>
      </div>
    </div>
  );
};
