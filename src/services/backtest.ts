import { Candle, AnalysisResult } from '../types/trading';
import { analyzePro } from './analysisEngine';
import {
  evaluateSharedStrategy,
  resolveIntrabarExecution,
  calculateDynamicExecutionCost,
  runWalkForwardAnalysis,
  runMultiRegimeStressAudit,
  simulateWindowTrades,
  StrategyParameters,
  DEFAULT_STRATEGY_PARAMS,
  STRATEGY_PARAMETER_REGISTRY,
  IntrabarResolutionMode,
  ExchangeTier,
  OrderExecutionType,
  WalkForwardReport,
  AntiOverfitAudit,
  SimulationSummary,
  SimulatedTradeRecord,
  TradeOutcomeCategory,
  BacktestExecutionMode,
} from './sharedStrategyCore';

export interface AdvancedBacktestConfig {
  capital?: number;
  leverage?: number;
  exchange?: ExchangeTier;
  orderType?: OrderExecutionType;
  intrabarMode?: IntrabarResolutionMode;
  params?: Partial<StrategyParameters>;
}

export interface AdvancedBacktestReport {
  // ۱۶. تفکیک دو حالت جداگانه:
  pureSignal: SimulationSummary;
  fullManagement: SimulationSummary;
  summary: {
    initialCapital: number;
    finalCapital: number;
    netProfitUsd: number;
    roiPercent: number;
    strictWinRate: number; // Win / (Win + Loss)
    breakevenRate: number;
    totalTrades: number;
    winCount: number;
    lossCount: number;
    breakevenCount: number;
    partialWinCount: number;
    partialLossCount: number;
    timeoutCount: number;
    liquidationCount: number;
    maxDrawdownPercent: number;
    totalFeesPaidUsd: number;
    totalSlippagePaidUsd: number;
    profitFactor: number;
    averageR: number;
    expectancyR: number;
    expectancyUsd: number;
    maeAvgPct: number;
    mfeAvgPct: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    confidenceInterval95: {
      winRateMin: number;
      winRateMax: number;
      expectedReturnMin: number;
      expectedReturnMax: number;
    };
  };
  trades: Array<{
    id: number;
    entryIdx: number;
    exitIdx: number;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    pnlUsd: number;
    rMultiple: number;
    maePct: number;
    mfePct: number;
    outcome: TradeOutcomeCategory;
    isWin: boolean;
    isBreakeven: boolean;
    reason: string;
    frictionUsd: number;
    mode: BacktestExecutionMode;
  }>;
  walkForward: WalkForwardReport;
  antiOverfit: AntiOverfitAudit;
}

/**
 * بکتست استاندارد سازگار با کدهای قبلی
 */
export const runBacktest = (candles: Candle[]): AnalysisResult[] => {
  if (candles.length < 100) return [];
  const results: AnalysisResult[] = [];
  
  for (let i = 100; i < candles.length; i++) {
    const window = candles.slice(i - 100, i + 1);
    results.push(analyzePro(
      window,
      { value: 50, sent: 'Neutral' },
      { score: 0, label: 'NEUTRAL', trend: 'STABLE', drivers: [] }
    ));
  }
  return results;
};

/**
 * بکتست فوق‌پیشرفته و ممیزی‌شده مبتنی بر ۵ اصل بنیادین:
 * ۱۶. تفکیک دو حالت Pure Signal vs Full Risk/Management
 * ۱۷. تفکیک دقیق Breakeven و محاسبه وین‌ریت خالص WIN / (WIN + LOSS)
 * ۱۸. ممیزی کامل استرس‌تست Flash Crash بدون Look-ahead و بدون ادعای دروغین ۱۰۰٪
 * ۱۹. آزمون داده ندیده پیش‌رو (Walk-Forward Train->Val->Test)
 * ۲۰. مهار نشت داده با Purged Walk-Forward و Embargo (روش دی پرادو)
 */
export const runAdvancedBacktest = (
  candles: Candle[],
  config?: AdvancedBacktestConfig
): AdvancedBacktestReport => {
  const mergedParams: StrategyParameters = {
    ...DEFAULT_STRATEGY_PARAMS,
    ...(config?.params || {})
  };

  const capital = config?.capital || 1000;
  const leverage = config?.leverage || 5;
  const exchange = config?.exchange || 'BYBIT_FUTURES';
  const orderType = config?.orderType || 'MARKET_TAKER';
  const intrabarMode = config?.intrabarMode || 'CONSERVATIVE';

  // ۱۶. اجرای شبیه‌سازی در دو حالت مجزا:
  // حالت A: عملکرد خالص سیگنال (Pure Signal Performance)
  const pureSignalSim = simulateWindowTrades(candles, mergedParams, {
    capital,
    leverage,
    exchange,
    orderType,
    intrabarMode,
    mode: 'PURE_SIGNAL',
  });

  // حالت B: عملکرد با مدیریت معامله، ریسک و هج (Full Risk/Management Performance)
  const fullManagementSim = simulateWindowTrades(candles, mergedParams, {
    capital,
    leverage,
    exchange,
    orderType,
    intrabarMode,
    mode: 'MANAGED_RISK',
  });

  // ۱۹ & ۲۰. اجرای آزمون داده ندیده با Purging و Embargo
  const walkForward = runWalkForwardAnalysis(candles, {
    foldsCount: 4,
    capital,
    leverage,
    exchange,
    labelHorizonBars: 15,
    embargoBars: 10,
  });

  // ۱۸ & ۲۰. اجرای آزمون استرس رژیم‌های مختلف بازار و ممیزی Flash Crash
  const antiOverfit = runMultiRegimeStressAudit(candles, mergedParams);

  return {
    pureSignal: pureSignalSim,
    fullManagement: fullManagementSim,
    summary: {
      initialCapital: capital,
      finalCapital: fullManagementSim.finalCapital,
      netProfitUsd: fullManagementSim.netProfitUsd,
      roiPercent: fullManagementSim.roiPercent,
      strictWinRate: fullManagementSim.strictWinRate,
      breakevenRate: fullManagementSim.breakevenRate,
      totalTrades: fullManagementSim.totalTrades,
      winCount: fullManagementSim.winCount,
      lossCount: fullManagementSim.lossCount,
      breakevenCount: fullManagementSim.breakevenCount,
      partialWinCount: fullManagementSim.partialWinCount,
      partialLossCount: fullManagementSim.partialLossCount,
      timeoutCount: fullManagementSim.timeoutCount,
      liquidationCount: fullManagementSim.liquidationCount,
      maxDrawdownPercent: fullManagementSim.maxDrawdownPct,
      totalFeesPaidUsd: fullManagementSim.totalFeesPaid,
      totalSlippagePaidUsd: fullManagementSim.totalSlippagePaid,
      profitFactor: fullManagementSim.profitFactor,
      averageR: fullManagementSim.averageR,
      expectancyR: fullManagementSim.expectancyR,
      expectancyUsd: fullManagementSim.expectancyUsd,
      maeAvgPct: fullManagementSim.maeAvgPct,
      mfeAvgPct: fullManagementSim.mfeAvgPct,
      sharpeRatio: fullManagementSim.sharpeRatio,
      sortinoRatio: fullManagementSim.sortinoRatio,
      calmarRatio: fullManagementSim.calmarRatio,
      confidenceInterval95: fullManagementSim.confidenceInterval95,
    },
    trades: fullManagementSim.trades.map((t) => ({
      id: t.id,
      entryIdx: t.entryIdx,
      exitIdx: t.exitIdx,
      direction: t.direction,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      pnlUsd: t.pnlUsd,
      rMultiple: t.rMultiple,
      maePct: t.maePct,
      mfePct: t.mfePct,
      outcome: t.outcome,
      isWin: t.isWin,
      isBreakeven: t.isBreakeven,
      reason: t.reason,
      frictionUsd: t.frictionUsd,
      mode: t.mode,
    })),
    walkForward,
    antiOverfit,
  };
};

export const runBacktestAdvanced = runAdvancedBacktest;

export {
  evaluateSharedStrategy,
  resolveIntrabarExecution,
  calculateDynamicExecutionCost,
  runWalkForwardAnalysis,
  runMultiRegimeStressAudit,
  STRATEGY_PARAMETER_REGISTRY,
  DEFAULT_STRATEGY_PARAMS
};

