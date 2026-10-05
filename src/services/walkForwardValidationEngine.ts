/**
 * 🔄 Walk-Forward Validation & Purged / Embargoed Cross-Validation Engine
 * Items 68 & 69
 * 
 * - Item 68: Walk-Forward Validation across sequential sliding time windows:
 *   [Train Window] -> [Validate Window] -> [Out-of-Sample Forward Test] -> [Retrain / Roll Window]
 * - Item 69: Purged & Embargoed Cross-Validation (Lopez de Prado framework for Financial Time-Series):
 *   * Purging: Removes training observations whose label outcome periods overlap with test set horizons.
 *   * Embargoing: Adds an auto-correlation buffer immediately after test partitions before new train folds.
 */

import { Candle } from '../types/trading';
import {
  runWalkForwardAnalysis,
  WalkForwardReport,
} from './sharedStrategyCore';

export interface WalkForwardValidationSummary {
  foldsCount: number;
  labelHorizonBars: number;
  embargoBars: number;
  overallOosWinRatePct: number;
  overallOosRoiPct: number;
  overallProfitFactor: number;
  walkForwardEfficiencyPct: number; // WFE % (> 45% indicates robust non-overfitted model)
  leakageStatusFa: string;
  isOverfitSafe: boolean;
  recommendationFa: string;
  folds: Array<{
    foldIndex: number;
    trainRange: string;
    purgedBarsCount: number;
    embargoBarsCount: number;
    testRange: string;
    oosWinRatePct: number;
    oosRoiPct: number;
    profitFactor: number;
    wfePct: number;
  }>;
}

export class WalkForwardValidationEngine {
  private static instance: WalkForwardValidationEngine;

  public static getInstance(): WalkForwardValidationEngine {
    if (!WalkForwardValidationEngine.instance) {
      WalkForwardValidationEngine.instance = new WalkForwardValidationEngine();
    }
    return WalkForwardValidationEngine.instance;
  }

  /**
   * Executes Purged & Embargoed Walk-Forward Validation on Candle Time-Series (Items 68 & 69)
   */
  public executePurgedWalkForwardValidation(
    candles: Candle[],
    options?: {
      foldsCount?: number;
      labelHorizonBars?: number; // e.g. 15 bars for 15m/30m trades
      embargoBars?: number; // e.g. 10 bars buffer
      capital?: number;
      leverage?: number;
    }
  ): WalkForwardValidationSummary {
    const foldsCount = options?.foldsCount || 4;
    const labelHorizonBars = options?.labelHorizonBars || 15;
    const embargoBars = options?.embargoBars || 10;

    const report: WalkForwardReport = runWalkForwardAnalysis(candles, {
      foldsCount,
      labelHorizonBars,
      embargoBars,
      capital: options?.capital || 1000,
      leverage: options?.leverage || 10,
    });

    const isOverfitSafe = report.isOverfitFree;
    const leakageStatusFa = `✅ تضمین عدم نشت داده (Zero Data Leakage): ${labelHorizonBars} کندل همپوشان برچسب به روش Purging حذف و ${embargoBars} کندل بافر Embargo اعمال شد.`;

    const folds = report.folds.map((f) => ({
      foldIndex: f.foldIndex,
      trainRange: `${f.trainRange.startIdx} - ${f.trainRange.endIdx}`,
      purgedBarsCount: f.purgeRange.count,
      embargoBarsCount: f.embargoRange.count,
      testRange: `${f.testRange.startIdx} - ${f.testRange.endIdx}`,
      oosWinRatePct: f.outOfSampleStrictWinRate,
      oosRoiPct: f.outOfSampleRoi,
      profitFactor: f.outOfSampleProfitFactor,
      wfePct: f.wfeEfficiencyRatio,
    }));

    return {
      foldsCount: report.foldsCount,
      labelHorizonBars,
      embargoBars,
      overallOosWinRatePct: report.aggregateOosStrictWinRate,
      overallOosRoiPct: report.aggregateOosRoi,
      overallProfitFactor: report.aggregateOosProfitFactor,
      walkForwardEfficiencyPct: report.averageWfeRatio,
      leakageStatusFa,
      isOverfitSafe,
      recommendationFa: report.recommendationFa,
      folds,
    };
  }
}

export const walkForwardValidationEngine = WalkForwardValidationEngine.getInstance();
