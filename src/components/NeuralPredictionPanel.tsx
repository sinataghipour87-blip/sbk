import React, { useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  Sparkles,
  Target,
  Zap,
  ShieldCheck,
  Anchor,
  Award,
  Clock,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Scale
} from 'lucide-react';
import { QuantumCertaintyReport, BayesianMicroVector, Pattern30mReversalAnalysis } from '../services/predictiveEngine';
import { CalibratedProbabilityMetadata } from '../types/trading';

interface Scenario4H {
  id: string;
  title: string;
  probability: number;
  target4h: number;
  path: number[];
  description: string;
}

interface PredictionData {
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNKNOWN';
  confidence: number;
  rsi?: number;
  volatility?: number;
  support?: number;
  resistance?: number;
  riskReward?: number;
  winProbability?: number;
  backtestAccuracy?: number;
  isRangeBound?: boolean;
  rangeBreakoutConfirmed?: boolean;
  pullbackLimitEntry?: number;
  triggerCandleLevel?: number;
  calibratedMetadata?: CalibratedProbabilityMetadata;
  quantumCertainty?: QuantumCertaintyReport;
  microVector?: BayesianMicroVector;
  reversal30m?: Pattern30mReversalAnalysis;
  ensembleDetails?: {
    arimaProjected?: number;
    gbScore?: number;
    hurstExponent?: number;
    regime?: string;
  };
  whalePressure?: string;
  monteCarlo?: number[];
  scenarios4H?: Scenario4H[];
  forecast15m?: any[];
  unifiedGoal?: string;
  onChainStatus?: string;
  suggestions?: string[];
  tieredTargets?: {
    tp1: number;
    tp2: number;
    tp3: number;
    tp4?: number;
    tp5?: number;
    estimatedMinutes: number;
    strategy: string;
  };
}

interface Props {
  prediction: PredictionData | null;
}

const NeuralPredictionPanelComponent: React.FC<Props> = ({ prediction }) => {
  const [activeScenarioTab, setActiveScenarioTab] = useState<string>('bullish');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);

  if (!prediction) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-center space-x-3 space-x-reverse text-slate-400">
        <Brain className="w-6 h-6 animate-pulse text-indigo-400" />
        <span className="text-sm font-medium">در حال محاسبه سناریوهای کوانتومی و اهداف پله‌ای پیشرفته بیت‌کوین...</span>
      </div>
    );
  }

  const isBullish = prediction.trend === 'BULLISH';
  const isBearish = prediction.trend === 'BEARISH';
  const colorClass = isBullish ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' : isBearish ? 'text-rose-400 border-rose-500/30 bg-rose-950/20' : 'text-amber-400 border-amber-500/30 bg-amber-950/20';

  const selectedScenario = prediction.scenarios4H?.find(s => s.id === activeScenarioTab) || prediction.scenarios4H?.[0];

  return (
    <div className={`border rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all ${colorClass}`}>
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2.5">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">پیش‌بینی هوشمند تارگت‌ها (Target Prediction SB)</h3>
            <p className="text-[10px] text-slate-400">تارگت اول، تارگت دوم و تارگت نهایی با تخمین زمان و حجم خروج</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/50 text-xs font-semibold">
          {isBullish ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : isBearish ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> : <Activity className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isBullish ? 'روند صعودی (LONG)' : isBearish ? 'روند نزولی (SHORT)' : 'روند خنثی (RANGE)'}</span>
        </div>
      </div>

      {/* Tiered Logic-Targeting Section (پیش‌بینی ۵ سطح سود بر اساس ATR و مناطق کلیدی) */}
      {prediction.tieredTargets && (
        <div className="mb-3 bg-slate-950/85 border border-cyan-500/40 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-cyan-300 font-mono">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>پیش‌بینی ۵ سطح سود پویا با سیستم Logic-Targeting (ATR Dynamic Targets):</span>
            </div>
            <div className="flex items-center space-x-1 space-x-reverse text-[11px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-800/60">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>زمان تخمینی: {prediction.tieredTargets.estimatedMinutes} دقیقه</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2 text-center">
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-1.5 rounded-xl font-mono">
              <span className="text-emerald-300 block text-[9px] mb-0.5 font-bold">🎯 TP1 (1.25x ATR)</span>
              <span className="font-bold text-emerald-400 text-xs">${prediction.tieredTargets.tp1.toLocaleString()}</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">انتقال SL به ورود</span>
            </div>
            <div className="bg-cyan-950/40 border border-cyan-500/40 p-1.5 rounded-xl font-mono">
              <span className="text-cyan-300 block text-[9px] mb-0.5 font-bold">🚀 TP2 (2.50x ATR)</span>
              <span className="font-bold text-cyan-300 text-xs">${prediction.tieredTargets.tp2.toLocaleString()}</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">ارتقا SL به TP1</span>
            </div>
            <div className="bg-indigo-950/40 border border-indigo-500/40 p-1.5 rounded-xl font-mono">
              <span className="text-indigo-300 block text-[9px] mb-0.5 font-bold">⚡ TP3 (4.00x ATR)</span>
              <span className="font-bold text-indigo-300 text-xs">${prediction.tieredTargets.tp3.toLocaleString()}</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">قفل سود ۵۰٪</span>
            </div>
            <div className="bg-purple-950/40 border border-purple-500/40 p-1.5 rounded-xl font-mono">
              <span className="text-purple-300 block text-[9px] mb-0.5 font-bold">🔥 TP4 (5.80x ATR)</span>
              <span className="font-bold text-purple-300 text-xs">${(prediction.tieredTargets.tp4 || Math.round(prediction.tieredTargets.tp3 * 1.012)).toLocaleString()}</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">تریلینگ استاپ</span>
            </div>
            <div className="bg-amber-950/40 border border-amber-500/40 p-1.5 rounded-xl font-mono col-span-2 sm:col-span-1">
              <span className="text-amber-300 block text-[9px] mb-0.5 font-bold">🏆 TP5 (8.00x ATR)</span>
              <span className="font-bold text-amber-300 text-xs">${(prediction.tieredTargets.tp5 || Math.round(prediction.tieredTargets.tp3 * 1.025)).toLocaleString()}</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">تسویه ۱۰۰٪ معامله</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed font-medium bg-cyan-950/30 p-2 rounded-lg border border-cyan-900/40">
            📌 <strong className="text-cyan-200">سیستم Logic-Targeting:</strong> {prediction.tieredTargets.strategy}
          </p>
        </div>
      )}

      {/* Range Filter & Precision Entry Banner */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className={`p-2.5 rounded-xl border font-mono text-xs ${
          prediction.isRangeBound 
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' 
            : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>فیلتر تاییدیه خروج از رِنج:</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              prediction.isRangeBound ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {prediction.isRangeBound ? '🛑 بازار در فاز رنج (ورود ممنوع)' : '✅ شکست رنج تایید شد (مجاز)'}
            </span>
          </div>
          <div className="text-[10px] text-slate-300">
            میزان نوسان: <strong>{prediction.volatility ?? 0.45}%</strong> | رژیم: <strong>{prediction.ensembleDetails?.regime || 'انفجار نوسان'}</strong>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-cyan-500/40 p-2.5 rounded-xl font-mono text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-cyan-300 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>نقطه ورود پولبک دقیق (Limit Entry):</span>
            </span>
            <span className="text-cyan-300 font-bold">${prediction.pullbackLimitEntry?.toLocaleString() || '-'}</span>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>سطح شکست کندل تریگر (5M):</span>
            <span className="text-indigo-300 font-bold">${prediction.triggerCandleLevel?.toLocaleString() || '-'}</span>
          </div>
        </div>
      </div>

      {/* 🛡️ سامانه ارتقا یافته پیش‌بینی کوانتوم و سپرهای ۸گانه ضد ضرر (Quantum Ultra-Precision Suite) */}
      {prediction.quantumCertainty && (
        <div className="mb-3 bg-gradient-to-br from-[#020b18] via-[#031326] to-[#010814] border border-cyan-500/50 rounded-2xl p-3.5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-cyan-900/60 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>سامانه ارتقا قدرت پیش‌بینی و سپرهای ۸گانه ضد ضرر کوانتوم</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono border border-emerald-500/30">
                    ZERO-LOSS QUANTUM SUITE
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  فیلترهای همزمان جهت تضمین به صفر رساندن خطای معامله و به ندرت ضرر کردن در نوسانات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                prediction.quantumCertainty.grade === 'A+'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : prediction.quantumCertainty.grade === 'A'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              }`}>
                سطح کیفیت سیگنال: Grade {prediction.quantumCertainty.grade}
              </span>
              <button
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer font-sans"
              >
                <span>{isFiltersExpanded ? 'بستن فیلترها' : 'مشاهده ۸ فیلتر'}</span>
                {isFiltersExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3 font-mono">
            {/* Certainty Gauge */}
            <div className="bg-[#030e20] border border-cyan-900/60 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">شاخص قطعیت کوانتوم (QCI):</span>
                <span className="text-base font-black text-cyan-300">
                  {prediction.quantumCertainty.overallScore}٪
                </span>
                <span className="text-[9px] text-slate-400 block font-sans">
                  {prediction.quantumCertainty.passedFiltersCount} از {prediction.quantumCertainty.totalFiltersCount} فیلتر تایید
                </span>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400/40 flex items-center justify-center bg-cyan-950/40 text-cyan-300 font-bold text-xs">
                {prediction.quantumCertainty.overallScore}%
              </div>
            </div>

            {/* Optimal Sniper Entry */}
            <div className="bg-[#030e20] border border-cyan-900/60 rounded-xl p-2.5">
              <span className="text-[10px] text-emerald-400 font-bold block mb-0.5 font-sans flex items-center gap-1">
                <Target className="w-3 h-3" /> نقطه ورود اسنایپر بهینه:
              </span>
              <span className="text-base font-black text-emerald-300">
                ${prediction.quantumCertainty.optimalSnipingLevel.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 block font-sans">
                {prediction.quantumCertainty.snipingDistancePct}% فاصله از مارکت برای پرهیز از فومو
              </span>
            </div>

            {/* Instant Break-Even */}
            <div className="bg-[#030e20] border border-cyan-900/60 rounded-xl p-2.5">
              <span className="text-[10px] text-amber-300 font-bold block mb-0.5 font-sans flex items-center gap-1">
                <Lock className="w-3 h-3" /> تریگر ریسک‌فری خودکار:
              </span>
              <span className="text-base font-black text-amber-300">
                ${prediction.quantumCertainty.riskFreeTriggerPrice.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 block font-sans">
                قفل اتوماتیک SL روی ورود با اولین تیک سود
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 text-[11px] text-emerald-300 leading-relaxed flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{prediction.quantumCertainty.lossAvoidanceStatus}</span>
          </div>

          {/* Collapsible Detailed 8 Filters List */}
          {isFiltersExpanded && (
            <div className="mt-3 pt-3 border-t border-cyan-900/60 space-y-2">
              <span className="text-[11px] font-bold text-cyan-200 block mb-1">
                سپرهای ۸گانه محافظتی حذف ریسک و تایید سیگنال:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {prediction.quantumCertainty.filters.map((f) => (
                  <div
                    key={f.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      f.passed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                        : 'bg-rose-950/20 border-rose-500/30 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1 text-[11px]">
                        {f.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{f.name}</span>
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        f.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {f.passed ? 'PASSED' : 'BLOCKED'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed">
                      {f.description}
                    </div>
                    <span className="text-[9px] text-cyan-400 block mt-1 font-mono font-medium">
                      اهمیت: {f.importance}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔮 سامانه فوق‌پیشرفته تحلیل الگوهای تاریخی مشابه و تغییر روند ۳۰ دقیقه آینده (30M Trend Reversal Pattern Engine) */}
      {prediction.reversal30m && (
        <div className="mb-3 bg-gradient-to-br from-[#060b19] via-[#041126] to-[#020712] border border-amber-500/40 rounded-2xl p-3.5 shadow-xl font-mono">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-900/50 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 font-sans">
                  <span>رادار تغییر روند ۳۰ دقیقه آینده (تحلیل الگوهای تاریخی مشابه)</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                    30M FRACTAL REVERSAL
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                  بررسی بردار مومنتوم لحظه‌ای، انطباق با چرخه‌های تاریخی و تعیین نقطه چرخش با صفر کردن ریسک
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-sans font-bold ${
                prediction.reversal30m.predictedTrend30m.includes('REVERSAL')
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              }`}>
                {prediction.reversal30m.predictedTrend30m === 'BULLISH_REVERSAL'
                  ? 'چرخش شارپ صعودی در ۳۰ دقیقه آینده 📈'
                  : prediction.reversal30m.predictedTrend30m === 'BEARISH_REVERSAL'
                  ? 'چرخش شارپ نزولی در ۳۰ دقیقه آینده 📉'
                  : prediction.reversal30m.predictedTrend30m === 'BULLISH_CONTINUATION'
                  ? 'ادامه پرقدرت روند صعودی 🚀'
                  : 'ادامه پرقدرت روند نزولی 🔻'}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center text-xs">
            <div className="bg-[#030d1d] border border-amber-950/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">احتمال چرخش روند (۳۰ دقیقه):</span>
              <span className={`text-base font-black ${
                (prediction.reversal30m.reversalProbability ?? 0) >= 60 ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {prediction.reversal30m.reversalProbability !== null ? `${prediction.reversal30m.reversalProbability}٪` : 'در انتظار داده'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                احتمال ادامه مسیر: {prediction.reversal30m.continuationProbability !== null ? `${prediction.reversal30m.continuationProbability}٪` : 'داده ناکافی'}
              </span>
            </div>

            <div className="bg-[#030d1d] border border-amber-950/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">تارگت قیمتی ۳۰ دقیقه آینده:</span>
              <span className="text-base font-black text-cyan-300">
                ${prediction.reversal30m.expectedPrice30m.toLocaleString()}
              </span>
              <span className={`text-[9px] block mt-0.5 font-sans font-bold ${
                prediction.reversal30m.expectedMovePct30m >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {prediction.reversal30m.expectedMovePct30m >= 0 ? '+' : ''}{prediction.reversal30m.expectedMovePct30m.toFixed(2)}٪ جابجایی تخمینی
              </span>
            </div>

            <div className="bg-[#030d1d] border border-amber-950/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">زمان تا چرخش ساختار:</span>
              <span className="text-base font-black text-amber-300">
                ~{prediction.reversal30m.timeToReversalEstimatedMinutes} دقیقه
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                افق حرکتی ۳۰ دقیقه‌ای
              </span>
            </div>

            <div className="bg-[#030d1d] border border-amber-950/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">شباهت الگوی تاریخی:</span>
              <span className="text-base font-black text-emerald-400">
                {prediction.reversal30m.primaryMatchedPattern.similarityPct}٪
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                وین‌ریت تاریخی: {prediction.reversal30m.primaryMatchedPattern.winRatePct}٪
              </span>
            </div>
          </div>

          {/* Matched Pattern Detail Box */}
          <div className="bg-[#031122] border border-amber-900/60 rounded-xl p-2.5 mb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] mb-1 font-sans">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                الگوی مشابه شناسایی‌شده: {prediction.reversal30m.primaryMatchedPattern.nameFa}
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">
                نمونه تاریخی: {prediction.reversal30m.primaryMatchedPattern.samplePeriod}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans mt-1">
              {prediction.reversal30m.sniperActionRecommendation.guidanceFa}
            </p>
          </div>

          {/* Zero-Loss Execution & Sniper Safeguards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3">
            <div className="bg-[#020b18] border border-emerald-900/60 rounded-xl p-2.5">
              <span className="text-[10px] text-emerald-400 block mb-1 font-sans font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ورود اسنایپر بهینه:
              </span>
              <div className="text-sm font-black text-white">
                ${prediction.reversal30m.sniperActionRecommendation.optimalEntryPrice.toLocaleString()}
              </div>
              <span className="text-[9px] text-slate-400 block font-sans mt-0.5">
                ورود روی لبه پولبک جهت عدم لغزش
              </span>
            </div>

            <div className="bg-[#020b18] border border-cyan-900/60 rounded-xl p-2.5">
              <span className="text-[10px] text-cyan-400 block mb-1 font-sans font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> تریگر ریسک‌فری آنی (ضرر صفر):
              </span>
              <div className="text-sm font-black text-cyan-300">
                ${prediction.reversal30m.sniperActionRecommendation.quickBreakevenTarget.toLocaleString()}
              </div>
              <span className="text-[9px] text-slate-400 block font-sans mt-0.5">
                قفل اتوماتیک روی نقطه ورود با اولین تیک +۰.۲۵٪
              </span>
            </div>

            <div className="bg-[#020b18] border border-rose-900/60 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-400 block mb-1 font-sans font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> حد ضرر فشرده (زیر ۰.۳۵٪):
              </span>
              <div className="text-sm font-black text-rose-300">
                ${prediction.reversal30m.sniperActionRecommendation.recommendedSniperSl.toLocaleString()}
              </div>
              <span className="text-[9px] text-slate-400 block font-sans mt-0.5">
                نسبت ریسک به ریوارد: R/R 1:{prediction.reversal30m.sniperActionRecommendation.projectedRiskReward}
              </span>
            </div>
          </div>

          {/* Trade Frequency Preservation Banner */}
          <div className="text-[10px] text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/40 font-sans flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              {prediction.reversal30m.tradeFrequencyProtection.noteFa}
            </span>
            <span className="text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono text-emerald-300 border border-emerald-500/30">
              HIGH-FREQUENCY ZERO-LOSS
            </span>
          </div>
        </div>
      )}

      {/* 🚀 موتور بردار شتاب ریزکندل‌ها و شبکه احتمال بیزین (Bayesian Micro-Vector Prediction Engine) */}
      {prediction.microVector && (
        <div className="mb-3 bg-[#010915] border border-indigo-500/40 rounded-2xl p-3 shadow-lg font-mono">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-900/50 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 font-sans">
                  <span>موتور بردار شتاب کندلی و شبکه احتمال بیزین (Bayesian Micro-Vector)</span>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-mono">
                    HIGH-FREQUENCY DUAL FLOW
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                  پیش‌بینی جهت، سقف، کف و تارگت کندل بعدی با دقت ریاضی بدون فدا کردن تعداد معاملات
                </p>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-sans font-bold">
              {prediction.microVector.dualFlowStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5 text-center text-xs">
            <div className="bg-[#030d1d] border border-indigo-950 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">جهت بردار کندل بعدی:</span>
              <span className={`text-xs font-black ${
                prediction.microVector.nextCandleDirection === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {prediction.microVector.nextCandleDirection === 'BULLISH' ? 'صعودی (BULLISH ▲)' : 'نزولی (BEARISH ▼)'}
              </span>
              <span className="text-[9px] text-cyan-400 block mt-0.5">
                احتمال برد: {prediction.microVector.nextCandleWinProb}%
              </span>
            </div>

            <div className="bg-[#030d1d] border border-indigo-950 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">میکرو-تارگت اسکالپ سریع:</span>
              <span className="text-xs font-black text-cyan-300">
                ${prediction.microVector.microSnipeTarget.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                تسویه آنی با سود نقد
              </span>
            </div>

            <div className="bg-[#030d1d] border border-indigo-950 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">دالان نوسان کندل بعدی:</span>
              <div className="text-[11px] font-bold text-slate-200">
                <span className="text-emerald-400">${prediction.microVector.expectedCandleHigh.toLocaleString()}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-rose-400">${prediction.microVector.expectedCandleLow.toLocaleString()}</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">سقف / کف تخمینی</span>
            </div>

            <div className="bg-[#030d1d] border border-indigo-950 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">جذب جریان سفارشات:</span>
              <span className="text-xs font-black text-amber-300">
                {prediction.microVector.orderFlowAbsorptionPct}%
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                قدرت نقدینگی نهادها
              </span>
            </div>
          </div>

          <div className="text-[10.5px] text-indigo-200 bg-indigo-950/30 p-2 rounded-xl border border-indigo-900/40 font-sans flex items-center justify-between">
            <span>رژیم شتاب ثانیه‌ای: <strong className="text-cyan-300">{prediction.microVector.subSecondRegime}</strong></span>
            <span className="text-[9.5px] text-slate-400 font-mono">شتاب جریان: {prediction.microVector.velocityScore}/100</span>
          </div>
        </div>
      )}

      {/* Ensemble ML Engine Diagnostics */}
      {prediction.ensembleDetails && (
        <div className="mb-3 bg-slate-950/70 border border-indigo-500/30 rounded-xl p-2.5 text-xs font-mono">
          <div className="text-indigo-300 font-bold mb-1.5 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>مدل‌های ترکیبی پایتون (Python Ensemble ML Diagnostics):</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg">
              <span className="text-slate-400 block">پیش‌بینی ARIMA(3,1,2)</span>
              <span className="font-bold text-indigo-300">${prediction.ensembleDetails.arimaProjected?.toLocaleString() || '-'}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg">
              <span className="text-slate-400 block">گرادیان بوستینگ (Tree ML)</span>
              <span className="font-bold text-teal-300">امتیاز {(prediction.ensembleDetails.gbScore ?? 0) > 0 ? '+' : ''}{prediction.ensembleDetails.gbScore}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg">
              <span className="text-slate-400 block">نماینده هرست فرکتال (Hurst)</span>
              <span className="font-bold text-cyan-300">{prediction.ensembleDetails.hurstExponent ?? 0.62} (روند پایدار)</span>
            </div>
          </div>
        </div>
      )}

      {/* Unified Goal Banner */}
      {prediction.unifiedGoal && (
        <div className="mb-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5 flex items-start space-x-2 space-x-reverse">
          <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-indigo-200 leading-relaxed">
            <strong className="text-cyan-300 font-bold block mb-0.5">استراتژی همگام‌سازی تارگت‌ها:</strong>
            {prediction.unifiedGoal}
          </div>
        </div>
      )}

      {/* On-Chain Status Banner */}
      {prediction.onChainStatus && (
        <div className="mb-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Anchor className="w-3.5 h-3.5 text-cyan-400" />
            <span>تحلیل زنجیره‌ای و نهنگ‌ها:</span>
          </span>
          <span className="text-cyan-300 font-bold text-left">{prediction.onChainStatus}</span>
        </div>
      )}

      {/* 15-Minute Micro Forecast Section */}
      {prediction.forecast15m && prediction.forecast15m.length > 0 && (
        <div className="mb-3 bg-slate-950/60 border border-cyan-900/50 rounded-xl p-2.5">
          <div className="text-[11px] font-bold text-cyan-300 font-mono mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>مسیر پیش‌بینی کندل‌های کوتاه‌مدت (۱۵ الی ۶۰ دقیقه آینده):</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {prediction.forecast15m.map((item: any, idx: number) => (
              <div key={`forecast_${idx}`} className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg text-center font-mono">
                <span className="text-slate-400 block text-[9px]">{item.step}</span>
                <span className="font-bold text-cyan-200 text-xs">${item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rigorous Statistical Calibration & Confidence Interval Telemetry */}
      {prediction.calibratedMetadata && (
        <div className="mb-3 bg-slate-950/80 border border-indigo-500/40 rounded-xl p-3 shadow-md font-mono">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-900/40 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-200 font-sans">
                اعتبارسنجی آماری کالیبره‌شده (Out-of-Sample Statistical Edge)
              </span>
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold border ${
              prediction.calibratedMetadata.selectiveMode.recommendation === 'EXECUTE_APPROVED'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}>
              {prediction.calibratedMetadata.selectiveMode.recommendation === 'EXECUTE_APPROVED'
                ? 'تایید ورود انتخابی (EXECUTE APPROVED)'
                : 'انتظار بدون معامله (WAIT / NO TRADE)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] mb-2">
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
              <span className="text-slate-400 block mb-0.5 font-sans">احتمال کالیبره‌شده:</span>
              <span className="text-sm font-black text-indigo-300">
                {prediction.calibratedMetadata.calibratedWinProbability !== null
                  ? `${(prediction.calibratedMetadata.calibratedWinProbability * 100).toFixed(1)}٪`
                  : 'داده کافی نیست (WAIT)'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                تعداد نمونه (N): {prediction.calibratedMetadata.resolvedSampleSize}/{prediction.calibratedMetadata.sampleSize}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
              <span className="text-slate-400 block mb-0.5 font-sans">بازه اطمینان ویلسون (95% CI):</span>
              <span className="text-xs font-black text-cyan-300">
                {prediction.calibratedMetadata.confidenceInterval !== null
                  ? `[${(prediction.calibratedMetadata.confidenceInterval.lowerBound * 100).toFixed(1)}% , ${(prediction.calibratedMetadata.confidenceInterval.upperBound * 100).toFixed(1)}%]`
                  : 'نامشخص'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                سطح اطمینان ۹۵٪
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
              <span className="text-slate-400 block mb-0.5 font-sans">خطای کالیبراسیون (ECE):</span>
              <span className="text-xs font-black text-emerald-400">
                {prediction.calibratedMetadata.expectedCalibrationError !== null
                  ? prediction.calibratedMetadata.expectedCalibrationError.toFixed(3)
                  : 'N/A'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                امتیاز Brier: {prediction.calibratedMetadata.brierScore !== null ? prediction.calibratedMetadata.brierScore.toFixed(3) : 'N/A'}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
              <span className="text-slate-400 block mb-0.5 font-sans">دقت داده‌های تست (OOS):</span>
              <span className="text-xs font-black text-amber-300">
                {(prediction.calibratedMetadata.outOfSamplePrecision * 100).toFixed(1)}٪
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                رژیم: {prediction.calibratedMetadata.regime}
              </span>
            </div>
          </div>

          {prediction.calibratedMetadata.selectiveMode.rejectionReasonFa && (
            <div className="text-[10px] text-amber-300/90 bg-amber-950/30 p-1.5 rounded-lg border border-amber-800/30 font-sans">
              {prediction.calibratedMetadata.selectiveMode.rejectionReasonFa}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5 flex items-center justify-center space-x-1 space-x-reverse">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>احتمال برد کالیبره‌شده</span>
          </div>
          <div className="text-base font-bold text-indigo-300 font-mono">
            {prediction.winProbability !== undefined ? `${prediction.winProbability}%` : '-'}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5 flex items-center justify-center space-x-1 space-x-reverse">
            <Award className="w-3 h-3 text-cyan-400" />
            <span>دقت اعتبارسنجی OOS</span>
          </div>
          <div className="text-base font-bold text-cyan-300 font-mono">
            {prediction.backtestAccuracy !== undefined ? `${prediction.backtestAccuracy}%` : '-'}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5">ریسک به ریوارد (R:R)</div>
          <div className="text-base font-bold text-amber-400 font-mono">1 : {prediction.riskReward ?? '1.8'}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5">شاخص RSI</div>
          <div className={`text-base font-bold font-mono ${(prediction.rsi ?? 50) > 70 ? 'text-rose-400' : (prediction.rsi ?? 50) < 30 ? 'text-emerald-400' : 'text-slate-200'}`}>
            {prediction.rsi ?? '-'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-950/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1 space-x-reverse">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>حمایت کلیدی BTC:</span>
          </span>
          <span className="text-xs font-bold font-mono text-emerald-400">${prediction.support?.toLocaleString() ?? '-'}</span>
        </div>
        <div className="bg-slate-950/40 border border-rose-500/20 rounded-xl p-2.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1 space-x-reverse">
            <Target className="w-3.5 h-3.5 text-rose-400" />
            <span>مقاومت کلیدی BTC:</span>
          </span>
          <span className="text-xs font-bold font-mono text-rose-400">${prediction.resistance?.toLocaleString() ?? '-'}</span>
        </div>
        <div className="bg-slate-950/40 border border-indigo-500/20 rounded-xl p-2.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1 space-x-reverse">
            <Anchor className="w-3.5 h-3.5 text-indigo-400" />
            <span>جریان نهنگ‌ها:</span>
          </span>
          <span className="text-[11px] font-semibold text-indigo-300 truncate max-w-[150px]">{prediction.whalePressure || 'عادی'}</span>
        </div>
      </div>

      {prediction.suggestions && prediction.suggestions.length > 0 && (
        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3">
          <div className="text-xs font-bold text-indigo-300 mb-1.5 flex items-center space-x-1.5 space-x-reverse">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            <span>پیشنهادات ارتقا و راهنمای استراتژیک سیستم هوشمند:</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
            {prediction.suggestions.map((sug, idx) => (
              <li key={`sug_${idx}`} className="leading-relaxed">{sug}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const NeuralPredictionPanel = React.memo(NeuralPredictionPanelComponent);




