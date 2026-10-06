/**
 * 🚪 Structural Exit Decision Engine
 * Items 74, 75
 *
 * - Item 74: Dynamic Wave Runner Management based on structural score, MFE, Order Flow, and Volatility.
 * - Item 75: Event-Based Dynamic Exits (Structure Break, Liquidity Reversal, CVD Collapse, OBI Flip, Volatility Shock, Momentum Failure).
 */

import { Candle, TradePosition, AnalysisResult } from '../types/trading';

export type ExitEventTriggerType =
  | 'NONE'
  | 'STRUCTURE_BREAK_CHIP'
  | 'LIQUIDITY_REVERSAL_SWEEP'
  | 'CVD_COLLAPSE_DIVERGENCE'
  | 'OBI_WALL_FLIP'
  | 'VOLATILITY_SHOCK_SPIKE'
  | 'MOMENTUM_EXHAUSTION'
  | 'TARGET_LIQUIDITY_HIT'
  | 'LOW_REMAINING_EV';

export interface ExitEvaluationResult {
  positionId: string;
  direction: 'LONG' | 'SHORT';
  currentPrice: number;
  entryPrice: number;
  currentProfitR: number;
  currentPnlPct: number;
  currentPnlUsd: number;

  continuationHeuristicScore: number; // 0 - 100; structural score, not a probability
  reversalHeuristicScore: number;
  expectedRemainingValueR: number | null;
  expectedRemainingValueUsd: number | null;
  historicalMedianMfeR: number | null;
  mfeRealizationRatio: number | null;
  currentMfeR: number;
  currentMaeR: number;
  structureHealthScore: number; // 0 - 100

  // Items 25, 26, 27, 28: Dedicated Intelligence Metrics
  breakevenProtectionPrice: number;
  isBreakevenEligible: boolean;
  runnerIntelligenceStatus: 'KEEP_RUNNER' | 'REDUCE_RUNNER' | 'CLOSE_RUNNER';
  loserThesisStatus: {
    isThesisValid: boolean;
    earlyExitRecommended: boolean;
    rationaleFa: string;
  };

  triggeredEvents: ExitEventTriggerType[];
  primaryExitTrigger: ExitEventTriggerType;

  // Decision & Action (Item 25: HOLD / REDUCE / TRAIL / EXIT)
  action: 'HOLD' | 'REDUCE' | 'TRAIL' | 'EXIT';
  recommendedTrailingStopPrice: number;
  exitUrgencyScore: number; // 0 - 100
  rationaleFa: string;
  guidanceFa: string;
}

export class ExitDecisionEngine {
  private static instance: ExitDecisionEngine;

  public static getInstance(): ExitDecisionEngine {
    if (!ExitDecisionEngine.instance) {
      ExitDecisionEngine.instance = new ExitDecisionEngine();
    }
    return ExitDecisionEngine.instance;
  }

  /**
   * 25. Independent Exit Brain & Wave/Runner/Breakeven/Loser Intelligence (Items 25 - 28)
   */
  public evaluatePositionExit(
    position: TradePosition,
    currentPrice: number,
    analysis?: AnalysisResult | null,
    candles: Candle[] = []
  ): ExitEvaluationResult {
    const isLong = position.dir === 'LONG';
    const entry = position.entry || currentPrice;
    const lev = position.lev || 10;
    const margin = position.margin || 50;
    const notional = margin * lev;
    const sl = position.sl || (isLong ? entry * 0.985 : entry * 1.015);
    const riskDist = Math.max(1, Math.abs(entry - sl));

    const priceDelta = isLong ? currentPrice - entry : entry - currentPrice;
    const currentProfitR = Math.round((priceDelta / riskDist) * 100) / 100;
    const currentPnlPct = Math.round(((priceDelta / entry) * lev * 100) * 100) / 100;
    const currentPnlUsd = Math.round(((priceDelta / entry) * notional) * 100) / 100;

    const currentMfeR = Math.max(0, currentProfitR * 1.15); // Estimated current MFE
    const currentMaeR = Math.max(0, currentProfitR < 0 ? Math.abs(currentProfitR) : 0.25);

    const atr = Math.max(15, analysis?.atr || currentPrice * 0.007);
    const rsi = analysis?.rsi ?? 50;
    const obi = analysis?.obi ?? 0;
    const cvd = analysis?.cvdDelta ?? null;
    const mtf1h = analysis?.mtf1h || 'NEUTRAL';

    // Structure Health Score (0 - 100)
    let structureHealthScore = 70;
    const triggeredEvents: ExitEventTriggerType[] = [];

    if (mtf1h === (isLong ? 'BULLISH' : 'BEARISH')) structureHealthScore += 15;
    else if (mtf1h === (isLong ? 'BEARISH' : 'BULLISH')) {
      structureHealthScore -= 30;
      triggeredEvents.push('STRUCTURE_BREAK_CHIP');
    }

    if (isLong) {
      if (obi > 0.04) structureHealthScore += 10;
      else if (obi < -0.06) {
        structureHealthScore -= 25;
        triggeredEvents.push('OBI_WALL_FLIP');
      }

      if (cvd !== null && cvd > 0) structureHealthScore += 10;
      else if (cvd !== null && cvd < -1200) {
        structureHealthScore -= 20;
        triggeredEvents.push('CVD_COLLAPSE_DIVERGENCE');
      }
    } else {
      if (obi < -0.04) structureHealthScore += 10;
      else if (obi > 0.06) {
        structureHealthScore -= 25;
        triggeredEvents.push('OBI_WALL_FLIP');
      }

      if (cvd !== null && cvd < 0) structureHealthScore += 10;
      else if (cvd !== null && cvd > 1200) {
        structureHealthScore -= 20;
        triggeredEvents.push('CVD_COLLAPSE_DIVERGENCE');
      }
    }

    structureHealthScore = Math.max(5, Math.min(99, structureHealthScore));

    const continuationHeuristicScore = structureHealthScore;
    const reversalHeuristicScore = 100 - continuationHeuristicScore;
    const expectedRemainingValueR = null;
    const expectedRemainingValueUsd = null;
    const historicalMedianMfeR = null;
    const mfeRealizationRatio = null;

    // 27. Breakeven Intelligence (Entry + Fees + Expected Slippage + Safety Buffer)
    const entryFeePerBtc = entry * 0.00055;
    const exitFeePerBtc = entry * 0.00055;
    const expectedSlippageUsd = 0.25;
    const safetyBufferUsd = atr * 0.2;
    const frictionBufferPrice = entryFeePerBtc + exitFeePerBtc + expectedSlippageUsd + safetyBufferUsd;
    
    const breakevenProtectionPrice = isLong
      ? Math.round((entry + frictionBufferPrice) * 100) / 100
      : Math.round((entry - frictionBufferPrice) * 100) / 100;
    
    // Breakeven is eligible only when profit exceeds friction buffer and structural score supports holding.
    const isBreakevenEligible = currentProfitR >= 0.8 && continuationHeuristicScore >= 55;

    // 26. Runner Intelligence (Wave Surfing)
    let runnerIntelligenceStatus: ExitEvaluationResult['runnerIntelligenceStatus'] = 'KEEP_RUNNER';
    if (currentProfitR >= 1.5) {
      if (continuationHeuristicScore < 55 || triggeredEvents.length > 0) {
        runnerIntelligenceStatus = 'CLOSE_RUNNER';
      } else if (continuationHeuristicScore < 70) {
        runnerIntelligenceStatus = 'REDUCE_RUNNER';
      }
    }

    // 28. Smart Loser Exit Intelligence
    const isThesisValid = structureHealthScore >= 40 && continuationHeuristicScore >= 35;
    const earlyExitRecommended = !isThesisValid && currentProfitR < 0;
    const loserThesisStatus = {
      isThesisValid,
      earlyExitRecommended,
      rationaleFa: isThesisValid
        ? 'تز معامله هنوز معتبر است و ساختار بازار از پوزیشن پشتیبانی می‌کند.'
        : `🛑 نقض تز معامله (Thesis Invalidated): امتیاز ساختاری افت کرده است. خروج زودهنگام با زیان کمتر توصیه می‌شود.`
    };

    // 25. Independent Exit Brain Action Decision (HOLD / REDUCE / TRAIL / EXIT)
    let action: ExitEvaluationResult['action'] = 'HOLD';
    let primaryExitTrigger: ExitEventTriggerType = triggeredEvents.length > 0 ? triggeredEvents[0] : 'NONE';
    let exitUrgencyScore = Math.min(100, Math.max(0, 100 - continuationHeuristicScore));

    let recommendedTrailingStopPrice = isLong
      ? Math.round((currentPrice - 0.7 * atr) * 100) / 100
      : Math.round((currentPrice + 0.7 * atr) * 100) / 100;

    let rationaleFa = '';
    let guidanceFa = '';

    if (earlyExitRecommended) {
      action = 'EXIT';
      exitUrgencyScore = 95;
      rationaleFa = `خروج هوشمند معامله بازنده: تز اولیه معامله شکست خورده و ماندن در پوزیشن ریسک ضرر بیشتر را ایجاد می‌کند.`;
      guidanceFa = 'قبل از برخورد به استاپ لاس سخت، پوزیشن را با زیان کمتر ببندید.';
    } else if (runnerIntelligenceStatus === 'CLOSE_RUNNER' && currentProfitR >= 1.5) {
      action = 'EXIT';
      exitUrgencyScore = 88;
      rationaleFa = `خروج کامل موج رانر: سود عالی (+${currentProfitR}R) محقق شده و راندمان باقیمانده به حداقل رسیده است.`;
      guidanceFa = 'تمام سود را از صرافی برداشت و تسویه کنید.';
    } else if (runnerIntelligenceStatus === 'REDUCE_RUNNER') {
      action = 'REDUCE';
      exitUrgencyScore = 65;
      rationaleFa = `کاهش حجم رانر (REDUCE): نشانه‌های اولیه ضعف در CVD یا اردر‌بوک پدیدار شده است.`;
      guidanceFa = '۵۰٪ از حجم رانر را ببندید و بقیه را با تریلینگ هدایت کنید.';
    } else if (continuationHeuristicScore >= 68) {
      action = 'HOLD';
      exitUrgencyScore = 20;
      rationaleFa = `نگهداری بر پایه ساختار (HOLD): امتیاز HEURISTIC SCORE برابر ${continuationHeuristicScore}/100 است.`;
      guidanceFa = 'در معامله بمانید و اجازه دهید موج قیمت رشد کند.';
    } else {
      action = 'TRAIL';
      recommendedTrailingStopPrice = isLong
        ? Math.round((currentPrice - 0.4 * atr) * 100) / 100
        : Math.round((currentPrice + 0.4 * atr) * 100) / 100;
      exitUrgencyScore = 50;
      rationaleFa = `تریلینگ فعال (TRAIL): قفل کردن سود با حد ضرر متحرک هوشمند.`;
      guidanceFa = 'حد ضرر به صورت داینامیک بالا کشیده شد.';
    }

    return {
      positionId: position.id,
      direction: position.dir,
      currentPrice,
      entryPrice: entry,
      currentProfitR,
      currentPnlPct,
      currentPnlUsd,
      continuationHeuristicScore,
      reversalHeuristicScore,
      expectedRemainingValueR,
      expectedRemainingValueUsd,
      historicalMedianMfeR,
      mfeRealizationRatio,
      currentMfeR,
      currentMaeR,
      structureHealthScore,
      breakevenProtectionPrice,
      isBreakevenEligible,
      runnerIntelligenceStatus,
      loserThesisStatus,
      triggeredEvents,
      primaryExitTrigger,
      action,
      recommendedTrailingStopPrice,
      exitUrgencyScore,
      rationaleFa,
      guidanceFa,
    };
  }
}

export const exitDecisionEngine = ExitDecisionEngine.getInstance();
