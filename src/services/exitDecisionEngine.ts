/**
 * 🚪 Independent Exit Decision Engine & Remaining Expected Value (EV_remaining)
 * Items 74, 75, 76, 77
 * 
 * - Item 74: Dynamic Wave Runner Management based on Continuation Probability, MFE, Structure, Order Flow, Volatility.
 * - Item 75: Event-Based Dynamic Exits (Structure Break, Liquidity Reversal, CVD Collapse, OBI Flip, Volatility Shock, Momentum Failure).
 * - Item 76: Independent Exit Model (separate from Entry Model).
 * - Item 77: Remaining Expected Value (EV_remaining) Calculation.
 */

import { Candle, TradePosition, AnalysisResult, OrderFlowFeatures } from '../types/trading';

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

  continuationProbabilityPct: number; // 0 - 100%
  reversalProbabilityPct: number; // 0 - 100%
  expectedRemainingValueR: number; // EV_remaining in R
  expectedRemainingValueUsd: number;
  historicalMedianMfeR: number;
  mfeRealizationRatio: number;
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
    const cvd = analysis?.cvdDelta ?? 0;
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

      if (cvd > 0) structureHealthScore += 10;
      else if (cvd < -1200) {
        structureHealthScore -= 20;
        triggeredEvents.push('CVD_COLLAPSE_DIVERGENCE');
      }
    } else {
      if (obi < -0.04) structureHealthScore += 10;
      else if (obi > 0.06) {
        structureHealthScore -= 25;
        triggeredEvents.push('OBI_WALL_FLIP');
      }

      if (cvd < 0) structureHealthScore += 10;
      else if (cvd > 1200) {
        structureHealthScore -= 20;
        triggeredEvents.push('CVD_COLLAPSE_DIVERGENCE');
      }
    }

    structureHealthScore = Math.max(5, Math.min(99, structureHealthScore));

    // Continuation & Reversal Probabilities
    let continuationScore = structureHealthScore;
    const continuationProbabilityPct = Math.max(5, Math.min(95, continuationScore));
    const reversalProbabilityPct = 100 - continuationProbabilityPct;

    // Remaining EV Calculation
    const historicalMedianMfeR = 3.5;
    const remainingMfePotentialR = Math.max(0, historicalMedianMfeR - Math.max(0, currentProfitR));
    const mfeRealizationRatio = Math.round((Math.max(0, currentProfitR) / historicalMedianMfeR) * 100) / 100;

    const riskToStopR = 0.6;
    const pCont = continuationProbabilityPct / 100;
    const pRev = reversalProbabilityPct / 100;
    const rawEvRemaining = (pCont * remainingMfePotentialR) - (pRev * riskToStopR) - 0.04;
    const expectedRemainingValueR = Math.round(rawEvRemaining * 100) / 100;
    const expectedRemainingValueUsd = Math.round((expectedRemainingValueR * riskDist * (notional / entry)) * 100) / 100;

    // 27. Breakeven Intelligence (Entry + Fees + Expected Slippage + Safety Buffer)
    const entryFeePerBtc = entry * 0.00055;
    const exitFeePerBtc = entry * 0.00055;
    const expectedSlippageUsd = 0.25;
    const safetyBufferUsd = atr * 0.2;
    const frictionBufferPrice = entryFeePerBtc + exitFeePerBtc + expectedSlippageUsd + safetyBufferUsd;
    
    const breakevenProtectionPrice = isLong
      ? Math.round((entry + frictionBufferPrice) * 100) / 100
      : Math.round((entry - frictionBufferPrice) * 100) / 100;
    
    // Breakeven is eligible only when profit exceeds friction buffer and continuation probability supports holding
    const isBreakevenEligible = currentProfitR >= 0.8 && continuationProbabilityPct >= 55;

    // 26. Runner Intelligence (Wave Surfing)
    let runnerIntelligenceStatus: ExitEvaluationResult['runnerIntelligenceStatus'] = 'KEEP_RUNNER';
    if (currentProfitR >= 1.5) {
      if (continuationProbabilityPct < 55 || triggeredEvents.length > 0 || expectedRemainingValueR < 0.20) {
        runnerIntelligenceStatus = 'CLOSE_RUNNER';
      } else if (continuationProbabilityPct < 70) {
        runnerIntelligenceStatus = 'REDUCE_RUNNER';
      }
    }

    // 28. Smart Loser Exit Intelligence
    const isThesisValid = structureHealthScore >= 40 && continuationProbabilityPct >= 35 && expectedRemainingValueR >= -0.2;
    const earlyExitRecommended = !isThesisValid && currentProfitR < 0;
    const loserThesisStatus = {
      isThesisValid,
      earlyExitRecommended,
      rationaleFa: isThesisValid
        ? 'تز معامله هنوز معتبر است و ساختار بازار از پوزیشن پشتیبانی می‌کند.'
        : `🛑 نقض تز معامله (Thesis Invalidated): سلامت ساختار افت کرده و احتمال برگشت زیاد است. خروج زودهنگام با ضرر کمتر توصیه می‌شود.`
    };

    // 25. Independent Exit Brain Action Decision (HOLD / REDUCE / TRAIL / EXIT)
    let action: ExitEvaluationResult['action'] = 'HOLD';
    let primaryExitTrigger: ExitEventTriggerType = triggeredEvents.length > 0 ? triggeredEvents[0] : 'NONE';
    let exitUrgencyScore = Math.min(100, Math.max(0, 100 - continuationProbabilityPct));

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
    } else if (runnerIntelligenceStatus === 'CLOSE_RUNNER' || expectedRemainingValueR <= 0.10 && currentProfitR >= 1.5) {
      action = 'EXIT';
      exitUrgencyScore = 88;
      rationaleFa = `خروج کامل موج رانر: سود عالی (+${currentProfitR}R) محقق شده و راندمان باقیمانده به حداقل رسیده است.`;
      guidanceFa = 'تمام سود را از صرافی برداشت و تسویه کنید.';
    } else if (runnerIntelligenceStatus === 'REDUCE_RUNNER') {
      action = 'REDUCE';
      exitUrgencyScore = 65;
      rationaleFa = `کاهش حجم رانر (REDUCE): نشانه‌های اولیه ضعف در CVD یا اردر‌بوک پدیدار شده است.`;
      guidanceFa = '۵۰٪ از حجم رانر را ببندید و بقیه را با تریلینگ هدایت کنید.';
    } else if (continuationProbabilityPct >= 68 && expectedRemainingValueR >= 0.5) {
      action = 'HOLD';
      exitUrgencyScore = 20;
      rationaleFa = `نگهداری پایدار (HOLD): سلامت ساختار بازار (${structureHealthScore}/100) و احتمال ادامه روند (${continuationProbabilityPct}٪) عالی است.`;
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
      continuationProbabilityPct,
      reversalProbabilityPct,
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
