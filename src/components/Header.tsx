import React, { useEffect, useState } from 'react';
import { Activity, Clock, RefreshCw, Zap } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isFetching: boolean;
  source: string;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isFetching, source }) => {
  const [timeLeft, setTimeLeft] = useState({ mm: '00', ss: '00', remaining: 0, progress: 0 });
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const utcSeconds = now.getUTCMinutes() * 60 + now.getUTCSeconds();
      const secondsPassed = utcSeconds % 900; // 15 mins = 900s
      const remaining = 900 - secondsPassed;
      const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
      const ss = (remaining % 60).toString().padStart(2, '0');
      const progress = Math.round(((900 - remaining) / 900) * 100);

      setTimeLeft({ mm, ss, remaining, progress });
      setUtcTime(now.toUTCString().slice(17, 25));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const timerColor =
    timeLeft.remaining > 300
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : timeLeft.remaining > 120
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/40 bg-rose-500/10 animate-pulse';

  return (
    <header className="border-b border-cyan-900/40 bg-[#030d1a]/95 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base md:text-lg font-bold tracking-wider text-white flex items-center gap-1.5">
                  <span className="text-cyan-400">◈</span> QUANTUM TRADE <span className="text-cyan-400 text-xs px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">PRO v4.0</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isFetching}
            className="md:hidden p-2 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 hover:text-cyan-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Center: 15-min Candle Timer Bar */}
        <div className="flex items-center gap-3 bg-[#06182a] border border-cyan-800/50 rounded-xl px-4 py-2 w-full md:w-auto justify-center shadow-inner">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">بسته شدن کندل ۱۵ دقیقه‌ای:</span>
          </div>

          <div className={`px-2.5 py-0.5 rounded-lg border font-mono font-bold text-sm tracking-wider ${timerColor}`}>
            {timeLeft.mm}:{timeLeft.ss}
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-r border-cyan-900/60">
            <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_#22d3ee]"
                style={{ width: `${timeLeft.progress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-cyan-300/70">{timeLeft.progress}%</span>
          </div>
        </div>

        {/* Right side stats & Refresh */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-[11px]">ONLINE</span>
            <span className="text-slate-400 text-[10px]">({source})</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isFetching}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-cyan-600/50 hover:border-cyan-400 text-cyan-200 hover:text-white transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="font-sans text-xs">به‌روزرسانی داده‌ها</span>
          </button>
        </div>
      </div>
    </header>
  );
};
