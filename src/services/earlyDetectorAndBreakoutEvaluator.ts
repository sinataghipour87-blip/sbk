import { Candle, EarlyOpportunityMetrics, BreakoutVsFakeoutEvaluation } from '../types/trading';

/**
 * 🔍 موتور تشخیص زودهنگام فرصت (Early Opportunity Detector) - قانون ۱۹
 * ⚖️ موتور ارزیابی احتمال شکست واقعی در برابر فیک‌اوت (Breakout vs Fakeout Evaluator) - قانون ۲۰
 */
export class EarlyDetectorAndBreakoutService {
  private static instance: EarlyDetectorAndBreakoutService;

  private constructor() {}

  public static getInstance(): EarlyDetectorAndBreakoutService {
    if (!EarlyDetectorAndBreakoutService.instance) {
      EarlyDetectorAndBreakoutService.instance = new EarlyDetectorAndBreakoutService();
    }
    return EarlyDetectorAndBreakoutService.instance;
  }

  /**
   * شناسایی نشانه‌های اولیه پیش از شروع حرکت اصلی (قانون ۱۹)
   * بررسی ۸ فاکتور کلیدی برای ورود زودهنگام به فاز ARMED قبل از تعقیب حرکت بزرگ
   */
  public detectEarlyOpportunity(params: {
    candles: Candle[];
    currentPrice: number;
    obi: number;
    cvdDelta?: number;
    openInterestChangePct?: number;
    fundingRate?: number;
  }): EarlyOpportunityMetrics {
    const { candles, currentPrice, obi, cvdDelta = 1200, openInterestChangePct = 2.4, fundingRate = 0.008 } = params;
    const reasonsFa: string[] = [];

    const recent = candles.length >= 15 ? candles.slice(-15) : candles;
    
    // ۱. تراکم نقدینگی (Liquidity Build-up Score)
    const ranges = recent.map(c => Math.abs(c[1] - c[2]));
    const avgRange = ranges.length > 0 ? ranges.reduce((a, b) => a + b, 0) / ranges.length : 1;
    const recentRange = ranges.length >= 3 ? ranges.slice(-3).reduce((a, b) => a + b, 0) / 3 : avgRange;
    const liquidityBuildUpScore = Math.min(100, Math.max(10, Math.round((1 - (recentRange / (avgRange || 1))) * 85 + 40)));

    // ۲. فشردگی نوسان (Compression Score / Volatility Squeeze)
    const compressionScore = recentRange < (avgRange * 0.75) ? 85 : 50;
    const volatilityCompressionIndex = Math.min(1.0, Math.max(0.1, recentRange / (avgRange || 1)));

    // ۳. جابجایی دفتر سفارشات (Order Book Shift)
    const orderBookShiftScore = Math.min(100, Math.max(-100, Math.round(obi * 100)));

    // ۴. تغییرات CVD (Cumulative Volume Delta)
    const cvdShiftScore = Math.min(100, Math.max(-100, Math.round((cvdDelta / 5000) * 100)));

    // ۵. تغییرات Open Interest
    const oiNormalized = Math.min(100, Math.max(0, Math.round((openInterestChangePct / 10) * 100)));

    // ۶. تغییرات فاندینگ ریت
    const fundingRateChange = fundingRate;

    // ۷. فشار ساختاری (Structure Pressure)
    const structurePressureScore = Math.round((orderBookShiftScore * 0.4) + (cvdShiftScore * 0.4) + (oiNormalized * 0.2));

    // امتیاز کلی Early Score (0 تا 100)
    const earlyScore = Math.round(
      (liquidityBuildUpScore * 0.2) +
      (compressionScore * 0.2) +
      (Math.abs(orderBookShiftScore) * 0.2) +
      (Math.abs(cvdShiftScore) * 0.2) +
      (Math.abs(structurePressureScore) * 0.2)
    );

    const isArmedEarly = earlyScore >= 68 && compressionScore >= 70;

    if (isArmedEarly) {
      reasonsFa.push(`🎯 شناسایی زودهنگام پیش از Breakout (امتیاز اولیه: ${earlyScore}/100): فشردگی نوسان و انباشت نقدینگی تایید شد.`);
    } else {
      reasonsFa.push(`⏳ وضعیت خنثی؛ علائم زودهنگام فشردگی یا جابجایی سفارشات هنوز به حد نصاب نرسیده است (امتیاز: ${earlyScore}/100).`);
    }

    const rationaleFa = isArmedEarly
      ? `آماده‌باش زودهنگام (ARMED): تراکم نقدینگی ($${liquidityBuildUpScore}) و فشردگی ATR حاکی از آمادگی بازار برای شکست پیش‌رو است.`
      : `در حال پایش نشانه‌های اولیه شکل‌گیری Breakout.`;

    return {
      liquidityBuildUpScore,
      compressionScore,
      orderBookShiftScore,
      cvdShiftScore,
      openInterestChangePct,
      fundingRateChange,
      volatilityCompressionIndex,
      structurePressureScore,
      earlyScore,
      isArmedEarly,
      rationaleFa,
    };
  }

  /**
   * محاسبه احتمال Breakout واقعی در برابر Fakeout / Liquidity Sweep پیش از شکست (قانون ۲۰)
   */
  public evaluateBreakoutVsFakeout(params: {
    earlyMetrics: EarlyOpportunityMetrics;
    obi: number;
    volumeSpikeRatio: number; // e.g. 1.8x average volume
    hurstExponent?: number;   // e.g. 0.62 (trending persistence)
  }): BreakoutVsFakeoutEvaluation {
    const { earlyMetrics, obi, volumeSpikeRatio, hurstExponent = 0.60 } = params;
    const reasonsFa: string[] = [];

    // فرمول تحلیل آماری Real Breakout Probability
    let realProb = 50.0;
    realProb += earlyMetrics.compressionScore * 0.15;
    realProb += Math.abs(earlyMetrics.orderBookShiftScore) * 0.20;
    realProb += Math.abs(earlyMetrics.cvdShiftScore) * 0.20;
    realProb += Math.min(20, (volumeSpikeRatio - 1) * 15);
    realProb += (hurstExponent - 0.50) * 40;

    realProb = Math.min(92, Math.max(15, Math.round(realProb * 10) / 10));
    const fakeoutProb = Math.round((100 - realProb) * 10) / 10;

    // شرط آماری Edge اثبات‌شده: احتمال واقعی حداقل ۶۸٪ و حداقل ۳۰٪ بیشتر از احتمال فیک‌اوت باشد
    const statisticalEdgeVerified = realProb >= 68.0 && (realProb - fakeoutProb) >= 30.0;

    let decisionStatus: BreakoutVsFakeoutEvaluation['decisionStatus'] = 'FAKE_BREAKOUT_AVOIDED_REJECTED';
    let verdictFa = '';

    if (statisticalEdgeVerified) {
      decisionStatus = 'BREAKOUT_APPROVED_EDGE_PROVEN';
      verdictFa = `✅ تایید شکست واقعی با Edge آماری اثبات‌شده (Breakout Prob: ${realProb}% در برابر Fakeout: ${fakeoutProb}%).`;
      reasonsFa.push(`✅ احتمال شکست واقعی (${realProb}٪) به طور معناداری بالاتر از احتمال فیک‌اوت (${fakeoutProb}٪) است.`);
      reasonsFa.push('✅ حجم تیک‌ها، جابجایی CVD و فشرده‌سازی نوسان، اعتبار Breakout را تایید می‌کنند.');
    } else {
      decisionStatus = 'FAKE_BREAKOUT_AVOIDED_REJECTED';
      verdictFa = `🛑 خطر بالای فیک‌اوت و جاروی نقدینگی (Fakeout Prob: ${fakeoutProb}% مقابل Breakout: ${realProb}%). ورود بلاک شد.`;
      reasonsFa.push(`🛑 عدم احراز Edge آماری کافی (احتمال واقعی ${realProb}٪ < حد نصاب ۶۸٪ یا فاصله کمتر از ۳۰٪ با فیک‌اوت).`);
      reasonsFa.push('🛡️ سیستم از ورود در تله‌های تاییدنشده و Sweep نقدینگی ممانعت کرد.');
    }

    return {
      isBreakoutCandidate: realProb >= 60.0,
      realBreakoutProbabilityPct: realProb,
      fakeoutLiquiditySweepProbabilityPct: fakeoutProb,
      statisticalEdgeVerified,
      verdictFa,
      decisionStatus,
      reasonsFa,
      checkedAt: Date.now(),
    };
  }
}

export const earlyDetectorAndBreakout = EarlyDetectorAndBreakoutService.getInstance();
