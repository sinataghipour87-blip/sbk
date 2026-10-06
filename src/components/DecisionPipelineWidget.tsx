import React, { useState } from 'react';
import {
  AnalysisResult,
  DecisionPipelineResult,
  TradeContract,
  TradePosition,
  TradeHistory,
} from '../types/trading';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileCheck,
  Eye,
  TrendingUp,
  TrendingDown,
  Info,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DecisionPipelineWidgetProps {
  analysis?: AnalysisResult | null;
  pipelineResult?: DecisionPipelineResult | null;
  activePositions?: TradePosition[];
  tradeHistory?: TradeHistory[];
}

export const DecisionPipelineWidget: React.FC<DecisionPipelineWidgetProps> = ({
  analysis,
  pipelineResult,
  activePositions = [],
  tradeHistory = [],
}) => {
  const [selectedContract, setSelectedContract] = useState<TradeContract | null>(null);
  const [selectedAuditTrade, setSelectedAuditTrade] = useState<TradeHistory | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const pipeline = pipelineResult || analysis?.decisionPipeline;
  const isWaitState = !pipeline || pipeline.decision === 'WAIT_NO_TRADE';

  return (
    <div className="bg-[#051424] border border-cyan-800/70 rounded-2xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.12)] mb-4 transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-950 pb-3 mb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold tracking-wider text-cyan-300">
                پایپ‌لاین جامع تصمیم‌گیری و اعتبارسنجی ورود (DECISION PIPELINE & EDGE ENGINE)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                ۱۴ مرحله پیوسته
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              هیچ سیگنال خامی مستقیماً اجرا نمی‌شود؛ تنها معاملات دارای برتری آماری (Edge) و امید ریاضی مثبت تایید می‌شوند.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {isWaitState ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/70 text-amber-300 font-mono text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>وضعیت: WAIT / NO TRADE (حفظ سرمایه)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 font-mono text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>وضعیت: EXECUTE APPROVED (قرارداد معتبر)</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-400 cursor-pointer transition-all"
            title="تغییر وضعیت نمایش"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Edge & Mathematical Expectation Banner */}
          <div className={`p-3 rounded-xl border mb-3 flex flex-wrap items-center justify-between gap-3 ${
            isWaitState
              ? 'bg-[#030e1c] border-amber-900/50 text-amber-200'
              : 'bg-[#02181d] border-emerald-900/60 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isWaitState ? 'bg-amber-950 border border-amber-700/60 text-amber-400' : 'bg-emerald-950 border border-emerald-600/60 text-emerald-400'}`}>
                {isWaitState ? <Scale className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold block">
                  {isWaitState
                    ? '🛡️ استراتژی انضباطی: در انتظار شکل‌گیری موقعیت با برتری آماری (Edge)'
                    : '🎯 تایید نهایی: موقعیت دارای امید ریاضی و احتمال تاییدشده OOS'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isWaitState
                    ? (pipeline?.waitReasonFa || 'بازار فاقد ستاپ پرایس‌اکشن با ریسک به ریوارد توجیه‌پذیر است.')
                    : `جهت ${pipeline?.direction === 'LONG' ? 'خرید (LONG)' : 'فروش (SHORT)'} | امید ریاضی: ${pipeline?.expectedValueUsd !== null && pipeline?.expectedValueUsd !== undefined ? `$${pipeline.expectedValueUsd.toFixed(2)}` : 'N/A'} | احتمال برد: ${pipeline?.calibratedWinProb !== null && pipeline?.calibratedWinProb !== undefined ? `${(pipeline.calibratedWinProb * 100).toFixed(0)}٪` : 'UNVALIDATED'}`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <div className="bg-[#020b17] px-2.5 py-1 rounded-lg border border-cyan-900/60 text-center">
                <span className="text-[9px] text-cyan-400 block font-bold">Trade Quality:</span>
                <span className="font-bold text-slate-100">
                  {analysis?.calibratedMetadata?.tradeQualityScore?.totalScore ?? 'UNVALIDATED'}
                </span>
              </div>

              <div className="bg-[#020b17] px-2.5 py-1 rounded-lg border border-cyan-900/60 text-center">
                <span className="text-[9px] text-cyan-400 block font-bold">OOS-Calibrated Probability / 95% CI:</span>
                <span className="font-bold text-cyan-300">
                  {pipeline?.calibratedWinProb !== null && pipeline?.calibratedWinProb !== undefined
                    ? `${(pipeline.calibratedWinProb * 100).toFixed(1)}%`
                    : 'در انتظار OOS'}
                </span>
                <span className="block text-[9px] text-slate-400">
                  {analysis?.calibratedMetadata?.confidenceInterval &&
                   analysis.calibratedMetadata.confidenceIntervalWidth !== null &&
                   analysis.calibratedMetadata.expectedCalibrationError !== null
                    ? `Lower ${(analysis.calibratedMetadata.confidenceInterval.lowerBound * 100).toFixed(1)}% | Width ${(analysis.calibratedMetadata.confidenceIntervalWidth * 100).toFixed(1)}% | ECE ${(analysis.calibratedMetadata.expectedCalibrationError * 100).toFixed(1)}% | OOS ${analysis.calibratedMetadata.oosSampleSize}/${analysis.calibratedMetadata.requiredOosSampleSize}`
                    : 'CI / Error / Sample: UNVALIDATED'}
                </span>
              </div>

              <div className="bg-[#020b17] px-2.5 py-1 rounded-lg border border-cyan-900/60 text-center">
                <span className="text-[9px] text-cyan-400 block font-bold">Expected Value:</span>
                <span className={`font-bold ${(pipeline?.expectedValueUsd || 0) > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pipeline?.expectedR !== null && pipeline?.expectedR !== undefined ? `${pipeline.expectedR > 0 ? '+' : ''}${pipeline.expectedR}R` : 'N/A'}
                  {' '}<span className="text-[10px] text-slate-400">({(pipeline?.expectedValueUsd || 0) > 0 ? '+' : ''}${pipeline?.expectedValueUsd?.toFixed(2) || '0.00'})</span>
                </span>
              </div>

              <div className="bg-[#020b17] px-2.5 py-1 rounded-lg border border-cyan-950 text-center">
                <span className="text-[9px] text-slate-400 block">مراحل پاس‌شده:</span>
                <span className="font-bold text-slate-200">
                  {pipeline?.passedStagesCount || 0} / {pipeline?.totalStagesCount || 14}
                </span>
              </div>
            </div>
          </div>

          {/* 91-95 & 100 Meta-Model & Canonical Master Decision Gateway Bar */}
          {pipeline?.masterDecision && (
            <div className="bg-[#020d18] border border-cyan-800/80 rounded-xl p-3 mb-3 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-950 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    pipeline.masterDecision.status === 'EXECUTE'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 animate-pulse'
                      : pipeline.masterDecision.status === 'TRIGGERED' || pipeline.masterDecision.status === 'ARMED'
                      ? 'bg-blue-950 border-blue-500 text-blue-300'
                      : 'bg-amber-950 border-amber-600 text-amber-300'
                  }`}>
                    {pipeline.masterDecision.statusFa}
                  </div>
                  <span className="text-[11px] text-slate-300 font-bold">
                    گیت تصمیم نهایی (Master Decision Gate) — مدل: {pipeline.masterDecision.modelVersion}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400">
                  شناسه: <span className="text-cyan-300 font-bold">{pipeline.masterDecision.decisionId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                <div className="bg-[#041624] p-2 rounded-lg border border-cyan-950 text-center">
                  <span className="text-[9px] text-cyan-400 block font-bold">جهت و احتمال فرامدل:</span>
                  <span className="text-xs font-bold text-slate-100">
                    {pipeline.masterDecision.direction} ({pipeline.masterDecision.probabilityPct.toFixed(1)}٪)
                  </span>
                </div>

                <div className="bg-[#041624] p-2 rounded-lg border border-cyan-950 text-center">
                  <span className="text-[9px] text-cyan-400 block font-bold">بازه اطمینان (95% CI):</span>
                  <span className="text-xs font-bold text-cyan-300">
                    [{pipeline.masterDecision.confidenceInterval.lowerBoundPct}% - {pipeline.masterDecision.confidenceInterval.upperBoundPct}%]
                  </span>
                </div>

                <div className="bg-[#041624] p-2 rounded-lg border border-cyan-950 text-center">
                  <span className="text-[9px] text-cyan-400 block font-bold">تشتت آرا (Disagreement):</span>
                  <span className={`text-xs font-bold ${
                    (pipeline.masterDecision.disagreementReport?.disagreementIndex || 0) >= 38 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {pipeline.masterDecision.disagreementReport?.disagreementIndex || 0}% {pipeline.masterDecision.disagreementReport?.vetoTriggered ? '🛑 وتو' : '✅ همگن'}
                  </span>
                </div>

                <div className="bg-[#041624] p-2 rounded-lg border border-cyan-950 text-center">
                  <span className="text-[9px] text-cyan-400 block font-bold">ثبات زمانی و تیک:</span>
                  <span className="text-xs font-bold text-purple-300">
                    ثبات {pipeline.masterDecision.predictionStability?.predictionStabilityScore || 90}٪ {pipeline.masterDecision.temporalStability?.isTemporalStabilityVerified ? '⚡ تایید' : '⏳ در انتظار'}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-300 bg-[#010811] p-2 rounded-lg border border-cyan-950/80">
                <span className="text-cyan-400 font-bold">تحلیل فرامدل: </span>
                {pipeline.masterDecision.masterVerdictFa}
              </div>
              {pipeline.masterDecision.metaLearnerOutput && (
                <div className="mt-2 text-[10px] text-slate-300 bg-[#010811] p-2 rounded-lg border border-cyan-950/80">
                  Return: {pipeline.masterDecision.metaLearnerOutput.expectedReturnR === null
                    ? '—'
                    : `${pipeline.masterDecision.metaLearnerOutput.expectedReturnR.toFixed(2)}R`}
                  {' · '}MAE: {pipeline.masterDecision.metaLearnerOutput.expectedMaeR === null
                    ? '—'
                    : `${pipeline.masterDecision.metaLearnerOutput.expectedMaeR.toFixed(2)}R`}
                  {' · '}MFE: {pipeline.masterDecision.metaLearnerOutput.expectedMfeR === null
                    ? '—'
                    : `${pipeline.masterDecision.metaLearnerOutput.expectedMfeR.toFixed(2)}R`}
                  {' · '}مدت تاریخی: {pipeline.masterDecision.metaLearnerOutput.expectedDurationSeconds === null
                    ? '—'
                    : `${pipeline.masterDecision.metaLearnerOutput.expectedDurationSeconds}s`}
                </div>
              )}

              {pipeline.opportunitySurface && (
                <details className="mt-2 rounded-lg border border-indigo-900/70 bg-[#010811] p-2">
                  <summary className="cursor-pointer text-[10px] font-bold text-indigo-200">
                    Opportunity Surface · {pipeline.opportunitySurface.mode} · آمادگی {pipeline.opportunitySurface.readinessPct}٪
                    {' — '}
                    {pipeline.opportunitySurface.entryZone
                      ? `زون $${pipeline.opportunitySurface.entryZone.min.toFixed(2)}–$${pipeline.opportunitySurface.entryZone.max.toFixed(2)}`
                      : 'زون ورود هنوز معتبر نیست'}
                    {' · '}
                    {pipeline.opportunitySurface.optimalEntryPrice !== null
                      ? `ورود بهینه $${pipeline.opportunitySurface.optimalEntryPrice.toFixed(2)}`
                      : 'ورود بهینه نامشخص'}
                  </summary>
                  <p className="my-2 text-[10px] text-amber-300">
                    {pipeline.opportunitySurface.nearMissReasonFa ?? 'Trigger و شرایط اجرا تایید شدند.'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-1">
                    {pipeline.opportunitySurface.points.map((point, index) => (
                      <div key={`${point.entryPrice}-${index}`} className="rounded border border-slate-800 p-1.5 text-[9px] text-slate-300">
                        <div className="font-bold text-cyan-300">${point.entryPrice.toFixed(2)}</div>
                        <div>EV: {point.expectedValueR === null ? '—' : `${point.expectedValueR.toFixed(3)}R`}</div>
                        <div>Meta P (مشترک نقاط): {point.calibratedProbabilityPct === null ? '—' : `${point.calibratedProbabilityPct.toFixed(1)}٪`}</div>
                        <div>Fill: {point.fillProbabilityPct === null ? '—' : `${point.fillProbabilityPct.toFixed(1)}٪`}</div>
                        <div>Slip: {point.slippageBps === null ? '—' : `${point.slippageBps.toFixed(2)} bps`}</div>
                        <div>Stop/Reward: {point.stopDistance === null || point.reward === null
                          ? '—'
                          : `$${point.stopDistance.toFixed(2)} / $${point.reward.toFixed(2)}`}</div>
                        <div>Liquidity: {point.liquidityUsd === null ? '—' : `$${point.liquidityUsd.toFixed(0)}`}</div>
                        <div>MAE/MFE: {point.expectedMaeR === null || point.expectedMfeR === null
                          ? '—'
                          : `${point.expectedMaeR.toFixed(2)}R / ${point.expectedMfeR.toFixed(2)}R`}</div>
                        <div>مدت تاریخی: {point.expectedDurationSeconds === null ? '—' : `${point.expectedDurationSeconds}s`}</div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* 14 Stages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2 mb-3">
            {pipeline?.stages?.map((st, idx) => {
              const isPassed = st.passed;
              const isFailed = st.status === 'FAILED';
              const isSkipped = st.status === 'SKIPPED';

              return (
                <div
                  key={st.id}
                  className={`p-2 rounded-xl border text-[11px] font-mono flex flex-col justify-between transition-all ${
                    isPassed
                      ? 'bg-[#02131b] border-emerald-900/60 hover:border-emerald-700/80'
                      : isFailed
                      ? 'bg-[#1a0808] border-rose-800/80 hover:border-rose-600'
                      : 'bg-[#020b17] border-cyan-950/80 opacity-60'
                  }`}
                  title={`${st.nameFa}\n${st.reasonFa}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]">
                      {idx + 1}. {st.name.split(' ')[0]}
                    </span>
                    {isPassed ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    ) : isFailed ? (
                      <XCircle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="text-[10px] font-bold text-slate-200 truncate" title={st.value?.toString()}>
                    {st.value?.toString() || '—'}
                  </div>

                  <div className="mt-1 pt-1 border-t border-cyan-950/60 text-[8px] text-slate-400 truncate">
                    {st.threshold}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Prerequisites to Arm (if in Wait mode) */}
          {isWaitState && pipeline?.prerequisitesToArmFa && pipeline.prerequisitesToArmFa.length > 0 && (
            <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950 text-xs font-mono mb-3">
              <span className="text-[10px] font-bold text-cyan-300 block mb-1 flex items-center gap-1.5">
                <Info className="w-3 h-3 text-cyan-400" />
                پیش‌شرط‌های لازم جهت صدور قرارداد معامله (Prerequisites to Arm):
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300 pr-1">
                {pipeline.prerequisitesToArmFa.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Row: View Active Contract & Recent Audits */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-cyan-950">
            <div className="flex items-center gap-2">
              {pipeline?.tradeContract && (
                <button
                  onClick={() => setSelectedContract(pipeline.tradeContract!)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>مشاهده قرارداد زنده معامله (Trade Contract)</span>
                </button>
              )}

              {tradeHistory.length > 0 && (
                <button
                  onClick={() => setSelectedAuditTrade(tradeHistory[tradeHistory.length - 1])}
                  className="px-2.5 py-1 rounded-lg bg-[#020f1e] hover:bg-[#03182e] border border-cyan-900/60 text-slate-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>بررسی گزارش ممیزی آخرین معامله (Full Trade Audit)</span>
                </button>
              )}
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              ارزیابی‌شده در: {new Date(pipeline?.evaluatedAtIso || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </>
      )}

      {/* MODAL 1: Immutable Trade Contract Viewer */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#051424] border border-cyan-600 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)]">
            <div className="flex items-center justify-between border-b border-cyan-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-mono font-bold text-sm text-slate-100">
                  قرارداد معامله غیرقابل‌تغییر (IMMUTABLE TRADE CONTRACT)
                </h3>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-slate-400 hover:text-white font-mono text-xs px-2 py-1 rounded bg-cyan-950 border border-cyan-800"
              >
                ✕ بستن
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#020b17] p-3 rounded-xl border border-cyan-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">شناسه یکتای قرارداد:</span>
                  <span className="text-cyan-300 font-bold">{selectedContract.contractId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">مهر دیجیتال اعتبارسنجی:</span>
                  <span className="text-emerald-400 text-[10px] font-bold">{selectedContract.contractSealHash}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">جهت و اهرم:</span>
                  <span className={`font-bold text-sm ${selectedContract.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedContract.direction === 'LONG' ? 'خرید (LONG)' : 'فروش (SHORT)'} {selectedContract.leverage}x
                  </span>
                </div>

                <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">محدوده قیمت ورود:</span>
                  <span className="font-bold text-slate-200">
                    ${selectedContract.entryZone.target.toFixed(1)}
                  </span>
                </div>

                <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">حد ضرر / ابطال:</span>
                  <span className="font-bold text-rose-400">
                    ${selectedContract.stop.toFixed(1)}
                  </span>
                </div>

                <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">تارگت سود اول (TP1):</span>
                  <span className="font-bold text-emerald-400">
                    ${selectedContract.tp1.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">امید ریاضی (EV):</span>
                  <span className="font-bold text-emerald-400">
                    {selectedContract.expectedValue !== null ? `+$${selectedContract.expectedValue.toFixed(2)} (${selectedContract.expectedR}R)` : 'در انتظار داده'}
                  </span>
                </div>

                <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">شانس برد برآوردی:</span>
                  <span className="font-bold text-cyan-300">
                    {selectedContract.winProbability !== null ? `${(selectedContract.winProbability * 100).toFixed(0)}%` : 'داده ناکافی'}
                  </span>
                </div>

                <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">مارجین معامله:</span>
                  <span className="font-bold text-slate-200">
                    ${selectedContract.positionSize.marginUsd.toFixed(1)} (${selectedContract.positionSize.notionalUsd.toFixed(0)})
                  </span>
                </div>

                <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">وضعیت اعتبار:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedContract.isImmutable ? 'قفل و غیرقابل‌تغییر 🔒' : 'پویا'}
                  </span>
                </div>
              </div>

              <div className="bg-[#020b17] p-3 rounded-xl border border-cyan-950">
                <span className="text-[10px] text-slate-400 block mb-1">دلیل و ارکان ورود (Reason for Entry):</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {selectedContract.reasonForEntry}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>زمان صدور سیگنال: {selectedContract.signalTimestampIso}</span>
                <span>وضعیت: {selectedContract.contractStatus}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Trade Audit Trail Viewer */}
      {selectedAuditTrade && selectedAuditTrade.auditTrail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#051424] border border-cyan-600 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)]">
            <div className="flex items-center justify-between border-b border-cyan-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono font-bold text-sm text-slate-100">
                  گزارش ممیزی کامل معامله (TRADE POST-MORTEM & AUDIT TRAIL)
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditTrade(null)}
                className="text-slate-400 hover:text-white font-mono text-xs px-2 py-1 rounded bg-cyan-950 border border-cyan-800"
              >
                ✕ بستن
              </button>
            </div>

            {selectedAuditTrade.auditTrail && (
              <div className="space-y-3 font-mono text-xs">
                {/* Result summary */}
                <div className="bg-[#020b17] p-3 rounded-xl border border-cyan-950 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">معامله:</span>
                    <span className="font-bold text-cyan-300">
                      {selectedAuditTrade.name || 'S'} {selectedAuditTrade.dir} {selectedAuditTrade.lev}x (${selectedAuditTrade.entry.toFixed(1)})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">سود/زیان نهایی:</span>
                    <span className={`font-bold text-sm ${selectedAuditTrade.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedAuditTrade.pnlUsd >= 0 ? '+' : ''}${selectedAuditTrade.pnlUsd.toFixed(2)} ({selectedAuditTrade.pnlPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* MAE & MFE Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                    <span className="text-[10px] text-slate-400 block">بیشترین ضرر شناور (MAE):</span>
                    <span className="font-bold text-rose-400">
                      ${(selectedAuditTrade.auditTrail.executionMetrics.maeUsd || selectedAuditTrade.maeUsd || 0).toFixed(2)} ({((selectedAuditTrade.auditTrail.executionMetrics.maePct || selectedAuditTrade.maePct || 0)).toFixed(1)}%)
                    </span>
                  </div>

                  <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                    <span className="text-[10px] text-slate-400 block">بیشترین سود شناور (MFE):</span>
                    <span className="font-bold text-emerald-400">
                      +${(selectedAuditTrade.auditTrail.executionMetrics.mfeUsd || selectedAuditTrade.mfeUsd || 0).toFixed(2)} ({((selectedAuditTrade.auditTrail.executionMetrics.mfePct || selectedAuditTrade.mfePct || 0)).toFixed(1)}%)
                    </span>
                  </div>

                  <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                    <span className="text-[10px] text-slate-400 block">اسپرد در ورود:</span>
                    <span className="font-bold text-slate-200">
                      ${selectedAuditTrade.auditTrail.entryFeatures.spreadUsd?.toFixed(2)} ({selectedAuditTrade.auditTrail.entryFeatures.spreadBps?.toFixed(2)} bps)
                    </span>
                  </div>

                  <div className="bg-[#020b17] p-2.5 rounded-xl border border-cyan-950">
                    <span className="text-[10px] text-slate-400 block">کارمزد صرافی (Fee):</span>
                    <span className="font-bold text-slate-200">
                      ${(selectedAuditTrade.auditTrail.executionMetrics.actualFeeUsd || selectedAuditTrade.exchangeFeeEstimateUsd || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Features at Entry snapshot */}
                <div className="bg-[#020b17] p-3 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-cyan-400 font-bold block mb-2">
                    وضعیت دقیق تمام فیچرها در لحظه ورود (Entry Snapshot Features):
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-300">
                    <div>RSI: {selectedAuditTrade.auditTrail.entryFeatures.rsi?.toFixed(1)}</div>
                    <div>ADX: {selectedAuditTrade.auditTrail.entryFeatures.adx?.toFixed(1)}</div>
                    <div>ATR: ${selectedAuditTrade.auditTrail.entryFeatures.atr?.toFixed(1)}</div>
                    <div>OBI: {((selectedAuditTrade.auditTrail.entryFeatures.obi || 0) * 100).toFixed(1)}%</div>
                    <div>CVD Delta: {selectedAuditTrade.auditTrail.entryFeatures.cvdDelta?.toFixed(1)}</div>
                    <div>Taker Ratio: {((selectedAuditTrade.auditTrail.entryFeatures.takerRatio || 0.5) * 100).toFixed(1)}%</div>
                    <div>Funding Rate: {((selectedAuditTrade.auditTrail.entryFeatures.fundingRate || 0.01)).toFixed(3)}%</div>
                    <div>GARCH Regime: {selectedAuditTrade.auditTrail.entryFeatures.garchRegime || 'NORMAL'}</div>
                    <div>HTF 1H: {selectedAuditTrade.auditTrail.entryFeatures.htf1h}</div>
                    <div>HTF 4H: {selectedAuditTrade.auditTrail.entryFeatures.htf4h}</div>
                    <div>تازگی داده: {selectedAuditTrade.auditTrail.entryFeatures.dataFreshnessAgeMs}ms</div>
                    <div>سلامت داده: {selectedAuditTrade.auditTrail.entryFeatures.feedQualityScore}/100</div>
                  </div>
                </div>

                <div className="bg-[#020b17] p-3 rounded-xl border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block mb-1">علت بسته‌شدن معامله:</span>
                  <p className="text-slate-200 text-xs">
                    {selectedAuditTrade.closeReason || 'تارگت سود یا تریلینگ استاپ'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
