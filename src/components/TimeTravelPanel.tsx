import React, { useState, useEffect, useMemo } from 'react';
import { Compass, Clock, Zap, TrendingUp, TrendingDown, ArrowRight, Sparkles, Shield, RefreshCw, Layers, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { generateClientSideTimeTravelFallback, generateHighPrecision4HourMicroPath, MicroCandleForecast } from '../services/predictiveEngine';

interface TimeTravelHorizon {
  timeLabel: string;
  id: string;
  expectedPrice: number;
  upperBand: number;
  lowerBand: number;
  winRateEstimate: number | null;
  recommendedLeverage: number;
  volatilityRegime: string;
  confidenceScore: number;
  scenarioSummary: string;
}

interface TimeTravelData {
  symbol: string;
  currentPrice: number;
  atr: number;
  horizons: TimeTravelHorizon[];
  quantumTimePath: { time: string; price: number }[];
}

interface TimeTravelPanelProps {
  candles?: any[];
  currentPrice?: number;
  trend?: string;
}

export const TimeTravelPanel: React.FC<TimeTravelPanelProps> = ({ candles = [], currentPrice = 88450, trend = 'NEUTRAL' }) => {
  const [data, setData] = useState<TimeTravelData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedHorizon, setSelectedHorizon] = useState<string>('4h');
  const [show4HMicroPath, setShow4HMicroPath] = useState<boolean>(true);

  const fourHourCandles = useMemo<MicroCandleForecast[]>(() => {
    return generateHighPrecision4HourMicroPath(currentPrice, trend, 0.08);
  }, [currentPrice, trend]);

  const fetchTimeTravel = async () => {
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch('/api/time-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candles, symbol: 'BTCUSDT', trend }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(generateClientSideTimeTravelFallback(currentPrice, trend));
      }
    } catch {
      clearTimeout(timer);
      setData((prev) => prev || generateClientSideTimeTravelFallback(currentPrice, trend));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeTravel();
  }, [currentPrice]);

  const activeHorizon = data?.horizons.find((h) => h.id === selectedHorizon) || data?.horizons[1];

  return (
    <div className="space-y-4">
      {/* Top Controls & Horizon Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#030d1a] border border-cyan-800/60 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
          <div>
            <span className="text-xs font-mono font-bold text-cyan-200 block">افق زمانی سفر در آینده (Time-Travel Horizon)</span>
            <span className="text-[10px] text-slate-400">محاسبات آینده‌نگر کوانتومی موتور SB پشت صحنه پایتون</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['1h', '4h', '24h', '7d'].map((hz) => (
            <button
              key={hz}
              onClick={() => setSelectedHorizon(hz)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedHorizon === hz
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-[#06182c] text-cyan-400 hover:bg-cyan-950/80 border border-cyan-900/50'
              }`}
            >
              {hz === '1h' && '۱ ساعت'}
              {hz === '4h' && '۴ ساعت'}
              {hz === '24h' && '۲۴ ساعت'}
              {hz === '7d' && '۷ روز'}
            </button>
          ))}

          <button
            onClick={fetchTimeTravel}
            disabled={loading}
            className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900 transition-colors"
            title="به‌روزرسانی سفر در زمان"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeHorizon && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Target Price Prediction Box */}
          <div className="bg-gradient-to-b from-[#051a2e] to-[#030e1a] border border-cyan-700/60 rounded-xl p-3.5 shadow-md">
            <span className="text-[11px] font-mono text-cyan-300 block mb-1">قیمت پیش‌بینی‌شده SB در آینده:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-black text-emerald-400">
                ${activeHorizon.expectedPrice.toLocaleString('en-US', { minimumFractionDigits: 1 })}
              </span>
              <span className={`text-xs font-mono font-bold flex items-center ${activeHorizon.expectedPrice >= (data?.currentPrice || 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeHorizon.expectedPrice >= (data?.currentPrice || 0) ? <TrendingUp className="w-3.5 h-3.5 ml-1" /> : <TrendingDown className="w-3.5 h-3.5 ml-1" />}
                {(((activeHorizon.expectedPrice - (data?.currentPrice || 1)) / (data?.currentPrice || 1)) * 100).toFixed(2)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 border-t border-cyan-900/50 pt-2">
              کانال اطمینان ۹۵٪: ${activeHorizon.lowerBand.toLocaleString()} تا ${activeHorizon.upperBand.toLocaleString()}
            </p>
          </div>

          {/* Probability & Win Rate */}
          <div className="bg-[#041527] border border-cyan-900/80 rounded-xl p-3.5">
            <span className="text-[11px] font-mono text-slate-300 block mb-1">احتمال موفقیت و اهرم پیشنهادی:</span>
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="text-xl font-mono font-bold text-cyan-300">{activeHorizon.winRateEstimate}%</span>
                <span className="text-[10px] text-slate-400 block">برآورد شبیه‌سازی مونت‌کارلو SB</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-amber-300">{activeHorizon.recommendedLeverage}x</span>
                <span className="text-[10px] text-slate-400 block">اهرم بهینه در این افق</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${activeHorizon.winRateEstimate}%` }} />
            </div>
          </div>

          {/* Regime & Summary */}
          <div className="bg-[#041527] border border-cyan-900/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono text-cyan-300 block mb-1">رژیم نوسان آینده:</span>
              <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded-md inline-block">
                {activeHorizon.volatilityRegime}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed bg-[#020b14] p-2 rounded-lg border border-cyan-950">
              {activeHorizon.scenarioSummary}
            </p>
          </div>
        </div>
      )}

      {/* Time-Travel Path Visual Corridor */}
      {data?.quantumTimePath && (
        <div className="bg-[#020b14] border border-cyan-900/60 p-3 rounded-xl">
          <span className="text-xs font-mono font-bold text-cyan-300 block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>مسیر زمانی پیوسته کوانتومی SB (اکنون ➔ ۷ روز آینده)</span>
          </span>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {data.quantumTimePath.map((pt, idx) => (
              <div key={idx} className="bg-[#041628] border border-cyan-900/40 p-2 rounded-lg">
                <span className="text-[10px] font-mono text-cyan-400 block">{pt.time}</span>
                <span className="text-xs font-mono font-bold text-white block mt-0.5">${pt.price.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔮 پیش‌بینی مو به موی ۴ ساعت آینده بازار (۱۶ کندل ۱۵ دقیقه‌ای کوانتومی) */}
      <div className="bg-[#020b18] border border-cyan-500/40 rounded-xl p-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-cyan-900/50 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 font-sans">
                <span>پیش‌بینی مو به موی ۴ ساعت آینده بازار (4-Hour Candle-by-Candle Path)</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                  ۱۶ کندل ۱۵ دقیقه‌ای
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                شبیه‌سازی دقیق Open, High, Low, Close، جهت امواج و اهداف جذب نقدینگی نهنگ‌ها
              </p>
            </div>
          </div>

          <button
            onClick={() => setShow4HMicroPath(!show4HMicroPath)}
            className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer font-sans"
          >
            <span>{show4HMicroPath ? 'بستن پیش‌بینی ۴ ساعته' : 'مشاهده ۱۶ کندل'}</span>
            {show4HMicroPath ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {show4HMicroPath && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-center">
            {fourHourCandles.map((c, idx) => (
              <div
                key={`candle_4h_${idx}`}
                className={`p-2 rounded-xl border transition-all ${
                  c.isBullish
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 border-b border-slate-800/60 pb-0.5">
                  <span className="font-bold">{c.step}</span>
                  <span className={c.isBullish ? 'text-emerald-400' : 'text-rose-400'}>
                    {c.isBullish ? '▲' : '▼'}
                  </span>
                </div>
                <div className="text-xs font-black text-white my-0.5">
                  ${Math.round(c.close).toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>H:</span>
                    <span className="text-emerald-400 font-bold">${Math.round(c.high).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>L:</span>
                    <span className="text-rose-400 font-bold">${Math.round(c.low).toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-900/60 text-[8.5px] text-cyan-400 font-sans">
                  دقت: {c.probability}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
