import { ExecutionSettings } from '../types/trading';

export interface PerformanceSnapshot {
    winRate: number;
    expectancy: number;
    avgSlippageBps: number;
}

export const checkDiscrepancy = async (
    liveStats: PerformanceSnapshot,
    backtestStats: PerformanceSnapshot
): Promise<{ exceeded: boolean; message: string }> => {
    // Thresholds: WinRate +/- 10%, Expectancy +/- 20%, Slippage + 50%
    const winRateDiff = Math.abs(liveStats.winRate - backtestStats.winRate);
    const expectancyDiff = Math.abs(liveStats.expectancy - backtestStats.expectancy) / (Math.abs(backtestStats.expectancy) || 1);
    const slippageDiff = (liveStats.avgSlippageBps - backtestStats.avgSlippageBps) / (Math.abs(backtestStats.avgSlippageBps) || 1);

    if (winRateDiff > 0.10) return { exceeded: true, message: `تفاوت وین‌ریت: ${winRateDiff.toFixed(2)}%` };
    if (expectancyDiff > 0.20) return { exceeded: true, message: `تفاوت Expectancy: ${expectancyDiff.toFixed(2)}%` };
    if (slippageDiff > 0.50) return { exceeded: true, message: `اسلیپیج بیش از حد: ${slippageDiff.toFixed(2)}%` };

    return { exceeded: false, message: 'محدوده عملکرد طبیعی است.' };
};
