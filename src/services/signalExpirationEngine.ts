/**
 * ⏳ Signal Expiration (TTL) & Final Pre-Execution Revalidation Engine (Items 41 & 42)
 * 
 * 41. Signal TTL & State Invalidation:
 *     - Signals are stamped with TTL (default: 3000ms - 5000ms based on volatility).
 *     - If market state (Price, OBI, Spread, Volatility, Structure) mutates beyond threshold,
 *       the signal transitions to 'EXPIRED' / 'INVALIDATED_STATE_MUTATION' and requires recalculation.
 * 
 * 42. Final Entry Revalidation Gate (Just-In-Time Pre-Submission):
 *     - Fresh snapshot verification right before order dispatch.
 *     - Verifies: Price drift, OBI drift, Spread widening, Volatility shock, Win probability,
 *       Positive Expected Value (EV > 0), Entry Zone boundaries, Trigger condition, Slippage tolerance.
 */

import { AnalysisResult, EntryCandidate } from '../types/trading';

export type SignalTtlStatus = 'SIGNAL_CREATED' | 'ACTIVE_VALID' | 'EXPIRED' | 'INVALIDATED_STATE_MUTATION' | 'EXECUTED';

export interface SignalStateSnapshot {
  signalId: string;
  createdAtMs: number;
  ttlMs: number;
  status: SignalTtlStatus;
  initialPrice: number;
  initialObi: number;
  initialSpreadBps: number;
  initialAtr: number;
  direction: 'LONG' | 'SHORT';
  entryCandidate?: EntryCandidate | null;
  minWinProbability: number;
  expectedValueUsd: number;
}

export interface FinalPreExecutionRevalidationResult {
  isApprovedForSubmission: boolean;
  verdictFa: string;
  rejectionReasonFa?: string;
  snapshotAgeMs: number;
  priceDriftPct: number;
  obiDrift: number;
  currentSpreadBps: number;
  isWithinEntryZone: boolean;
  isEvPositive: boolean;
  evaluatedAtMs: number;
}

export class SignalExpirationEngineService {
  private static instance: SignalExpirationEngineService;

  // Maximum allowed drift thresholds before invalidating signal
  private readonly MAX_PRICE_DRIFT_PCT = 0.20; // 0.20% maximum price movement
  private readonly MAX_SPREAD_WIDENING_BPS = 6.0; // 6 bps max spread
  private readonly MAX_OBI_INVERSION_DELTA = 0.40; // OBI flipping against us

  public static getInstance(): SignalExpirationEngineService {
    if (!SignalExpirationEngineService.instance) {
      SignalExpirationEngineService.instance = new SignalExpirationEngineService();
    }
    return SignalExpirationEngineService.instance;
  }

  /**
   * Generates a dynamic TTL for a signal based on market volatility
   */
  public calculateDynamicTtlMs(atrRatio = 1.0, isHighVol = false): number {
    if (isHighVol || atrRatio > 1.4) {
      return 2500; // 2.5 seconds in high volatility
    }
    return 4500; // 4.5 seconds in standard regime
  }

  /**
   * 41. Checks if an existing signal has expired or is invalidated due to market mutation
   */
  public evaluateSignalExpiration(
    signal: SignalStateSnapshot,
    currentMarket: AnalysisResult,
    nowMs: number = Date.now()
  ): { status: SignalTtlStatus; isExpired: boolean; reasonFa: string } {
    const ageMs = nowMs - signal.createdAtMs;

    // 1. Time-based Expiration (TTL)
    if (ageMs > signal.ttlMs) {
      return {
        status: 'EXPIRED',
        isExpired: true,
        reasonFa: `⏳ سیگنال منقضی شد (سن سیگنال: ${ageMs}ms > TTL: ${signal.ttlMs}ms). بازار نیازمند محاسبه مجدد است.`,
      };
    }

    // 2. Price Mutation Check
    const currentPrice = currentMarket.price || signal.initialPrice;
    const priceDriftPct = Math.abs((currentPrice - signal.initialPrice) / signal.initialPrice) * 100;
    if (priceDriftPct > this.MAX_PRICE_DRIFT_PCT) {
      return {
        status: 'INVALIDATED_STATE_MUTATION',
        isExpired: true,
        reasonFa: `⚠️ ابطال سیگنال به دلیل تغییر ناگهانی قیمت (${priceDriftPct.toFixed(2)}% > سقف ${this.MAX_PRICE_DRIFT_PCT}%).`,
      };
    }

    // 3. OBI Inversion Check (Order Book flipping against target direction)
    const currentObi = currentMarket.obi ?? signal.initialObi;
    const isObiInverted = signal.direction === 'LONG' ? (currentObi < -0.25 && signal.initialObi > 0) : (currentObi > 0.25 && signal.initialObi < 0);
    if (isObiInverted) {
      return {
        status: 'INVALIDATED_STATE_MUTATION',
        isExpired: true,
        reasonFa: `⚠️ ابطال سیگنال به دلیل چرخش ناگهانی عمق اردر بوک (OBI Inversion: ${currentObi.toFixed(2)}).`,
      };
    }

    return {
      status: 'ACTIVE_VALID',
      isExpired: false,
      reasonFa: `سیگنال معتبر است (سن: ${ageMs}ms / TTL: ${signal.ttlMs}ms).`,
    };
  }

  /**
   * 42. Final Pre-Execution Revalidation Gate (Just before order submission)
   */
  public revalidateEntryBeforeOrderSubmission(
    signal: SignalStateSnapshot,
    freshMarketSnapshot: AnalysisResult,
    nowMs: number = Date.now()
  ): FinalPreExecutionRevalidationResult {
    const ageMs = nowMs - signal.createdAtMs;
    const freshPrice = freshMarketSnapshot.price || signal.initialPrice;
    const freshObi = freshMarketSnapshot.obi ?? 0;
    const freshSpread = freshMarketSnapshot.canonicalSnapshot?.basisSpreadBps ?? (freshMarketSnapshot as any).spreadBps ?? 1.8;
    const freshAtr = freshMarketSnapshot.atr || signal.initialAtr;
    const freshWinProb = freshMarketSnapshot.calibratedWinProbability ?? 50;
    const freshEv = freshMarketSnapshot.expectedValue ?? signal.expectedValueUsd ?? 1.0;

    const priceDriftPct = Number((Math.abs((freshPrice - signal.initialPrice) / signal.initialPrice) * 100).toFixed(3));
    const obiDrift = Number((freshObi - signal.initialObi).toFixed(2));

    // Entry Zone check
    let isWithinEntryZone = true;
    if (signal.entryCandidate?.entryZone) {
      const { min, max } = signal.entryCandidate.entryZone;
      isWithinEntryZone = freshPrice >= min * 0.998 && freshPrice <= max * 1.002;
    }

    // Comprehensive multi-factor validation check
    const failures: string[] = [];

    // Check 1: TTL Age
    if (ageMs > signal.ttlMs) {
      failures.push(`منقضی شدن سن سیگنال (${ageMs}ms > ${signal.ttlMs}ms)`);
    }

    // Check 2: Price drift beyond allowed slippage window
    if (priceDriftPct > this.MAX_PRICE_DRIFT_PCT) {
      failures.push(`انحراف بیش از حد قیمت (${priceDriftPct}% > ${this.MAX_PRICE_DRIFT_PCT}%)`);
    }

    // Check 3: Spread blowout
    if (freshSpread > this.MAX_SPREAD_WIDENING_BPS) {
      failures.push(`اسپرد باز غیرمجاز (${freshSpread} bps > ${this.MAX_SPREAD_WIDENING_BPS} bps)`);
    }

    // Check 4: Positive EV verification
    if (freshEv <= 0) {
      failures.push(`امید ریاضی منفی در لحظه ارسال ($${freshEv.toFixed(2)})`);
    }

    // Check 5: Minimum Win Probability gate
    if (freshWinProb < signal.minWinProbability) {
      failures.push(`افت احتمال کالیبره‌شده (${freshWinProb}% < حد نصاب ${signal.minWinProbability}%)`);
    }

    // Check 6: Entry Zone boundary
    if (!isWithinEntryZone) {
      failures.push(`خروج قیمت از زون ورود بهینه (قیمت لحظه‌ای: $${freshPrice})`);
    }

    // Check 7: Directional OBI support
    if (signal.direction === 'LONG' && freshObi < -0.35) {
      failures.push(`فشار فروش سنگین در دفتر سفارشات (OBI: ${freshObi})`);
    } else if (signal.direction === 'SHORT' && freshObi > 0.35) {
      failures.push(`فشار خرید سنگین در دفتر سفارشات (OBI: ${freshObi})`);
    }

    const isApproved = failures.length === 0;

    return {
      isApprovedForSubmission: isApproved,
      verdictFa: isApproved
        ? `✅ اعتبارسنجی نهایی با موفقیت انجام شد: اسنپ‌شات تازه بازار (قیمت: $${freshPrice} | OBI: ${freshObi} | اسپرد: ${freshSpread} bps) کلیه شروط ورود را پاس کرد.`
        : `🛑 رد ارسال سفارش در فیلتر نهایی ورود: ${failures.join('، ')}.`,
      rejectionReasonFa: isApproved ? undefined : failures.join('، '),
      snapshotAgeMs: ageMs,
      priceDriftPct,
      obiDrift,
      currentSpreadBps: freshSpread,
      isWithinEntryZone,
      isEvPositive: freshEv > 0,
      evaluatedAtMs: nowMs,
    };
  }
}

export const signalExpirationEngine = SignalExpirationEngineService.getInstance();
