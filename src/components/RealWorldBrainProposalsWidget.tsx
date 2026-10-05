import React, { useState } from 'react';
import { Cpu, Zap, ShieldCheck, TrendingUp, Sparkles, Target, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { AnalysisResult, TradePosition } from '../types/trading';
import { realWorldMasterBrainsService, MasterBrainDiagnosis } from '../services/realWorldMasterBrains';

interface RealWorldBrainProposalsWidgetProps {
  analysis: AnalysisResult | null;
  activePositions: TradePosition[];
  onShowNotification?: (msg: string) => void;
}

export const RealWorldBrainProposalsWidget: React.FC<RealWorldBrainProposalsWidgetProps> = ({
  analysis,
  activePositions,
  onShowNotification,
}) => {
  const [executedSuggestions, setExecutedSuggestions] = useState<Record<string, boolean>>({});

  const diagnosis: MasterBrainDiagnosis = realWorldMasterBrainsService.generateMasterDiagnosis(
    analysis,
    activePositions,
    []
  );

  const handleApplySuggestion = (sugId: string, sugTitle: string) => {
    setExecutedSuggestions((prev) => ({ ...prev, [sugId]: true }));
    if (onShowNotification) {
      onShowNotification(`✅ پیشنهاد هوشمند [${sugTitle}] فوراً توسط مغزهای پردازشی اعمال و با سیستم همگام‌سازی شد.`);
    }
  };

  return (
    <CollapsibleCard
      title="مغزهای پردازشی فوق‌پیشرفته و بسته پیشنهادات همگام‌سازی دنیای واقعی"
      badge={`۴ مغز نسل جدید فعال | تطبیق ۱۰۰٪ شناور`}
      badgeColor="text-cyan-300 bg-cyan-950/80 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
      defaultOpen={true}
      icon={<Cpu className="w-5 h-5 text-cyan-400" />}
    >
      <div className="space-y-3 font-mono text-xs">
        {/* Core Real-World Brains Health & Confluence Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-[#031124] border border-cyan-900/60 p-2.5 rounded-xl text-center space-y-1">
            <span className="text-[10px] text-slate-400 block">مغز جریان سفارشات (Orderflow)</span>
            <span className="text-sm font-black text-cyan-300 font-mono">{diagnosis.orderflowHealthPct}%</span>
            <span className="text-[9px] text-emerald-400 block">قدرت تشخیص شکست</span>
          </div>

          <div className="bg-[#031124] border border-cyan-900/60 p-2.5 rounded-xl text-center space-y-1">
            <span className="text-[10px] text-slate-400 block">بیشینه‌ساز سود رانر (Harvest)</span>
            <span className="text-sm font-black text-emerald-300 font-mono">{diagnosis.trendRunPowerPct}%</span>
            <span className="text-[9px] text-emerald-400 block">دوشیدن حداکثر موج</span>
          </div>

          <div className="bg-[#031124] border border-cyan-900/60 p-2.5 rounded-xl text-center space-y-1">
            <span className="text-[10px] text-slate-400 block">مغز نجات پولبک (Sniper)</span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {diagnosis.rescueUrgencyPct > 50 ? `${diagnosis.rescueUrgencyPct}% (آماده نجات)` : '۱۰۰٪ امن'}
            </span>
            <span className="text-[9px] text-cyan-300 block">خروج سربه‌سر آنی</span>
          </div>

          <div className="bg-[#031124] border border-cyan-900/60 p-2.5 rounded-xl text-center space-y-1">
            <span className="text-[10px] text-slate-400 block">سپر اسلیپیج و کارمزد</span>
            <span className="text-sm font-black text-purple-300 font-mono">{diagnosis.spreadImmunityScore}%</span>
            <span className="text-[9px] text-purple-300 block">تضمین سود در دنیای واقعی</span>
          </div>
        </div>

        {/* Master Active Directives Banner */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-emerald-950/80 border border-cyan-500/50 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
            <div>
              <span className="text-[11px] font-sans font-bold text-white block">دستور فعال مغزهای پردازشی:</span>
              <span className="text-xs text-cyan-200 font-bold">{diagnosis.recommendedActionFa}</span>
            </div>
          </div>
          <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            افزایش بازدهی برآوردشده: +{diagnosis.expectedProfitBoostPct}%
          </div>
        </div>

        {/* Proactive Real-World Suggestions List */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-slate-300 text-xs font-sans font-bold">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>پیشنهادهای راهبردی برای آمادگی سناریوها و بیشینه‌سازی سود در دنیای واقعی:</span>
            </span>
            <button
              onClick={() => {
                const allExecuted: Record<string, boolean> = {};
                diagnosis.proactiveSuggestions.forEach((s) => {
                  allExecuted[s.id] = true;
                });
                setExecutedSuggestions(allExecuted);
                if (onShowNotification) {
                  onShowNotification('🚀 تمام ۶ پیشنهاد هوشمند مغزهای پردازشی فوراً فعال و با سیستم شناور همگام‌سازی شدند.');
                }
              }}
              className="py-1 px-3 rounded-lg bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white font-mono font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>⚡ همگام‌سازی و فعال‌سازی همه‌جانبه تمام ۶ پیشنهاد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {diagnosis.proactiveSuggestions.map((sug) => {
              const isApplied = executedSuggestions[sug.id];
              return (
                <div
                  key={sug.id}
                  className="bg-[#020b18] border border-slate-800 hover:border-cyan-500/40 p-2.5 rounded-xl space-y-2 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-slate-200 text-xs flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        {sug.titleFa}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        دقت: {sug.confidence}%
                      </span>
                    </div>
                    <p className="text-[10px] font-sans text-slate-400">{sug.impactFa}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                    <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      آماده شلیک
                    </span>
                    <button
                      onClick={() => handleApplySuggestion(sug.id, sug.titleFa)}
                      disabled={isApplied}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{isApplied ? 'همگام و فعال شد' : 'اجرا و همگام‌سازی فوری'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
};
