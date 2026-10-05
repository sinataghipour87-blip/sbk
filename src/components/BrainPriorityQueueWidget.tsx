import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Zap,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Target,
  Flame,
  Award,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { tenBrainsDashboardService, BrainStatus } from '../services/tenBrainsDashboardService';

interface BrainPriorityItem extends BrainStatus {
  priorityRank: number;
  threadAllocationPct: number;
  consensusVoteMultiplier: number;
  stagnantResolverSpeedMs: number;
  pinned: boolean;
}

interface Props {
  onShowNotification?: (msg: string) => void;
}

export const BrainPriorityQueueWidget: React.FC<Props> = ({ onShowNotification }) => {
  const [brains, setBrains] = useState<BrainPriorityItem[]>([]);
  const [autoSortByAccuracy, setAutoSortByAccuracy] = useState<boolean>(true);
  const [resourceBoosterActive, setResourceBoosterActive] = useState<boolean>(true);
  const [stagnantEvacuationHours, setStagnantEvacuationHours] = useState<number>(4);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  useEffect(() => {
    const rawBrains = tenBrainsDashboardService.getTenBrainsTelemetry();
    // Initialize priority items with priorityRank based on technicalScore and calibratedProbability
    const sorted = [...rawBrains].sort((a, b) => {
      const scoreA = (a.calibratedProbabilityPct ?? 0) * 0.4 + a.technicalScore * 0.6;
      const scoreB = (b.calibratedProbabilityPct ?? 0) * 0.4 + b.technicalScore * 0.6;
      return scoreB - scoreA;
    });
    const enriched: BrainPriorityItem[] = sorted.map((b, idx) => ({
      ...b,
      priorityRank: idx + 1,
      threadAllocationPct: Math.max(10, Math.round(35 - idx * 1.8)),
      consensusVoteMultiplier: Math.max(0.6, Math.round((1.8 - idx * 0.08) * 100) / 100),
      stagnantResolverSpeedMs: Math.max(80, 80 + idx * 25),
      pinned: false
    }));
    setBrains(enriched);
  }, []);

  const handleTogglePin = (id: number) => {
    setBrains(prev =>
      prev.map(b => (b.id === id ? { ...b, pinned: !b.pinned } : b))
    );
    const msg = '📌 اولویت مغز مورد نظر قفل/آزاد گردید.';
    setAppliedNotification(msg);
    if (onShowNotification) onShowNotification(msg);
    setTimeout(() => setAppliedNotification(null), 3000);
  };

  const handleBoostTopBrains = () => {
    setResourceBoosterActive(prev => {
      const next = !prev;
      setBrains(current =>
        current.map(b => {
          if (b.priorityRank <= 3) {
            return {
              ...b,
              threadAllocationPct: next ? b.threadAllocationPct + 15 : Math.max(15, b.threadAllocationPct - 15),
              consensusVoteMultiplier: next ? b.consensusVoteMultiplier * 1.25 : b.consensusVoteMultiplier / 1.25
            };
          }
          return b;
        })
      );
      const msg = next
        ? '⚡ تقویت‌کننده منابع (Resource Booster) فعال شد: اختصاص ۴۰٪ توان پردازشی بیشتر به ۳ مغز برتر.'
        : '🔄 بوستر منابع به حالت توزیع نرمال بازگشت.';
      setAppliedNotification(msg);
      if (onShowNotification) onShowNotification(msg);
      setTimeout(() => setAppliedNotification(null), 3500);
      return next;
    });
  };

  const handleApplyQueue = () => {
    const sorted = [...brains].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const scoreA = (a.calibratedProbabilityPct ?? 0) * 0.4 + a.technicalScore * 0.6;
      const scoreB = (b.calibratedProbabilityPct ?? 0) * 0.4 + b.technicalScore * 0.6;
      return scoreB - scoreA;
    });
    const reindexed = sorted.map((b, i) => ({ ...b, priorityRank: i + 1 }));
    setBrains(reindexed);
    const msg = '🎯 صف اولویت‌بندی (Priority Queue) با موفقیت در هسته پردازش ۱۵ مغز اعمال شد.';
    setAppliedNotification(msg);
    if (onShowNotification) onShowNotification(msg);
    setTimeout(() => setAppliedNotification(null), 3500);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-purple-800/40 p-4 text-slate-100 shadow-[0_0_25px_rgba(168,85,247,0.15)] flex flex-col gap-4 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-900/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-950/80 border border-purple-500/50 rounded-xl text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              مدیریت صف اولویت‌بندی محاسباتی مغزها (Priority Queue)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-500/30">
                15 Cognitive Nodes
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              تخصیص هوشمند رشته‌های پردازشی و وزن تصمیم‌گیری بر اساس بالاترین ضریب دقت پیش‌بینی
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBoostTopBrains}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              resourceBoosterActive
                ? 'bg-amber-600/90 text-amber-100 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>بوستر ۳ مغز اول ({resourceBoosterActive ? 'فعال' : 'غیرفعال'})</span>
          </button>
          <button
            type="button"
            onClick={handleApplyQueue}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>اعمال صف در هسته</span>
          </button>
        </div>
      </div>

      {appliedNotification && (
        <div className="bg-purple-950/90 border border-purple-400/60 text-purple-200 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>{appliedNotification}</span>
        </div>
      )}

      {/* Top Priority Highlights (Tiers) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-slate-900/80 p-3 rounded-xl border border-purple-500/30 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              سطح الماس (Tier 1 - فرماندهان اجرا)
            </span>
            <span className="text-[10px] font-mono bg-purple-900/60 px-2 py-0.5 rounded">رتبه ۱ الی ۳</span>
          </div>
          <p className="text-[11px] text-slate-300">
            تخصیص اولویت صدم‌ثانیه‌ای، بالاترین سهم در اجماع نهایی و دسترسی مستقیم به شلیک سفارشات مارکت.
          </p>
          <div className="text-[10px] font-mono text-purple-400 font-bold">
            وزن رای: ۱.۵x الی ۲.۰x | تاخیر اجرا: کمتر از ۶ms
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 p-3 rounded-xl border border-indigo-500/30 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              سطح طلا (Tier 2 - اعتبارسنج و فیلتر)
            </span>
            <span className="text-[10px] font-mono bg-indigo-900/60 px-2 py-0.5 rounded">رتبه ۴ الی ۸</span>
          </div>
          <p className="text-[11px] text-slate-300">
            پایش واگرایی‌ها، فاندامنتال، ریسک GARCH و فیلتر کردن نویزهای تصادفی پیش از تایید نهایی.
          </p>
          <div className="text-[10px] font-mono text-indigo-400 font-bold">
            وزن رای: ۱.۰x الی ۱.۳x | تاخیر اجرا: ۱۰ms الی ۱۵ms
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-950/40 via-slate-900/60 to-slate-900/80 p-3 rounded-xl border border-slate-700/40 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              پروتکل خروج معاملات فرسایشی (Zombie Exit)
            </span>
            <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded">{stagnantEvacuationHours}h Threshold</span>
          </div>
          <p className="text-[11px] text-slate-400">
            تخلیه خودکار پوزیشن‌هایی که ساعت‌ها درجا زده‌اند جهت جلوگیری از خواب سرمایه و فاندینگ منفی.
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-300">حداکثر زمان مجاز درجا زدن:</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              {[2, 4, 8, 10].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setStagnantEvacuationHours(h);
                    if (onShowNotification) onShowNotification(`⏱️ آستانه خروج فرسایشی روی ${h} ساعت تنظیم شد.`);
                  }}
                  className={`px-1.5 py-0.5 rounded ${
                    stagnantEvacuationHours === h
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Priority Queue Table */}
      <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-slate-900 text-[11px] font-mono text-slate-400 border-b border-slate-800">
          <div className="col-span-1 text-center font-bold">اولویت</div>
          <div className="col-span-4">نام مغز پردازشی کوانتومی</div>
          <div className="col-span-2 text-center">دقت پیش‌بینی</div>
          <div className="col-span-2 text-center">تخصیص نخ CPU</div>
          <div className="col-span-2 text-center">ضریب وزنی رای</div>
          <div className="col-span-1 text-center">پین</div>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[420px] overflow-y-auto">
          {brains.map((brain) => {
            const isTier1 = brain.priorityRank <= 3;
            const isTier2 = brain.priorityRank > 3 && brain.priorityRank <= 8;

            return (
              <div
                key={brain.id}
                className={`grid grid-cols-12 gap-2 px-3.5 py-2.5 items-center text-xs transition-colors ${
                  isTier1
                    ? 'bg-purple-950/20 hover:bg-purple-950/30'
                    : isTier2
                    ? 'bg-slate-900/40 hover:bg-slate-900/60'
                    : 'bg-transparent hover:bg-slate-800/30'
                }`}
              >
                {/* Rank Badge */}
                <div className="col-span-1 flex items-center justify-center">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shadow-sm ${
                      isTier1
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/40'
                        : isTier2
                        ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{brain.priorityRank}
                  </span>
                </div>

                {/* Brain Info */}
                <div className="col-span-4 flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200 truncate text-[11px]">
                    {brain.nameFa}
                    {isTier1 && <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    {brain.codeName} | آخرین تصمیم: {brain.lastDecision}
                  </span>
                </div>

                {/* Accuracy / Calibration */}
                <div className="col-span-2 flex flex-col items-center">
                  <span
                    className={`font-mono font-bold text-[11px] ${
                      (brain.calibratedProbabilityPct ?? brain.technicalScore) >= 80
                        ? 'text-emerald-400'
                        : (brain.calibratedProbabilityPct ?? brain.technicalScore) >= 65
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {brain.calibratedProbabilityPct !== null ? `${brain.calibratedProbabilityPct}%` : `${brain.technicalScore}/100`}
                  </span>
                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${
                        (brain.calibratedProbabilityPct ?? brain.technicalScore) >= 80
                          ? 'bg-emerald-500'
                          : (brain.calibratedProbabilityPct ?? brain.technicalScore) >= 65
                          ? 'bg-cyan-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${brain.calibratedProbabilityPct ?? brain.technicalScore}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                    {brain.calibratedProbabilityPct !== null ? 'کالیبره‌شده' : 'امتیاز فنی'}
                  </span>
                </div>

                {/* CPU Thread Allocation */}
                <div className="col-span-2 text-center font-mono font-bold text-[11px] text-purple-300">
                  {brain.threadAllocationPct}% CPU
                  <div className="text-[9px] text-slate-500 font-sans font-normal">
                    تاخیر: {brain.latencyMs}ms
                  </div>
                </div>

                {/* Vote Multiplier */}
                <div className="col-span-2 text-center font-mono font-bold text-[11px] text-amber-300">
                  {brain.consensusVoteMultiplier.toFixed(2)}x
                  <div className="text-[9px] text-slate-500 font-sans font-normal">
                    سرعت خروج: {brain.stagnantResolverSpeedMs}ms
                  </div>
                </div>

                {/* Pin Action */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(brain.id)}
                    className={`p-1.5 rounded-lg transition-all ${
                      brain.pinned
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title={brain.pinned ? 'آزاد کردن اولویت' : 'پین کردن در صدر صف'}
                  >
                    📌
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
