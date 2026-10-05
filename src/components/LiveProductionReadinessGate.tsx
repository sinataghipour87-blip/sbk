import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertOctagon, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Zap, 
  Sliders, 
  Activity, 
  Server, 
  Key, 
  TrendingDown 
} from 'lucide-react';

export const LiveProductionReadinessGate: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiKeyInput, setApiKeyInput] = useState<string>('key_live_sample');
  const [apiSecretInput, setApiSecretInput] = useState<string>('sec_live_sample');
  const [hasWithdrawPermission, setHasWithdrawPermission] = useState<boolean>(false);
  const [testResultMsg, setTestResultMsg] = useState<string>('');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/live/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyApiKey = async () => {
    try {
      const res = await fetch('/api/live/check-api-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeyInput,
          apiSecret: apiSecretInput,
          permissions: { trade: true, withdraw: hasWithdrawPermission }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResultMsg(data.error || 'خطا در اعتبارسنجی کلید API');
      } else {
        setTestResultMsg(data.message || 'کلید API با موفقیت تأیید شد.');
      }
      fetchStatus();
    } catch (err: any) {
      setTestResultMsg(err.message);
    }
  };

  const handleToggleKillSwitch = async (active: boolean) => {
    try {
      const res = await fetch('/api/live/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active,
          cancelOpenOrders: true,
          closePositions: false
        })
      });
      const data = await res.json();
      setTestResultMsg(data.message);
      fetchStatus();
    } catch (err: any) {
      setTestResultMsg(err.message);
    }
  };

  const handleRunReadinessTests = async () => {
    try {
      const res = await fetch('/api/live/run-readiness-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setTestResultMsg(data.message);
      fetchStatus();
    } catch (err: any) {
      setTestResultMsg(err.message);
    }
  };

  const handleToggleAutoTrade = async (enable: boolean) => {
    try {
      const res = await fetch('/api/live/toggle-auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable })
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResultMsg(data.error || 'فعال‌سازی معاملات خودکار رد شد.');
      } else {
        setTestResultMsg(enable ? 'معاملات خودکار زنده با موفقیت فعال شد.' : 'معاملات خودکار متوقف شد.');
      }
      fetchStatus();
    } catch (err: any) {
      setTestResultMsg(err.message);
    }
  };

  if (loading || !status) {
    return (
      <div className="p-6 bg-slate-900 text-white rounded-xl flex items-center justify-center space-x-3">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        <span>در حال بارگذاری دروازه ایمنی و آمادگی تولید...</span>
      </div>
    );
  }

  const allTestsPassed = Object.values(status.readinessTests).every((t: any) => t.status === 'PASS');

  return (
    <div className="space-y-6 bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">دروازه امنیتی و تست‌های آمادگی تولید (Live Trading Safety & Gate)</h2>
            <p className="text-sm text-slate-400">۵ شرط امنیتی حیاتی قبل از اتصال سرمایه واقعی (موارد ۳۶ تا ۴۰)</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 ${
            status.liveAutoTradeEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${status.liveAutoTradeEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>{status.liveAutoTradeEnabled ? 'وضعیت: معاملات زنده فعال' : 'وضعیت: مسدود / غیرفعال'}</span>
          </div>
        </div>
      </div>

      {testResultMsg && (
        <div className="p-4 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 text-sm flex items-center justify-between">
          <span>{testResultMsg}</span>
          <button onClick={() => setTestResultMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Grid of 5 Security Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Item 36: API Key Permission Check */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">۳۶. بررسی مجوزهای API (Trade Only)</h3>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              status.apiKeyPermissions.withdraw ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {status.apiKeyPermissions.withdraw ? 'خطر: برداشت فعال است' : 'ایمن: برداشت غیرفعال است'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            کلید API باید صرفاً دسترسی معامله (Trade) داشته باشد و دسترسی برداشت (Withdrawal) اکیداً غیرفعال باشد. در صورت فعال بودن برداشت، سیستم معاملات زنده را مسدود می‌کند.
          </p>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">کلید API (API Key)</label>
              <input 
                type="password" 
                value={apiKeyInput ?? ''} 
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div className="flex items-center space-x-3 pt-1">
              <input 
                type="checkbox" 
                id="withdrawCheck" 
                checked={hasWithdrawPermission}
                onChange={(e) => setHasWithdrawPermission(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="withdrawCheck" className="text-xs text-rose-400 font-medium">
                مجوز برداشت (Withdrawal Permission) فعال باشد (تست مسدودسازی)
              </label>
            </div>
            <button 
              onClick={handleVerifyApiKey}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition"
            >
              بررسی و تأیید امنیتی مجوزهای API
            </button>
          </div>
        </div>

        {/* Item 37: Real Server-Side Kill Switch */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              <h3 className="font-semibold text-white">۳۷. کلید اضطراری واقعی (Kill Switch)</h3>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              status.killSwitchActive ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-300'
            }`}>
              {status.killSwitchActive ? 'کلید اضطراری فعال است!' : 'غیرفعال (نرمال)'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            توقف فوری تمامی سفارش‌های جدید، لغو سفارش‌های باز و بستن پوزیشن‌ها در سرور بدون وابستگی به رابط کاربری (Frontend).
          </p>
          <div className="pt-4 flex flex-col space-y-3">
            {status.killSwitchActive ? (
              <button 
                onClick={() => handleToggleKillSwitch(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition flex items-center justify-center space-x-2"
              >
                <Unlock className="w-4 h-4" />
                <span>غیرفعال‌سازی (Disarm) کلید اضطراری</span>
              </button>
            ) : (
              <button 
                onClick={() => handleToggleKillSwitch(true)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-sm transition flex items-center justify-center space-x-2 animate-bounce"
              >
                <Lock className="w-4 h-4" />
                <span>🚨 فعال‌سازی فوری Kill Switch (توقف کامل معاملات)</span>
              </button>
            )}
            <div className="text-xs text-slate-500 text-center">
              با فعال شدن کلید اضطراری، سرور بلافاصله درخواست‌های سفارش جدید را رد می‌کند.
            </div>
          </div>
        </div>

        {/* Item 38: Daily Loss Limit & Global Drawdown Limit */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">۳۸. محدودیت زیان روزانه و افت سرمایه جهانی</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">
              Server Enforced
            </span>
          </div>
          <p className="text-xs text-slate-400">
            کنترل سمت سرور: در صورت رسیدن به سقف ضرر روزانه (NO NEW TRADES) یا عبور از افت کل (GLOBAL TRADING FREEZE).
          </p>
          <div className="space-y-3 pt-2 text-sm">
            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">زیان روزانه فعلی / سقف مجاز:</span>
              <span className="font-mono text-white">${status.currentDailyLossUSD} / ${status.dailyLossLimitUSD}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">افت سرمایه جهانی / سقف مجاز:</span>
              <span className="font-mono text-white">{status.currentDrawdownPercent}% / {status.globalDrawdownLimitPercent}%</span>
            </div>
          </div>
        </div>

        {/* Item 39: Anti-Martingale / Recovery Guard */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">۳۹. محافظ ضد مارتینگل و گارد بازیابی</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300">
              فعال (Strict)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            سیستم مجاز به افزایش حجم برای جبران ضرر (Martingale، Loss Chasing، Revenge Trade) نیست، مگر اینکه موتور ریسک مستقل یک Setup کاملاً معتبر جدید تأیید کند.
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="text-emerald-400 font-medium">✓ وضعیت محافظت فعال:</div>
            <div>• مسدودسازی افزایش خودکار حجم معامله در ضرر</div>
            <div>• الزام تاییدیه Setup مستقل برای پوزیشن‌های بازیابی</div>
          </div>
        </div>

      </div>

      {/* Item 40: Production Readiness Gate (17 Tests) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>۴۰. دروازه آمادگی تولید (۱۷ تست حیاتی)</span>
            </h3>
            <p className="text-xs text-slate-400">
              معاملات خودکار زنده فقط زمانی فعال می‌شود که هر ۱۷ تست زیر با موفقیت (PASS) تأیید شوند.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleRunReadinessTests}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 transition flex items-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>اجرای مجدد ۱۷ تست آمادگی</span>
            </button>
            <button 
              onClick={() => handleToggleAutoTrade(!status.liveAutoTradeEnabled)}
              disabled={!allTestsPassed || status.killSwitchActive}
              className={`px-5 py-2 rounded-lg font-bold text-xs transition shadow-lg ${
                !allTestsPassed || status.killSwitchActive
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : status.liveAutoTradeEnabled
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {status.liveAutoTradeEnabled ? 'توقف معاملات خودکار زنده' : 'فعال‌سازی معاملات خودکار زنده (Live Auto Trade)'}
            </button>
          </div>
        </div>

        {/* 17 Tests Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {Object.entries(status.readinessTests as Record<string, { status: string; message: string }>).map(([testName, testInfo]) => {
            const isPass = testInfo.status === 'PASS';
            return (
              <div 
                key={testName}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                  isPass ? 'bg-slate-950/80 border-emerald-500/20' : 'bg-rose-950/20 border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{testName}</span>
                  {isPass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {testInfo.message}
                </div>
              </div>
            );
          })}
        </div>

        {!allTestsPassed && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>هشدار: حداقل یکی از تست‌های آمادگی تولید ناموفق بوده یا مجوز برداشت فعال است. LIVE AUTO TRADE = BLOCKED.</span>
          </div>
        )}
      </div>

    </div>
  );
};
