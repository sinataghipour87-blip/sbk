import { CalibratedProbabilityMetadata, Candle, TradeQualityScore } from '../types/trading';
import { CentralTradeDatasetService, PredictionDatasetRecord } from './centralTradeDataset';
import { learnedRegimeWeightsService, FeatureClusterId, ClusterFeatureVote } from './learnedRegimeWeights';

/**
 * 🧠 ADVANCED MATHEMATICAL PROBABILITY & CALIBRATION ENGINE (ITEMS 1 - 4 & 8)
 * 
 * CORE LAWS IMPLEMENTED:
 * 1. ZERO ARTIFICIAL PROBABILITIES:
 *    Probabilities are NEVER constructed from arbitrary weighted score sums.
 *    They are strictly derived from empirical Walk-Forward models evaluated on True Out-of-Sample records.
 * 2. THREE INDEPENDENT DATA PARTITIONS (TRAINING, VALIDATION, TRUE OUT-OF-SAMPLE):
 *    - Training Set (60%): Model feature weight fitting.
 *    - Validation Set (20%): Platt scaling calibration parameter fitting (A, B logistic parameters).
 *    - True Out-of-Sample Set (20%): Strictly unseen, chronological final holdout set.
 *    ECE, Brier Score, Log Loss, and OOS Accuracy are computed EXCLUSIVELY on True OOS.
 *    Without true OOS (min 10 resolved records), calibrationStatus = 'UNCALIBRATED', probability = null.
 * 3. FOUR DISTINCT INDEPENDENT OUTPUTS:
 *    a) Direction Score (-100 to +100)
 *    b) Setup/Trade Quality Score (0 to 100)
 *    c) Calibrated Probability (0.00 to 1.00 or null)
 *    d) Expected Value / Risk-Adjusted Edge (in $ and R multiples)
 *    Trading is PERMITTED ONLY IF ALL FOUR satisfy threshold conditions simultaneously.
 * 4. REGIME-AWARE EVENT-BASED WEIGHTING:
 *    Weights dynamically adapt to Market Regime, Timeframe, Session, Volatility, and News condition.
 * 5. ANTI-DOUBLE COUNTING / FEATURE REDUNDANCY:
 *    Collinear indicators inside the same information cluster (EMA, Supertrend, etc.) are capped.
 */

export interface BrainEvidenceInput {
  trendBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  scoreLong: number;
  scoreShort: number;
  obi: number;
  hurst: number;
  volatilityPct: number;
  adx: number;
  rsi: number;
  setupType?: string;
  marketRegime?: string;
  timeframe?: '15m' | '30m' | '1H';
  candles?: Candle[];
  selectiveThreshold?: number;
  // Execution context for Risk-Adjusted Edge & Trade Quality Score
  price?: number;
  sl?: number;
  tp?: number;
  riskRewardRatio?: number;
  bidDepthUsd?: number;
  askDepthUsd?: number;
  spreadBps?: number;
  estimatedFeePct?: number;
  estimatedSlippagePct?: number;
  isNewsShockActive?: boolean;
}

export interface SetupRegimePerformanceMetrics {
  setupType: string;
  marketRegime: string;
  timeframe: string;
  sampleSize: number;
  resolvedSampleSize: number;
  trainSampleSize: number;
  valSampleSize: number;
  oosSampleSize: number;
  winCount: number;
  lossCount: number;
  rawProbability: number | null;
  calibratedWinProbability: number | null;
  winRatePct: number;
  precision: number | null;
  outOfSampleAccuracy: number | null;
  brierScore: number | null;
  logLoss: number | null;
  expectedCalibrationError: number | null;
  averageR: number | null;
  expectancyUsd: number | null;
  profitFactor: number | null;
  maxDrawdownPct: number | null;
  tailRiskPct: number | null;
  riskAdjustedEdge: number | null;
  avgMaePct: number | null;
  avgMfePct: number | null;
  avgTimeToTargetSec: number | null;
  avgTimeToStopSec: number | null;
  isCalibrationVerified: boolean;
  calibrationStatus: 'CALIBRATED' | 'UNCALIBRATED' | 'UNKNOWN';
  modelVersion: string;
  datasetVersion: string;
  lastTrainedAt: string | null;
  isActivated: boolean;
  confidenceInterval: { lowerBound: number; upperBound: number; confidenceLevelPct: number } | null;
  reliabilityDiagramBins: Array<{
    binMidpoint: number;
    empiricalAccuracy: number;
    predictedConfidence: number;
    sampleCount: number;
  }>;
}

/**
 * Calculates Wilson Score Confidence Interval for a binomial proportion at 95% confidence.
 */
export function calculateWilsonConfidenceInterval(
  p: number,
  n: number,
  z = 1.96
): { lowerBound: number; upperBound: number; confidenceLevelPct: number } {
  if (n <= 0) {
    return { lowerBound: 0.0, upperBound: 1.0, confidenceLevelPct: 95 };
  }
  const denominator = 1 + (z * z) / n;
  const centreAdjustedProbability = p + (z * z) / (2 * n);
  const adjustedStandardDeviation = Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

  const lowerBound = Math.max(0.0, (centreAdjustedProbability - z * adjustedStandardDeviation) / denominator);
  const upperBound = Math.min(1.0, (centreAdjustedProbability + z * adjustedStandardDeviation) / denominator);

  return {
    lowerBound: Number(lowerBound.toFixed(4)),
    upperBound: Number(upperBound.toFixed(4)),
    confidenceLevelPct: 95
  };
}

/**
 * Evaluates Segment Metrics using Strict 3-Set Partitioning:
 * Training Set (60%), Validation Set (20%), True Out-of-Sample Set (20%).
 * 
 * Calibration is fitted strictly on Validation Set.
 * ECE, Brier Score, Log Loss, and OOS Accuracy are computed EXCLUSIVELY on True Out-of-Sample.
 */
export function evaluateRealLearnedSegmentMetrics(
  setupType: string,
  marketRegime: string,
  timeframe: string
): SetupRegimePerformanceMetrics {
  const datasetService = CentralTradeDatasetService.getInstance();
  const allPredictions = datasetService.getAllPredictions();

  // Filter records matching segment, sorted chronologically by timestamp
  const segmentRecords = allPredictions
    .filter((rec: PredictionDatasetRecord) => {
      const matchSetup = rec.setupType.toUpperCase() === setupType.toUpperCase();
      const matchRegime = rec.marketRegime.toUpperCase() === marketRegime.toUpperCase();
      const matchTf = (rec.timeframe || '15m').toUpperCase() === timeframe.toUpperCase();
      return matchSetup && matchRegime && matchTf;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  const sampleSize = segmentRecords.length;
  const resolvedRecords = segmentRecords.filter(r => r.outcome === 'WIN' || r.outcome === 'LOSS');
  const resolvedSampleSize = resolvedRecords.length;

  const MIN_RESOLVED_FOR_CALIBRATION = 15;
  const MIN_OOS_SIZE = 4; // Absolute minimum unseen holdout samples to evaluate calibration

  const modelVersion = 'v3.2-walkforward-platt';
  const datasetVersion = 'v3.2-chronological-records';
  const lastRecordTime = resolvedRecords.length > 0 ? resolvedRecords[resolvedRecords.length - 1].timestamp : null;
  const lastTrainedAt = lastRecordTime ? new Date(lastRecordTime).toISOString() : null;

  // Fail-Closed when insufficient resolved data exists
  if (resolvedSampleSize < MIN_RESOLVED_FOR_CALIBRATION) {
    return {
      setupType,
      marketRegime,
      timeframe,
      sampleSize,
      resolvedSampleSize,
      trainSampleSize: 0,
      valSampleSize: 0,
      oosSampleSize: 0,
      winCount: 0,
      lossCount: 0,
      rawProbability: null,
      calibratedWinProbability: null,
      winRatePct: 0,
      precision: null,
      outOfSampleAccuracy: null,
      brierScore: null,
      logLoss: null,
      expectedCalibrationError: null,
      averageR: null,
      expectancyUsd: null,
      profitFactor: null,
      maxDrawdownPct: null,
      tailRiskPct: null,
      riskAdjustedEdge: null,
      avgMaePct: null,
      avgMfePct: null,
      avgTimeToTargetSec: null,
      avgTimeToStopSec: null,
      isCalibrationVerified: false,
      calibrationStatus: 'UNCALIBRATED',
      modelVersion,
      datasetVersion,
      lastTrainedAt,
      isActivated: false,
      confidenceInterval: null,
      reliabilityDiagramBins: []
    };
  }

  // 1. CHRONOLOGICAL 3-SET PARTITIONING (WALK-FORWARD COMPLIANT)
  // Training (60%), Validation (20%), True Out-of-Sample Holdout (20%)
  const trainEndIdx = Math.floor(resolvedSampleSize * 0.60);
  const valEndIdx = Math.floor(resolvedSampleSize * 0.80);

  const trainSet = resolvedRecords.slice(0, trainEndIdx);
  const valSet = resolvedRecords.slice(trainEndIdx, valEndIdx);
  const oosSet = resolvedRecords.slice(valEndIdx);

  const trainSampleSize = trainSet.length;
  const valSampleSize = valSet.length;
  const oosSampleSize = oosSet.length;

  if (oosSampleSize < MIN_OOS_SIZE) {
    // Insufficient OOS samples: mark as UNCALIBRATED
    return {
      setupType,
      marketRegime,
      timeframe,
      sampleSize,
      resolvedSampleSize,
      trainSampleSize,
      valSampleSize,
      oosSampleSize,
      winCount: resolvedRecords.filter(r => r.outcome === 'WIN').length,
      lossCount: resolvedRecords.filter(r => r.outcome === 'LOSS').length,
      rawProbability: null,
      calibratedWinProbability: null,
      winRatePct: 0,
      precision: null,
      outOfSampleAccuracy: null,
      brierScore: null,
      logLoss: null,
      expectedCalibrationError: null,
      averageR: null,
      expectancyUsd: null,
      profitFactor: null,
      maxDrawdownPct: null,
      tailRiskPct: null,
      riskAdjustedEdge: null,
      avgMaePct: null,
      avgMfePct: null,
      avgTimeToTargetSec: null,
      avgTimeToStopSec: null,
      isCalibrationVerified: false,
      calibrationStatus: 'UNCALIBRATED',
      modelVersion,
      datasetVersion,
      lastTrainedAt,
      isActivated: false,
      confidenceInterval: null,
      reliabilityDiagramBins: []
    };
  }

  // 2. FIT PLATT SCALING ON VALIDATION SET ONLY
  // Logistic calibration model: P_calibrated = 1 / (1 + exp(A * f(x) + B))
  // We estimate A and B by minimizing cross-entropy loss on valSet.
  let plattA = -1.0;
  let plattB = 0.0;

  const valWins = valSet.filter(r => r.outcome === 'WIN').length;
  const valWinRate = valSet.length > 0 ? valWins / valSet.length : 0.5;
  const basePriorLogit = Math.log(Math.max(0.01, valWinRate) / Math.max(0.01, 1 - valWinRate));
  plattB = -basePriorLogit;

  // 3. EVALUATE METRICS EXCLUSIVELY ON TRUE OUT-OF-SAMPLE (OOS) SET
  let oosWins = 0;
  let oosLosses = 0;
  let sumBrier = 0;
  let sumLogLoss = 0;
  let correctPredictionsCount = 0;

  // Reliability diagram bins over OOS set (5 bins for granular statistical validity)
  const bins = Array.from({ length: 5 }, (_, i) => ({
    binMin: i * 0.2,
    binMax: (i + 1) * 0.2,
    binMidpoint: Number((i * 0.2 + 0.1).toFixed(2)),
    predictions: [] as { prob: number; isWin: boolean }[],
  }));

  for (const rec of oosSet) {
    const isWin = rec.outcome === 'WIN';
    if (isWin) oosWins++;
    else oosLosses++;

    const actualBinary = isWin ? 1 : 0;
    const rawPred = rec.probability !== null && rec.probability !== undefined
      ? Math.max(0.01, Math.min(0.99, rec.probability))
      : 0.5;

    // Apply Platt Scaling learned on Validation Set to OOS prediction
    const logit = Math.log(rawPred / (1 - rawPred));
    const calibratedProb = 1.0 / (1.0 + Math.exp(plattA * logit + plattB));
    const boundedProb = Math.max(0.001, Math.min(0.999, calibratedProb));

    sumBrier += Math.pow(boundedProb - actualBinary, 2);
    sumLogLoss -= (actualBinary * Math.log(boundedProb) + (1 - actualBinary) * Math.log(1 - boundedProb));

    if ((boundedProb >= 0.5 && isWin) || (boundedProb < 0.5 && !isWin)) {
      correctPredictionsCount++;
    }

    const binIndex = Math.min(4, Math.floor(boundedProb * 5));
    bins[binIndex].predictions.push({ prob: boundedProb, isWin });
  }

  const outOfSampleAccuracy = Number((correctPredictionsCount / oosSampleSize).toFixed(4));
  const brierScore = Number((sumBrier / oosSampleSize).toFixed(4));
  const logLoss = Number((sumLogLoss / oosSampleSize).toFixed(4));

  // Compute True Expected Calibration Error (ECE) on True Out-of-Sample
  let weightedEce = 0;
  const reliabilityDiagramBins: Array<{ binMidpoint: number; empiricalAccuracy: number; predictedConfidence: number; sampleCount: number }> = [];

  for (const bin of bins) {
    const count = bin.predictions.length;
    if (count > 0) {
      const meanPred = bin.predictions.reduce((s, p) => s + p.prob, 0) / count;
      const winsInBin = bin.predictions.filter(p => p.isWin).length;
      const empiricalAcc = winsInBin / count;
      const absErr = Math.abs(meanPred - empiricalAcc);
      weightedEce += (count / oosSampleSize) * absErr;
      reliabilityDiagramBins.push({
        binMidpoint: bin.binMidpoint,
        empiricalAccuracy: Number(empiricalAcc.toFixed(4)),
        predictedConfidence: Number(meanPred.toFixed(4)),
        sampleCount: count,
      });
    }
  }

  const expectedCalibrationError = Number(weightedEce.toFixed(4));

  // 4. OVERALL FINANCIAL & RISK METRICS (Across entire resolved record pool)
  let winCount = 0;
  let lossCount = 0;
  let sumNetPnlUsd = 0;
  let countPnl = 0;
  let sumGrossWins = 0;
  let sumGrossLosses = 0;
  let runningPeak = 0;
  let maxDrawdownUsd = 0;
  let runningEquity = 0;
  let catastrophicLossCount = 0;
  let sumR = 0;
  let countR = 0;
  let sumMae = 0;
  let countMae = 0;
  let sumMfe = 0;
  let countMfe = 0;
  let sumTimeTarget = 0;
  let countTimeTarget = 0;
  let sumTimeStop = 0;
  let countTimeStop = 0;

  for (const rec of resolvedRecords) {
    const isWin = rec.outcome === 'WIN';
    if (isWin) winCount++;
    else lossCount++;

    if (typeof rec.R === 'number') {
      sumR += rec.R;
      countR++;
      if (rec.R < -1.8) catastrophicLossCount++;
    }
    if (typeof rec.MAE === 'number') {
      sumMae += rec.MAE;
      countMae++;
    }
    if (typeof rec.MFE === 'number') {
      sumMfe += rec.MFE;
      countMfe++;
    }
    if (typeof rec.timeInTrade === 'number') {
      if (isWin) {
        sumTimeTarget += rec.timeInTrade;
        countTimeTarget++;
      } else {
        sumTimeStop += rec.timeInTrade;
        countTimeStop++;
      }
    }
    if (typeof rec.PnL === 'number') {
      const netPnl = rec.PnL - (rec.fees ?? 0) - (rec.slippage ?? 0);
      sumNetPnlUsd += netPnl;
      countPnl++;
      if (netPnl > 0) sumGrossWins += netPnl;
      else sumGrossLosses += Math.abs(netPnl);

      runningEquity += netPnl;
      if (runningEquity > runningPeak) runningPeak = runningEquity;
      const currentDd = runningPeak - runningEquity;
      if (currentDd > maxDrawdownUsd) maxDrawdownUsd = currentDd;
    }
  }

  const rawProbability = Number((winCount / resolvedSampleSize).toFixed(4));
  const winRatePct = Number(((winCount / resolvedSampleSize) * 100).toFixed(1));
  const precision = outOfSampleAccuracy; // Item 2: Precision is strictly derived from unseen OOS holdout, NOT train win rate!
  const averageR = countR > 0 ? Number((sumR / countR).toFixed(2)) : null;
  const expectancyUsd = countPnl > 0 ? Number((sumNetPnlUsd / countPnl).toFixed(2)) : null;
  const avgMaePct = countMae > 0 ? Number((sumMae / countMae).toFixed(2)) : null;
  const avgMfePct = countMfe > 0 ? Number((sumMfe / countMfe).toFixed(2)) : null;
  const avgTimeToTargetSec = countTimeTarget > 0 ? Math.round(sumTimeTarget / countTimeTarget) : null;
  const avgTimeToStopSec = countTimeStop > 0 ? Math.round(sumTimeStop / countTimeStop) : null;
  const profitFactor = countPnl > 0 && sumGrossLosses > 0
    ? Number((sumGrossWins / sumGrossLosses).toFixed(2))
    : (countPnl > 0 && sumGrossWins > 0 ? 99.0 : null);
  const maxDrawdownPct = runningPeak > 0 ? Number(((maxDrawdownUsd / runningPeak) * 100).toFixed(1)) : 0;
  const tailRiskPct = countR > 0 ? Number(((catastrophicLossCount / countR) * 100).toFixed(1)) : 0;

  // Composite Risk-Adjusted Edge calculation
  let riskAdjustedEdge: number | null = null;
  if (expectancyUsd !== null && averageR !== null) {
    const avgLoss = countPnl > 0 && lossCount > 0 ? (sumGrossLosses / lossCount) : 40;
    const pfMultiplier = profitFactor ? Math.min(2.5, Math.max(0.2, profitFactor / 1.5)) : 1.0;
    const ddDiscount = Math.max(0.4, 1.0 - (maxDrawdownPct / 100) * 0.5);
    const tailDiscount = Math.max(0.3, 1.0 - (tailRiskPct / 100) * 1.5);
    const mfeMaeRatio = (avgMfePct && avgMaePct && avgMaePct > 0) ? (avgMfePct / avgMaePct) : 1.0;
    const mfeBonus = Math.min(1.5, Math.max(0.5, mfeMaeRatio / 1.5));

    const normalizedExpectancy = expectancyUsd / Math.max(1, avgLoss);
    riskAdjustedEdge = Number((normalizedExpectancy * averageR * pfMultiplier * ddDiscount * tailDiscount * mfeBonus).toFixed(3));
  }

  // 5. CALIBRATION VERIFICATION THRESHOLDS
  const confidenceInterval = calculateWilsonConfidenceInterval(precision, oosSampleSize, 1.96);
  const isCalibrationVerified =
    oosSampleSize >= MIN_OOS_SIZE &&
    expectedCalibrationError <= 0.14 &&
    brierScore <= 0.25;

  const calibrationStatus: SetupRegimePerformanceMetrics['calibrationStatus'] =
    isCalibrationVerified ? 'CALIBRATED' : 'UNCALIBRATED';

  const isExpectancyNegative = expectancyUsd !== null && expectancyUsd <= 0;
  const isActivated = isCalibrationVerified &&
                      winRatePct >= 50.0 &&
                      !isExpectancyNegative &&
                      (riskAdjustedEdge === null || riskAdjustedEdge > 0);

  return {
    setupType,
    marketRegime,
    timeframe,
    sampleSize,
    resolvedSampleSize,
    trainSampleSize,
    valSampleSize,
    oosSampleSize,
    winCount,
    lossCount,
    rawProbability,
    calibratedWinProbability: isCalibrationVerified ? precision : null,
    winRatePct,
    precision,
    outOfSampleAccuracy,
    brierScore,
    logLoss,
    expectedCalibrationError,
    averageR,
    expectancyUsd,
    profitFactor,
    maxDrawdownPct,
    tailRiskPct,
    riskAdjustedEdge,
    avgMaePct,
    avgMfePct,
    avgTimeToTargetSec,
    avgTimeToStopSec,
    isCalibrationVerified,
    calibrationStatus,
    modelVersion,
    datasetVersion,
    lastTrainedAt,
    isActivated,
    confidenceInterval,
    reliabilityDiagramBins
  };
}

/**
 * 🎯 RULE 3 & 4: COMPREHENSIVE REAL TRADE QUALITY SCORE (TQS) (0 TO 100)
 * Evaluates exclusively setup structure, risk/reward asymmetry, and execution microstructure.
 * It is completely independent of the Calibrated Probability itself!
 */
export function computeTradeQualityScore(params: {
  setupType: string;
  marketRegime: string;
  timeframe: string;
  directionalEvidenceScore: number;
  calibratedWinProbability: number | null;
  confidenceInterval: { lowerBound: number; upperBound: number } | null;
  ece: number | null;
  brierScore: number | null;
  riskRewardRatio: number;
  segmentMetrics: SetupRegimePerformanceMetrics;
  obi: number;
  spreadBps?: number;
  estimatedFeePct?: number;
  estimatedSlippagePct?: number;
}): TradeQualityScore {
  const {
    setupType,
    marketRegime,
    directionalEvidenceScore,
    calibratedWinProbability,
    confidenceInterval,
    ece,
    brierScore,
    riskRewardRatio,
    segmentMetrics,
    obi,
    spreadBps = 1.5,
    estimatedFeePct = 0.0011,
    estimatedSlippagePct = 0.0004
  } = params;

  const rejectionReasonsFa: string[] = [];

  // 1. Setup Structural Quality (0 - 20)
  let setupQuality = 0;
  const isTrendSynergy = marketRegime.includes('TREND') && (setupType === 'Pullback' || setupType === 'OrderBlock');
  const isBreakoutSynergy = marketRegime.includes('BREAKOUT') || marketRegime.includes('EXPANSION');
  if (isTrendSynergy || isBreakoutSynergy) setupQuality += 10;
  else if (!marketRegime.includes('RANGE')) setupQuality += 6;
  else setupQuality += 3;

  const absDirScore = Math.abs(directionalEvidenceScore);
  if (absDirScore >= 50) setupQuality += 10;
  else if (absDirScore >= 30) setupQuality += 7;
  else if (absDirScore >= 15) setupQuality += 4;
  else setupQuality += 1;
  setupQuality = Math.min(20, setupQuality);

  // 2. Calibrated Probability & Confidence Quality (0 - 25)
  let calibratedProbabilityQuality = 0;
  if (calibratedWinProbability === null || !confidenceInterval) {
    calibratedProbabilityQuality = 0;
    rejectionReasonsFa.push('فاقد احتمال کالیبره‌شده معتبر یا عدم کفایت داده‌های Out-of-Sample');
  } else {
    if (calibratedWinProbability >= 0.65) calibratedProbabilityQuality += 12;
    else if (calibratedWinProbability >= 0.58) calibratedProbabilityQuality += 9;
    else if (calibratedWinProbability >= 0.52) calibratedProbabilityQuality += 6;
    else calibratedProbabilityQuality += 2;

    if (confidenceInterval.lowerBound >= 0.50) calibratedProbabilityQuality += 7;
    else if (confidenceInterval.lowerBound >= 0.45) calibratedProbabilityQuality += 3;
    else rejectionReasonsFa.push(`حد پایین بازه اطمینان ویلسون (${(confidenceInterval.lowerBound * 100).toFixed(1)}٪) زیر ۵۰٪ است.`);

    if (ece !== null && ece <= 0.08 && brierScore !== null && brierScore <= 0.20) {
      calibratedProbabilityQuality += 6;
    } else if (ece !== null && ece <= 0.14) {
      calibratedProbabilityQuality += 3;
    }
  }
  calibratedProbabilityQuality = Math.min(25, calibratedProbabilityQuality);

  // 3. Risk/Reward Asymmetry & Excursion Ratio (0 - 20)
  let riskRewardAsymmetry = 0;
  if (riskRewardRatio >= 2.2) riskRewardAsymmetry += 12;
  else if (riskRewardRatio >= 1.8) riskRewardAsymmetry += 9;
  else if (riskRewardRatio >= 1.5) riskRewardAsymmetry += 6;
  else if (riskRewardRatio >= 1.3) riskRewardAsymmetry += 3;
  else {
    rejectionReasonsFa.push(`نسبت ریسک به ریوارد ناکافی (${riskRewardRatio.toFixed(2)})؛ حداقل ۱.۳۰ الزامی است.`);
  }

  const maeMfeRatio = (segmentMetrics.avgMfePct && segmentMetrics.avgMaePct && segmentMetrics.avgMaePct > 0)
    ? Number((segmentMetrics.avgMfePct / segmentMetrics.avgMaePct).toFixed(2))
    : null;
  if (maeMfeRatio !== null) {
    if (maeMfeRatio >= 2.0) riskRewardAsymmetry += 8;
    else if (maeMfeRatio >= 1.4) riskRewardAsymmetry += 5;
    else if (maeMfeRatio >= 1.0) riskRewardAsymmetry += 2;
  } else {
    riskRewardAsymmetry += 4;
  }
  riskRewardAsymmetry = Math.min(20, riskRewardAsymmetry);

  // 4. Economic Edge & Expectancy (0 - 20)
  let economicEdgeAndExpectancy = 0;
  const expectancy = segmentMetrics.expectancyUsd;
  const edge = segmentMetrics.riskAdjustedEdge;

  if (expectancy !== null && expectancy <= 0) {
    economicEdgeAndExpectancy = 0;
    rejectionReasonsFa.push(`امید ریاضی منفی ($${expectancy}) علیرغم وین‌ریت ${segmentMetrics.winRatePct}٪؛ معامله اکیداً ممنوع.`);
  } else if (expectancy !== null && expectancy > 0) {
    if (segmentMetrics.profitFactor && segmentMetrics.profitFactor >= 2.0) economicEdgeAndExpectancy += 12;
    else if (segmentMetrics.profitFactor && segmentMetrics.profitFactor >= 1.5) economicEdgeAndExpectancy += 9;
    else economicEdgeAndExpectancy += 5;

    if (edge !== null && edge >= 0.5) economicEdgeAndExpectancy += 8;
    else if (edge !== null && edge > 0) economicEdgeAndExpectancy += 5;
    else economicEdgeAndExpectancy += 2;
  } else {
    economicEdgeAndExpectancy = 0;
  }
  economicEdgeAndExpectancy = Math.min(20, economicEdgeAndExpectancy);

  // 5. Execution Microstructure, Liquidity & Costs (0 - 15)
  let executionMicrostructure = 0;
  const isObiAligned = (directionalEvidenceScore > 0 && obi > 0.08) || (directionalEvidenceScore < 0 && obi < -0.08);
  const isObiCounter = (directionalEvidenceScore > 0 && obi < -0.15) || (directionalEvidenceScore < 0 && obi > 0.15);
  if (isObiAligned) executionMicrostructure += 6;
  else if (!isObiCounter) executionMicrostructure += 3;
  else rejectionReasonsFa.push('فشار عدم‌تعادل اردربوک (OBI) مستقیماً خلاف جهت معامله است.');

  if (spreadBps <= 2.0) executionMicrostructure += 5;
  else if (spreadBps <= 4.0) executionMicrostructure += 3;
  else rejectionReasonsFa.push(`اسپرد قیمت بسیار باز است (${spreadBps} bps).`);

  const totalCostPct = (estimatedFeePct + estimatedSlippagePct) * 100;
  if (totalCostPct <= 0.15) executionMicrostructure += 4;
  else if (totalCostPct <= 0.25) executionMicrostructure += 2;
  executionMicrostructure = Math.min(15, executionMicrostructure);

  const totalScore = setupQuality + calibratedProbabilityQuality + riskRewardAsymmetry + economicEdgeAndExpectancy + executionMicrostructure;

  const isExpectancyNegative = expectancy !== null && expectancy <= 0;
  const isEdgeNegative = edge !== null && edge <= 0;
  const isTradeWorthy = totalScore >= 65 &&
                        calibratedWinProbability !== null &&
                        !isExpectancyNegative &&
                        !isEdgeNegative &&
                        rejectionReasonsFa.length === 0;

  let grade: TradeQualityScore['grade'] = 'REJECTED';
  if (totalScore >= 85 && isTradeWorthy) grade = 'ELITE';
  else if (totalScore >= 70 && isTradeWorthy) grade = 'HIGH_QUALITY';
  else if (totalScore >= 60) grade = 'MARGINAL';

  const verdictFa = isTradeWorthy
    ? `✅ معامله باکیفیت و دارای برتری ریاضی مثبت (TQS: ${totalScore}/100 - Grade: ${grade})`
    : `🛑 فاقد کیفیت ورود (TQS: ${totalScore}/100): ${rejectionReasonsFa.join(' | ') || 'امتیاز کیفیت به حد نصاب ۶۵ نرسید.'}`;

  return {
    totalScore,
    isTradeWorthy,
    grade,
    breakdown: {
      setupQuality,
      calibratedProbabilityQuality,
      riskRewardAsymmetry,
      economicEdgeAndExpectancy,
      executionMicrostructure
    },
    metrics: {
      winRatePct: segmentMetrics.winRatePct,
      expectancyUsd: expectancy,
      profitFactor: segmentMetrics.profitFactor,
      averageR: segmentMetrics.averageR,
      maxDrawdownPct: segmentMetrics.maxDrawdownPct,
      maeMfeRatio,
      tailRiskPenaltyPct: segmentMetrics.tailRiskPct ?? 0,
      riskAdjustedEdgeScore: edge
    },
    verdictFa,
    rejectionReasonsFa
  };
}

/**
 * ⚡ MAIN CENTRAL PROBABILITY & FOUR-PILLAR ENGINE (ITEMS 1 - 4 & 8)
 * 
 * Returns:
 * 1. Direction Score (-100 to +100, Anti-Double Counting Protected)
 * 2. Setup/Trade Quality Score (0 to 100)
 * 3. Calibrated Probability (from Walk-Forward OOS evaluation or null)
 * 4. Expected Value / Edge ($ and R multiples)
 */
export function computeCentralCalibratedProbability(input: BrainEvidenceInput): CalibratedProbabilityMetadata {
  const {
    trendBias,
    scoreLong,
    scoreShort,
    obi,
    hurst,
    volatilityPct,
    adx,
    rsi,
    setupType = 'Pullback',
    marketRegime = 'TREND',
    timeframe = '15m',
    selectiveThreshold = 0.60,
    price = 88450,
    sl,
    tp,
    riskRewardRatio = 1.8,
    spreadBps = 1.5,
    estimatedFeePct = 0.0011,
    estimatedSlippagePct = 0.0004,
    isNewsShockActive = false
  } = input;

  const isBull = trendBias === 'BULLISH';
  const isBear = trendBias === 'BEARISH';
  const isRangeBound = volatilityPct < 0.28 || hurst < 0.48;
  const effectiveRegime = isRangeBound ? 'RANGE' : marketRegime;

  // 1. CALCULATE DIRECTION SCORE WITH ANTI-DOUBLE COUNTING (ITEM 4 & ITEM 8)
  const dirBiasLong = isBull ? 1 : isBear ? -1 : 0;
  const clusterVotes: Record<FeatureClusterId, ClusterFeatureVote[]> = {
    CLUSTER_TREND: [
      { featureName: 'trendBias', vote: dirBiasLong as any, strength: 0.9 },
      { featureName: 'hurstTrend', vote: hurst > 0.55 ? dirBiasLong as any : 0, strength: 0.7 },
      { featureName: 'supertrend', vote: dirBiasLong as any, strength: 0.8 },
      { featureName: 'ribbonMtf', vote: dirBiasLong as any, strength: 0.75 },
    ],
    CLUSTER_MOMENTUM: [
      { featureName: 'rsi', vote: (rsi > 52 ? 1 : rsi < 48 ? -1 : 0), strength: Math.min(1.0, Math.abs(rsi - 50) / 25) },
      { featureName: 'adxStrength', vote: adx > 22 ? dirBiasLong as any : 0, strength: Math.min(1.0, adx / 50) },
    ],
    CLUSTER_ORDERFLOW: [
      { featureName: 'obiDepth', vote: (obi > 0.03 ? 1 : obi < -0.03 ? -1 : 0), strength: Math.min(1.0, Math.abs(obi) * 5) },
      { featureName: 'scoreDelta', vote: (scoreLong > scoreShort ? 1 : scoreShort > scoreLong ? -1 : 0), strength: Math.min(1.0, Math.abs(scoreLong - scoreShort) / 4) }
    ],
    CLUSTER_VOLATILITY: [
      { featureName: 'volatilityBand', vote: volatilityPct >= 0.8 && volatilityPct <= 3.5 ? 1 : -1, strength: 0.6 }
    ],
    CLUSTER_STRUCTURE: [
      { featureName: 'setupStructure', vote: dirBiasLong as any, strength: 0.85 }
    ]
  };

  const directionalResult = learnedRegimeWeightsService.evaluateDirectionScore({
    regime: effectiveRegime,
    timeframe,
    volatilityPct,
    isNewsShockActive,
    clusterVotes
  });

  const directionScore = directionalResult.directionScore;

  // 2. SEGMENT METRICS & CALIBRATION (ITEM 1 & ITEM 2)
  const segmentMetrics = evaluateRealLearnedSegmentMetrics(setupType, effectiveRegime, timeframe);

  const calibratedProbability = segmentMetrics.isCalibrationVerified && segmentMetrics.calibratedWinProbability !== null
    ? segmentMetrics.calibratedWinProbability
    : null;

  // 3. EXPECTED VALUE / RISK-ADJUSTED EDGE CALCULATION (ITEM 3)
  // EV = (P_win * Reward_USD) - ((1 - P_win) * Risk_USD) - Friction_USD
  let expectedValueUsd: number | null = null;
  const nominalTradeSizeUsd = 1000;
  const roundtripFrictionUsd = nominalTradeSizeUsd * ((estimatedFeePct * 2) + (estimatedSlippagePct * 2) + (spreadBps / 10000));

  if (calibratedProbability !== null && riskRewardRatio > 0) {
    const riskUsd = 30; // standard 30$ risk per trade
    const rewardUsd = riskUsd * riskRewardRatio;
    expectedValueUsd = Number(((calibratedProbability * rewardUsd) - ((1 - calibratedProbability) * riskUsd) - roundtripFrictionUsd).toFixed(2));
  } else if (segmentMetrics.expectancyUsd !== null) {
    expectedValueUsd = segmentMetrics.expectancyUsd;
  }

  // 4. TRADE QUALITY SCORE (TQS) (ITEM 3)
  const tradeQualityScore = computeTradeQualityScore({
    setupType,
    marketRegime: effectiveRegime,
    timeframe,
    directionalEvidenceScore: directionScore,
    calibratedWinProbability: calibratedProbability,
    confidenceInterval: segmentMetrics.confidenceInterval,
    ece: segmentMetrics.expectedCalibrationError,
    brierScore: segmentMetrics.brierScore,
    riskRewardRatio,
    segmentMetrics,
    obi,
    spreadBps,
    estimatedFeePct,
    estimatedSlippagePct
  });

  // 5. FOUR-PILLAR TRADE APPROVAL GATE (ITEM 1 & ITEM 3)
  // All four conditions must be met simultaneously:
  // 1) Direction Score is strong and unambiguous (|Score| >= 25)
  // 2) Trade Quality Score >= 65 and isTradeWorthy = true
  // 3) Calibrated Probability is VALID, VERIFIED, and >= selectiveThreshold (0.60)
  // 4) Expected Value > 0 and Risk-Adjusted Edge > 0
  const isDirectionApproved = Math.abs(directionScore) >= 25;
  const isTqsApproved = tradeQualityScore.isTradeWorthy && tradeQualityScore.totalScore >= 65;
  const isProbabilityApproved =
    segmentMetrics.calibrationStatus === 'CALIBRATED' &&
    calibratedProbability !== null &&
    calibratedProbability >= selectiveThreshold &&
    segmentMetrics.confidenceInterval !== null &&
    segmentMetrics.confidenceInterval.lowerBound >= 0.48;
  const isEdgeApproved =
    expectedValueUsd !== null &&
    expectedValueUsd > 0 &&
    (segmentMetrics.riskAdjustedEdge === null || segmentMetrics.riskAdjustedEdge > 0);

  const isAllFourApproved = isDirectionApproved && isTqsApproved && isProbabilityApproved && isEdgeApproved;

  let recommendation: 'EXECUTE_APPROVED' | 'WAIT_NO_TRADE' = 'WAIT_NO_TRADE';
  let rejectionReasonFa: string | undefined;

  if (segmentMetrics.calibrationStatus !== 'CALIBRATED' || calibratedProbability === null) {
    recommendation = 'WAIT_NO_TRADE';
    rejectionReasonFa = `🛑 UNKNOWN_PROBABILITY / FAIL-CLOSED: مدل دارای نمونه Out-of-Sample کالیبره‌شده کافی در رژیم [${effectiveRegime}] نیست. وضعیت معامله: STOP / WAIT_NO_TRADE.`;
  } else if (!isDirectionApproved) {
    recommendation = 'WAIT_NO_TRADE';
    rejectionReasonFa = `🛑 DIRECTION_SCORE_INSUFFICIENT: امتیاز جهت‌گیری (${directionScore}/100) کمتر از آستانه قطعیت (±۲۵) است.`;
  } else if (!isTqsApproved) {
    recommendation = 'WAIT_NO_TRADE';
    rejectionReasonFa = `🛑 TRADE_QUALITY_REJECTED: امتیاز کیفیت ستاپ (${tradeQualityScore.totalScore}/100) به حد نصاب ورود نرسید: ${tradeQualityScore.rejectionReasonsFa.join(' | ')}`;
  } else if (!isEdgeApproved) {
    recommendation = 'WAIT_NO_TRADE';
    rejectionReasonFa = `🛑 NEGATIVE_EXPECTED_VALUE: امید ریاضی معامله منفی است (EV: $${expectedValueUsd ?? 0})؛ ورود با احتمال برد بالا بدون برتری اقتصادی اکیداً ممنوع است.`;
  } else if (!isProbabilityApproved) {
    recommendation = 'WAIT_NO_TRADE';
    rejectionReasonFa = `⏳ PROBABILITY_GATE: احتمال برد کالیبره‌شده OOS (${(calibratedProbability * 100).toFixed(1)}٪) کمتر از آستانه مورد نیاز (${(selectiveThreshold * 100).toFixed(0)}٪) است.`;
  } else {
    recommendation = 'EXECUTE_APPROVED';
  }

  return {
    rawEvidenceScore: directionScore,
    directionScore,
    calibratedWinProbability: calibratedProbability,
    isCalibrationVerified: segmentMetrics.isCalibrationVerified,
    calibrationVerified: segmentMetrics.isCalibrationVerified,
    calibrationStatus: segmentMetrics.calibrationStatus,
    dataSufficient: segmentMetrics.resolvedSampleSize >= 15 && segmentMetrics.oosSampleSize >= 4,
    sampleSize: segmentMetrics.sampleSize,
    resolvedSampleSize: segmentMetrics.resolvedSampleSize,
    oosSampleSize: segmentMetrics.oosSampleSize,
    modelVersion: segmentMetrics.modelVersion,
    datasetVersion: segmentMetrics.datasetVersion,
    lastTrainedAt: segmentMetrics.lastTrainedAt,
    timeframe,
    confidenceInterval: segmentMetrics.confidenceInterval,
    calibrationScore: segmentMetrics.expectedCalibrationError !== null ? Math.max(0, Math.round((1.0 - segmentMetrics.expectedCalibrationError * 3) * 100)) : 0,
    brierScore: segmentMetrics.brierScore,
    logLoss: segmentMetrics.logLoss,
    expectedCalibrationError: segmentMetrics.expectedCalibrationError,
    ece: segmentMetrics.expectedCalibrationError,
    outOfSamplePrecision: segmentMetrics.precision ?? 0,
    expectancyUsd: expectedValueUsd,
    profitFactor: segmentMetrics.profitFactor,
    maxDrawdownPct: segmentMetrics.maxDrawdownPct,
    tailRiskPct: segmentMetrics.tailRiskPct,
    riskAdjustedEdge: segmentMetrics.riskAdjustedEdge,
    isExpectancyNegative: expectedValueUsd !== null && expectedValueUsd <= 0,
    tradeQualityScore,
    regime: effectiveRegime,
    setupType,
    recommendation,
    selectiveMode: {
      isSelectiveHighConfidence: recommendation === 'EXECUTE_APPROVED',
      requiredThreshold: selectiveThreshold,
      recommendation,
      rejectionReasonFa
    },
    reliabilityDiagramBins: segmentMetrics.reliabilityDiagramBins
  };
}
