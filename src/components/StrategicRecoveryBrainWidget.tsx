import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  Clock,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Cpu,
  RefreshCw,
  Gauge,
  Flame,
  Scale
} from 'lucide-react';
import { TradePosition, Candle } from '../types/trading';
import { strategicRecoveryBrain, StrategicRecoveryReport } from '../services/strategicRecoveryBrain';

interface StrategicRecoveryBrainWidgetProps {
  activePositions: TradePosition[];
  currentPrice: number;
  candles?: Candle[];
  onManualTriggerHedge?: (posId: string) => void;
}

export const StrategicRecoveryBrainWidget: React.FC<StrategicRecoveryBrainWidgetProps> = ({
  activePositions = [],
  currentPrice = 0,
  candles = [],
  onManualTriggerHedge,
}) => {
  const [report, setReport] = useState<StrategicRecoveryReport>(() =>
    strategicRecoveryBrain.evaluateRecoveryState(activePositions, currentPrice, candles)
  );

  useEffect(() => {
    const updated = strategicRecoveryBrain.evaluateRecoveryState(activePositions, currentPrice, candles);
    setReport(updated);
  }, [activePositions, currentPrice, candles]);

  const isFreeze = report.globalTradeFreezeActive;
  const minutes = Math.floor(report.subThreeMinuteTimerSec / 60);
  const seconds = report.subThreeMinuteTimerSec % 60;

  return (
    <div className={`rounded-2xl border transition-all duration-300 p-4 shadow-xl mb-4 font-mono ${
      isFreeze
        ? 'bg-gradient-to-br from-[#1c080b] via-[#2a0b12] to-[#120407] border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
        : 'bg-gradient-to-br from-[#021020] via-[#041a2e] to-[#010a14] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isFreeze
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white font-sans flex items-center gap-1.5">
                <span>مغز پردازشی بازیابی استراتژیک (Strategic-Recovery-Brain)</span>
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isFreeze
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-500'
              }`}>
                {isFreeze ? '🚨 فریز فعال معاملات (FREEZE ACTIVE)' : '🟢 آماده‌باش مانیتورینگ (MONITORING)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-0.5">
              انجماد خودکار سیستم در افت منفی، محاسبه حجم دقیق معکوس و خروج در سربه‌سر زیر ۳ دقیقه
            </p>
          </div>
        </div>

        {/* Global Freeze Status Badge */}
        <div className="flex items-center gap-2">
          {isFreeze ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>کلیه معاملات جدید متوقف</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>فرکانس معاملات آزاد و فعال</span>
            </div>
          )}
        </div>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3.5">
        {/* Metric 1: Recovery Timer */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-sans">
            <span>تایمر خروج زیر ۳ دقیقه:</span>
            <Clock className={`w-3.5 h-3.5 ${isFreeze ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-black ${isFreeze ? 'text-amber-300' : 'text-slate-400'}`}>
              {isFreeze ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : '03:00'}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">دقیقه</span>
          </div>
        </div>

        {/* Metric 2: Total Floating Loss */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-sans">
            <span>مجموع افت در ضرر:</span>
            <Flame className={`w-3.5 h-3.5 ${isFreeze ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <span className={`text-xl font-black ${isFreeze ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isFreeze ? `-$${report.totalFloatingLossUsd.toFixed(2)}` : '$0.00'}
          </span>
        </div>

        {/* Metric 3: Micro ATR & Delta */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-sans">
            <span>نوسان میکرو (Micro-ATR):</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-cyan-300">
              ${report.microVolatility.microAtrUsd.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">({report.microVolatility.subMinuteDeltaPct}%)</span>
          </div>
        </div>

        {/* Metric 4: Delta Neutral Status */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-sans">
            <span>خنثی‌سازی دلتا:</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className={`text-sm font-black ${isFreeze ? 'text-amber-300' : 'text-emerald-400'}`}>
            {isFreeze ? '⚖️ در حال تسویه معکوس' : '🛡️ ۱۰۰٪ حفاظت‌شده'}
          </span>
        </div>
      </div>

      {/* Active Delta-Hedge Execution Plan Card */}
      {report.activePlan && (
        <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/40 mb-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 font-sans">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              دستور محاسبه‌شده خنثی‌سازی دلتا (Delta-Hedge Execution Matrix):
            </span>
            <span className="text-[10px] bg-rose-950 text-rose-200 px-2 py-0.5 rounded border border-rose-500/50">
              هدف زمانی: کمتر از {report.activePlan.targetRecoverySeconds} ثانیه
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">جهت و حجم پوزیشن معکوس:</span>
              <span className="font-bold text-emerald-400">
                {report.activePlan.recommendedDirection} {report.activePlan.counterLeverage}x | ${report.activePlan.exactCounterVolumeUsd.toFixed(2)}
              </span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">قیمت هدف تسویه سربه‌سر:</span>
              <span className="font-bold text-cyan-300">
                ${report.activePlan.targetBreakevenPrice.toLocaleString()} (نوسان {report.activePlan.requiredPriceDeltaPct}٪)
              </span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">سود خالص مورد انتظار تسویه:</span>
              <span className="font-bold text-amber-300">
                +${report.activePlan.expectedNetPnlUsd.toFixed(2)} خالص
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 font-sans leading-relaxed bg-rose-950/40 p-2 rounded border border-rose-900/40">
            {report.activePlan.rationaleFa}
          </p>
        </div>
      )}

      {/* Real-Time Status Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-sans">
        <span className="text-slate-300">{report.recoveryStatusFa}</span>
        <span className="text-cyan-400 font-mono text-[10px]">{report.timestamp}</span>
      </div>
    </div>
  );
};
