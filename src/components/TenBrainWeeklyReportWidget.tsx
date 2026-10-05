import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Award,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Sliders,
  LineChart
} from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { generateTenBrainWeeklyReport, BrainWeeklyReportItem } from '../services/tenBrainWeeklyReportEngine';
import { TenBrainWinRateD3Chart } from './TenBrainWinRateD3Chart';

interface Props {
  recentHistory?: any[];
}

export const TenBrainWeeklyReportWidget: React.FC<Props> = ({ recentHistory = [] }) => {
  const [reportItems, setReportItems] = useState<BrainWeeklyReportItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'D3_CHART' | 'COMPARISON'>('D3_CHART');

  useEffect(() => {
    const items = generateTenBrainWeeklyReport(recentHistory);
    setReportItems(items);
  }, [recentHistory]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const items = generateTenBrainWeeklyReport(recentHistory);
      setReportItems(items);
      setIsRefreshing(false);
    }, 600);
  };

  if (reportItems.length === 0) return null;

  return (
    <CollapsibleCard
      title="گزارش هفتگی عملکرد ۱۰ مغز پردازشی (سود خالص و نرخ دقت مقایسه‌ای)"
      badge="گزارش عملکرد هفتگی مغزها"
      badgeColor="text-indigo-300 bg-indigo-950/80 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
      defaultOpen={true}
      icon={<Award className="w-5 h-5 text-indigo-400 animate-pulse" />}
      headerAction={
        <div className="flex items-center gap-2">
          <div className="flex bg-[#040e21] p-0.5 rounded-lg border border-indigo-950">
            <button
              onClick={() => setActiveTab('D3_CHART')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold flex items-center gap-1 transition-all ${
                activeTab === 'D3_CHART'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3 h-3" />
              <span>منحنی D3.js</span>
            </button>
            <button
              onClick={() => setActiveTab('COMPARISON')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold flex items-center gap-1 transition-all ${
                activeTab === 'COMPARISON'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>جدول مقایسه</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 font-mono text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'بروزرسانی...' : 'محاسبه مجدد'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-3 font-mono text-xs">
        {/* D3.js WinRate Progression Chart */}
        <TenBrainWinRateD3Chart reportItems={reportItems} />

        {activeTab === 'COMPARISON' && (
          <div className="bg-[#020917] border border-indigo-500/30 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-950">
              <div>
                <h4 className="text-white font-bold font-sans text-sm">مقایسه سودآوری و دقت سیگنال‌دهی مغزهای کوانتومی (هفته جاری)</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">شفاف‌سازی وزن‌دهی خودکار مبتنی بر عملکرد هفتگی واقعی</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-xs font-bold font-mono">
                کل سود هفتگی مغزها: +${reportItems.reduce((acc, curr) => acc + curr.netProfitUsd, 0).toLocaleString()}
              </span>
            </div>

            {/* Comparative Bar Chart Grid */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {reportItems.map((item) => (
                <div key={item.brainId} className="bg-[#041124] p-3 rounded-xl border border-indigo-950/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-sans font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.nameFa}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold">سود خالص: +${item.netProfitUsd.toLocaleString()}</span>
                      <span className="text-cyan-300">دقت: {item.accuracyRatePct}%</span>
                      <span className="text-indigo-300">وزن: {item.assignedWeightPct}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>سودآوری</span>
                        <span>{item.netProfitUsd}$</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-indigo-950">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (item.netProfitUsd / 500) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>نرخ دقت</span>
                        <span>{item.accuracyRatePct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-indigo-950">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.accuracyRatePct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#040e21] p-3 rounded-xl border border-indigo-900/40 text-[11px] text-slate-200 leading-relaxed font-sans flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>وزن‌دهی خودکار سیستم به طور هوشمند بر اساس خروجی این گزارش هفتگی کالیبره می‌شود تا مغزهای با سوددهی بالاتر نقش اصلی را در اجماع ایفا کنند.</span>
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
};
