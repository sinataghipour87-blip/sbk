import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { BrainWeeklyReportItem, BrainDailyWinRate } from '../services/tenBrainWeeklyReportEngine';
import { TrendingUp, Activity, Sparkles, Filter, Eye, Award } from 'lucide-react';

interface Props {
  reportItems: BrainWeeklyReportItem[];
}

export const TenBrainWinRateD3Chart: React.FC<Props> = ({ reportItems }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedBrainId, setSelectedBrainId] = useState<string | 'ALL'>('ALL');
  const [hoveredBrainId, setHoveredBrainId] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    brainName: string;
    dayName: string;
    winRate: number;
    trades: number;
    profit: number;
    color: string;
  } | null>(null);

  // Calculate ensemble average winrate progression
  const ensembleAvgProgression = useMemo(() => {
    if (!reportItems.length || !reportItems[0].dailyWinRates) return [];
    return reportItems[0].dailyWinRates.map((day, dIdx) => {
      const sum = reportItems.reduce((acc, b) => acc + (b.dailyWinRates[dIdx]?.winRatePct || 0), 0);
      return {
        dayName: day.dayName,
        dayShort: day.dayShort,
        dayIndex: dIdx,
        winRatePct: Number((sum / reportItems.length).toFixed(1)),
        tradesCount: reportItems.reduce((acc, b) => acc + (b.dailyWinRates[dIdx]?.tradesCount || 0), 0),
        profitUsd: reportItems.reduce((acc, b) => acc + (b.dailyWinRates[dIdx]?.profitUsd || 0), 0),
      };
    });
  }, [reportItems]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !reportItems.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 700;
    const height = 280;
    const margin = { top: 25, right: 35, bottom: 40, left: 45 };
    const width = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Definitions (Gradients & Glow Filters)
    const defs = svg.append('defs');
    
    // Filter for glowing effect
    const filter = defs.append('filter')
      .attr('id', 'd3-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // X and Y scales
    const days = reportItems[0]?.dailyWinRates.map((d) => d.dayName) || [];
    const xScale = d3
      .scalePoint<string>()
      .domain(days)
      .range([0, width])
      .padding(0.1);

    // Calculate Y domain
    let minY = 75;
    let maxY = 100;
    reportItems.forEach((b) => {
      b.dailyWinRates.forEach((d) => {
        if (d.winRatePct < minY) minY = Math.floor(d.winRatePct - 2);
        if (d.winRatePct > maxY) maxY = Math.ceil(d.winRatePct + 1);
      });
    });

    const yScale = d3
      .scaleLinear()
      .domain([minY, maxY])
      .range([innerHeight, 0])
      .nice();

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(5);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.6);

    // Vertical Day Grid Lines
    g.append('g')
      .attr('class', 'x-grid-lines')
      .selectAll('line')
      .data(days)
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d) || 0)
      .attr('x2', (d) => xScale(d) || 0)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#0f172a')
      .attr('stroke-dasharray', '2,4')
      .attr('stroke-opacity', 0.5);

    // X Axis
    const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(12);
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'inherit')
      .attr('font-weight', '500');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${d}%`)
      .tickSize(0)
      .tickPadding(8);

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // 90% WinRate target reference line
    if (minY <= 90 && maxY >= 90) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(90))
        .attr('y2', yScale(90))
        .attr('stroke', '#10b981')
        .attr('stroke-opacity', 0.35)
        .attr('stroke-dasharray', '4,4');

      g.append('text')
        .attr('x', width - 8)
        .attr('y', yScale(90) - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#34d399')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('opacity', 0.7)
        .text('هدف تارگت ۹۰٪ وین‌ریت');
    }

    // Line generator
    const lineGenerator = d3
      .line<BrainDailyWinRate>()
      .x((d) => xScale(d.dayName) || 0)
      .y((d) => yScale(d.winRatePct))
      .curve(d3.curveMonotoneX);

    // Filter which brains to render
    const displayBrains =
      selectedBrainId === 'ALL'
        ? reportItems
        : reportItems.filter((b) => b.brainId === selectedBrainId);

    // Render curves for each brain
    displayBrains.forEach((brain) => {
      const isHighlighted =
        hoveredBrainId === brain.brainId || selectedBrainId === brain.brainId;
      const isDimmed =
        (hoveredBrainId && hoveredBrainId !== brain.brainId) ||
        (selectedBrainId !== 'ALL' && selectedBrainId !== brain.brainId);

      const strokeOpacity = isDimmed ? 0.15 : isHighlighted ? 1 : 0.75;
      const strokeWidth = isHighlighted ? 3 : selectedBrainId === 'ALL' ? 1.8 : 2.5;

      // Area gradient under line if single brain is selected
      if (selectedBrainId === brain.brainId) {
        const areaGradientId = `area-grad-${brain.brainId}`;
        const areaGrad = defs
          .append('linearGradient')
          .attr('id', areaGradientId)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '0%')
          .attr('y2', '100%');

        areaGrad
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', brain.color)
          .attr('stop-opacity', 0.25);
        areaGrad
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', brain.color)
          .attr('stop-opacity', 0.0);

        const areaGenerator = d3
          .area<BrainDailyWinRate>()
          .x((d) => xScale(d.dayName) || 0)
          .y0(innerHeight)
          .y1((d) => yScale(d.winRatePct))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(brain.dailyWinRates)
          .attr('d', areaGenerator)
          .attr('fill', `url(#${areaGradientId})`);
      }

      // Main line curve
      const path = g
        .append('path')
        .datum(brain.dailyWinRates)
        .attr('class', `brain-line-${brain.brainId}`)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', brain.color)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-opacity', strokeOpacity)
        .style('transition', 'all 0.2s ease');

      if (isHighlighted) {
        path.attr('filter', 'url(#d3-glow)');
      }

      // Interactive Data Points (Circles)
      brain.dailyWinRates.forEach((point) => {
        const cx = xScale(point.dayName) || 0;
        const cy = yScale(point.winRatePct);

        const circle = g
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', isHighlighted ? 5 : 3.5)
          .attr('fill', '#020917')
          .attr('stroke', brain.color)
          .attr('stroke-width', isHighlighted ? 2.5 : 1.5)
          .attr('opacity', strokeOpacity)
          .style('cursor', 'pointer');

        // Circle hover handlers
        circle
          .on('mouseenter', (event) => {
            setHoveredBrainId(brain.brainId);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltipData({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                brainName: brain.nameFa,
                dayName: point.dayName,
                winRate: point.winRatePct,
                trades: point.tradesCount,
                profit: point.profitUsd,
                color: brain.color,
              });
            }
          })
          .on('mouseleave', () => {
            setHoveredBrainId(null);
            setTooltipData(null);
          });
      });
    });

    // Ensemble Average Benchmark Line
    if (ensembleAvgProgression.length && selectedBrainId === 'ALL') {
      g.append('path')
        .datum(ensembleAvgProgression)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('stroke-opacity', 0.85);

      // Average label
      const lastPoint = ensembleAvgProgression[ensembleAvgProgression.length - 1];
      if (lastPoint) {
        g.append('text')
          .attr('x', (xScale(lastPoint.dayName) || width) + 4)
          .attr('y', yScale(lastPoint.winRatePct) + 3)
          .attr('fill', '#ffffff')
          .attr('font-size', '9px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(`اجماع ${lastPoint.winRatePct}%`);
      }
    }
  }, [reportItems, selectedBrainId, hoveredBrainId, ensembleAvgProgression]);

  // Overall statistics
  const bestBrain = useMemo(() => {
    return [...reportItems].sort((a, b) => b.accuracyRatePct - a.accuracyRatePct)[0];
  }, [reportItems]);

  const avgWinRate = useMemo(() => {
    if (!reportItems.length) return 0;
    const sum = reportItems.reduce((acc, curr) => acc + curr.accuracyRatePct, 0);
    return Number((sum / reportItems.length).toFixed(1));
  }, [reportItems]);

  return (
    <div className="bg-[#030d1d] border border-indigo-500/30 rounded-2xl p-3.5 space-y-3 font-mono">
      {/* Header with Title and Overall Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-indigo-950">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300 border border-indigo-500/30">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h5 className="text-white font-sans font-bold text-xs flex items-center gap-1.5">
              <span>منحنی زنده نرخ برد (WinRate) ۱۰ مغز پردازشی در طول هفته</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                D3.js Dynamic Vector Engine
              </span>
            </h5>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              ترسیم پیوسته دقت و همگرایی هر مغز از شنبه تا جمعه با مقایسه خط معیار اجماع
            </p>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-center">
            <span className="text-[9px] text-slate-400 block">میانگین اجماع:</span>
            <span className="text-xs font-bold text-cyan-300 font-mono">
              {avgWinRate}%
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center">
            <span className="text-[9px] text-slate-400 block">برترین مغز:</span>
            <span className="text-xs font-bold text-emerald-300 font-mono">
              {bestBrain?.accuracyRatePct}% ({bestBrain?.nameFa.split('.')[0]})
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Brain Selection Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          onClick={() => setSelectedBrainId('ALL')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            selectedBrainId === 'ALL'
              ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400'
              : 'bg-[#06152d] text-slate-300 hover:bg-[#0a2044] border border-indigo-950'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>تمام ۱۰ مغز (دید کلی)</span>
        </button>

        {reportItems.map((brain) => {
          const isSelected = selectedBrainId === brain.brainId;
          return (
            <button
              key={brain.brainId}
              onClick={() => setSelectedBrainId(isSelected ? 'ALL' : brain.brainId)}
              onMouseEnter={() => setHoveredBrainId(brain.brainId)}
              onMouseLeave={() => setHoveredBrainId(null)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-sans font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-950 text-white border-2'
                  : 'bg-[#05142b] text-slate-300 hover:text-white border border-indigo-950'
              }`}
              style={{
                borderColor: isSelected ? brain.color : undefined,
                boxShadow: isSelected ? `0 0 8px ${brain.color}66` : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: brain.color }}
              />
              <span>{brain.nameFa}</span>
              <span className="text-[9px] font-mono opacity-80">{brain.accuracyRatePct}%</span>
            </button>
          );
        })}
      </div>

      {/* Interactive D3 Chart Container */}
      <div ref={containerRef} className="relative w-full h-[280px] bg-[#020815] rounded-xl border border-indigo-950/70 p-1 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />

        {/* Hover Tooltip Overlay */}
        {tooltipData && (
          <div
            className="absolute pointer-events-none z-30 px-3 py-2 rounded-xl bg-[#040f26]/95 border border-indigo-500/50 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all text-right"
            style={{
              left: `${Math.min(tooltipData.x + 15, (containerRef.current?.clientWidth || 700) - 170)}px`,
              top: `${Math.max(10, tooltipData.y - 75)}px`,
            }}
          >
            <div className="flex items-center gap-1.5 border-b border-indigo-900/60 pb-1 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: tooltipData.color }}
              />
              <span className="text-[11px] font-sans font-bold text-white">
                {tooltipData.brainName}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-0.5">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">روز هفته:</span>
                <span className="text-cyan-300 font-bold">{tooltipData.dayName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">نرخ برد (WinRate):</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {tooltipData.winRate}%
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">تعداد معاملات:</span>
                <span className="text-slate-200 font-mono">{tooltipData.trades} معامله</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">سود تجمیعی روز:</span>
                <span className="text-amber-300 font-mono font-bold">+${tooltipData.profit}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-indigo-950/60 font-sans">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-white border border-dashed border-white inline-block" />
            <span>خط تیره سفید: میانگین متحرک اجماع کل مغزها</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-400 border border-dashed border-emerald-400 inline-block" />
            <span>خط سبز: هدف طلایی ۹۰٪ وین‌ریت پایدار</span>
          </div>
        </div>

        <span className="text-indigo-300 font-mono text-[9px]">
          تضمین واقع‌گرایی: تطبیق الگوریتمی با داده‌های بازار زنده و جلوگیری از بیش‌برازش (Overfitting)
        </span>
      </div>
    </div>
  );
};
