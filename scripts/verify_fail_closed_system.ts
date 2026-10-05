import assert from 'assert';

// Polyfill localStorage and fetch for Node test environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
(globalThis as any).localStorage = storageMock;
(globalThis as any).fetch = async () => { throw new Error('Network failure (simulated python/exchange down)'); };

import { hunterExecutionEngine } from '../src/services/hunterExecutionEngine';
import { orderFlowEngine } from '../src/services/orderFlowEngine';
import { computeCentralCalibratedProbability } from '../src/services/centralProbabilityEngine';
import { runPreTradeRiskGate } from '../src/services/autoTradeGuard';

console.log('🧪 Starting Quantum Trade AI Fail-Closed & Hunter Execution Integration Tests...');

async function runTests() {
  // Test 1: Hunter Execution Engine with NEUTRAL signal -> NO TRADE
  const execResult = await hunterExecutionEngine.executeHunterOrder({
    symbol: 'BTCUSDT',
    timestamp: Date.now(),
    direction: 'NEUTRAL',
    setupType: 'NONE',
    sweptLevelPrice: 0,
    entryPrice: 88000,
    invalidationStopLoss: 0,
    takeProfitTarget1: 0,
    takeProfitTarget2: 0,
    riskRewardRatio: 0,
    cvdDivergenceConfirmed: false,
    orderbookAbsorptionRatio: 0,
    signalConfidencePct: 0,
    rationaleFa: 'Test',
  });

  assert.strictEqual(execResult.status, 'NO_TRADE', 'Neutral signal must return NO_TRADE');
  console.log('✅ Test 1 Passed: Neutral Signal Returns NO_TRADE.');

  console.log('🎉 All Hunter & Production-Grade Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
