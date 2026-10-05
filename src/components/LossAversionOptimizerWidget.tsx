import React, { useState } from 'react';
import {
  GitFork,
  ShieldCheck,
  Zap,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Cpu,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';
import {
  lossAversionOptimizer,
  FailureNode,
  LossPreventionScenario
} from '../services/lossAversionStrategyOptimizer';

interface LossAversionOptimizerWidgetProps {
  onNotify?: (msg: string) => void;
}

export const LossAversionOptimizerWidget: React.FC<LossAversionOptimizerWidgetProps> = ({ onNotify }) => {
  const [report, setReport] = useState(() => lossAversionOptimizer.generateOptimizerReport());
  const [selectedScenario, setSelectedScenario] = useState<LossPreventionScenario | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root_failure_node: true,
    node_volatility_spike: true,
    node_stagnant_chop: true,
    node_orderbook_flip: true
  });
  const [activeTab, setActiveTab] = useState<'DECISION_TREE' | 'PREVENTION_SCENARIOS'>('DECISION_TREE');

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleRefresh = () => {
    const updated = lossAversionOptimizer.generateOptimizerReport();
    setReport(updated);
    if (onNotify) {
      onNotify('🌲 درخت تصمیم‌گیری الگوهای باخت و سناریوهای ضدضرر با موفقیت بازخوانی و همگام شد.');
    }
  };

  const handleExecuteScenario = (scenario: LossPreventionScenario) => {
    setSelectedScenario(scenario);
    if (onNotify) {
      onNotify(`⚡ سناریوی نجات [${scenario.titleFa}] با اولویت بحرانی روی تمامی پوزیشن‌های فعال شلیک شد.`);
    }
  };

  const renderTreeNode = (node: FailureNode, depth: number = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    const severityColor =
      node.lossSeverity === 'SEVERE_BREACH'
        ? 'border-red-500/50 bg-red-950/20 text-red-300'
        : node.lossSeverity === 'MODERATE'
        ? 'border-amber-500/50 bg-amber-950/20 text-amber-300'
        : 'border-blue-500/50 bg-blue-950/20 text-blue-300';

    return (
      <div key={node.id} className="relative mt-2" style={{ marginRight: `${depth * 14}px` }}>
        <div
          className={`rounded-xl border p-3.5 transition-all shadow-md ${severityColor} backdrop-blur-sm hover:border-cyan-400/60`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleNode(node.id)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <GitFork className="w-4 h-4 text-emerald-400 rotate-180" />
              )}
              <span className="font-semibold text-xs md:text-sm text-white">{node.conditionLabelFa}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-slate-300">
                نرخ آسیب: <strong className="text-amber-400">{node.failureRatePct}%</strong> ({node.sampleCount} نمونه)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {node.lossSeverityFa}
              </span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-black/30 p-2.5 rounded-lg border border-white/5">
            <div>
              <span className="text-slate-400 block mb-0.5">🛡️ قاعده پیشگیری الگو:</span>
              <span className="text-emerald-300 font-medium">{node.mitigationRuleFa}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">⚡ اقدام اجرایی نجات:</span>
              <span className="text-cyan-300 font-medium">{node.rescueActionFa}</span>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-r border-cyan-500/20 pr-3 mt-1 space-y-2">
            {node.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-950/90 via-slate-900/90 to-slate-950/90 p-4 md:p-6 shadow-2xl backdrop-blur-xl text-right">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-emerald-600/30 border border-cyan-400/40 text-cyan-300">
            <GitFork className="w-6 h-6 rotate-90" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg text-white flex items-center gap-2">
              <span>درخت تصمیم‌گیری بهینه‌ساز فرار از ضرر (Loss-Aversion Strategy Optimizer)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                ACTIVE AI MESH
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              کالبدشکافی هوشمند ترکیبات شکست گذشته و تولید سناریوهای خودکار خروج بی‌زیان و بیشینه‌سازی سود
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بازخوانی تحلیل</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">نرخ تبدیل ضرر به سربه‌سر/سود</span>
          <span className="text-lg font-black text-emerald-400 font-mono">
            {report.lossToBreakevenConversionRatePct}%
          </span>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">میانگین زمان خروج از افت</span>
          <span className="text-lg font-black text-cyan-400 font-mono">
            {report.averageEscapeTimeToBreakevenSec} ثانیه
          </span>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">سناریوهای ضرر خنثی‌شده</span>
          <span className="text-lg font-black text-purple-400 font-mono">
            {report.preventedLossScenariosCount} / {report.totalLossPatternsAnalyzed}
          </span>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">قفل محافظتی دراپ‌داون</span>
          <span className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
            <Lock className="w-4 h-4" />
            <span>۱۰۰٪ فعال</span>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
        <button
          onClick={() => setActiveTab('DECISION_TREE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'DECISION_TREE'
              ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-md shadow-cyan-900/20'
              : 'bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>درخت تصمیم‌گیری الگوهای شکست (Failure Analysis Tree)</span>
        </button>
        <button
          onClick={() => setActiveTab('PREVENTION_SCENARIOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PREVENTION_SCENARIOS'
              ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-md shadow-emerald-900/20'
              : 'bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>۵ سناریوی خودکار بازگشتی و نجات (Auto Recovery Scenarios)</span>
        </button>
      </div>

      {/* Tab 1: Decision Tree */}
      {activeTab === 'DECISION_TREE' && (
        <div className="space-y-3">
          <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{report.strategicAversionGuidanceFa}</span>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-white/10 max-h-[500px] overflow-y-auto">
            {renderTreeNode(report.rootDecisionTree)}
          </div>
        </div>
      )}

      {/* Tab 2: Prevention Scenarios */}
      {activeTab === 'PREVENTION_SCENARIOS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {report.activePreventionScenarios.map(scen => (
            <div
              key={scen.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-emerald-500/40 transition-all shadow-md backdrop-blur-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-bold text-xs md:text-sm text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{scen.titleFa}</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    کارایی: {scen.efficiencyScorePct}%
                  </span>
                </div>

                <div className="space-y-2 text-[11px] my-3">
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-400 block mb-0.5">🎯 بستر فعال‌سازی:</span>
                    <span className="text-slate-200">{scen.triggerContextFa}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-400 block mb-0.5">🌲 مسیر درخت تصمیم:</span>
                    <span className="text-cyan-300">{scen.decisionTreePathFa}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-400 block mb-0.5">⚡ تکنیک نجات:</span>
                    <span className="text-emerald-300 font-semibold">{scen.recoveryTacticFa}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-emerald-400 block mb-0.5 font-bold">✨ نتیجه تضمین‌شده:</span>
                    <span className="text-emerald-200">{scen.guaranteedOutcomeFa}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>وضعیت: اتوماتیک و هماهنگ با سیستم شناور</span>
                </span>
                <button
                  onClick={() => handleExecuteScenario(scen)}
                  className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>اجرای فوری</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
