import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types/trading';
import { Settings, Key, ShieldCheck, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface SettingsPanelProps {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = React.useState<UserSettings>({
    ...settings,
    rangeFilterEnabled: settings.rangeFilterEnabled ?? true,
    volatilityThreshold: settings.volatilityThreshold ?? 0.28,
    precisionPullbackEnabled: settings.precisionPullbackEnabled ?? true,
  });

  // Exchange Credentials State (Server-Side Only)
  const [adminTokenInput, setAdminTokenInput] = useState(() => localStorage.getItem('admin_token') || '');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const [isTestnet, setIsTestnet] = useState(false);
  const [exchangeStatus, setExchangeStatus] = useState<any>(null);
  const [isCheckingExchange, setIsCheckingExchange] = useState(false);
  const [exchangeMsg, setExchangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchExchangeStatus = async () => {
    setIsCheckingExchange(true);
    try {
      const res = await fetch('/api/exchange/status');
      const data = await res.json();
      setExchangeStatus(data);
    } catch (e) {
      setExchangeStatus({ connected: false, error: 'عدم ارتباط با سرور' });
    } finally {
      setIsCheckingExchange(false);
    }
  };

  useEffect(() => {
    fetchExchangeStatus();
  }, []);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput || !apiSecretInput) {
      setExchangeMsg({ type: 'error', text: 'لطفاً هر دو فیلد API Key و API Secret را وارد کنید.' });
      return;
    }
    setIsCheckingExchange(true);
    setExchangeMsg(null);
    try {
      const res = await fetch('/api/exchange/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput, apiSecret: apiSecretInput, isTestnet }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setExchangeMsg({ type: 'success', text: data.message || 'کلیدها با موفقیت در سرور با رمزنگاری ذخیره شدند.' });
        setApiKeyInput('');
        setApiSecretInput('');
        fetchExchangeStatus();
      } else {
        setExchangeMsg({ type: 'error', text: data.error || 'خطا در اعتبارسنجی با صرافی.' });
      }
    } catch (err: any) {
      setExchangeMsg({ type: 'error', text: err.message || 'خطا در ارتباط با سرور.' });
    } finally {
      setIsCheckingExchange(false);
    }
  };

  const handleRevokeCredentials = async () => {
    if (!confirm('آیا از لغو و حذف کلیدهای صرافی از سرور اطمینان دارید؟')) return;
    setIsCheckingExchange(true);
    try {
      const res = await fetch('/api/exchange/credentials', { method: 'DELETE' });
      const data = await res.json();
      setExchangeMsg({ type: 'success', text: data.message || 'کلیدها با موفقیت لغو و پاکسازی شدند.' });
      fetchExchangeStatus();
    } catch (e: any) {
      setExchangeMsg({ type: 'error', text: 'خطا در لغو کلیدها.' });
    } finally {
      setIsCheckingExchange(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#051424] border border-cyan-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl text-right font-mono max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 border-b border-cyan-950 pb-3">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-cyan-200">تنظیمات ربات خودکار و اتصال امن صرافی</h2>
        </div>
        
        <div className="space-y-4 text-xs font-mono text-slate-300">
          {/* Server-Side Exchange Connection Box (Issues 27 & 28) */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>اتصال امن به صرافی (Server-Side Encrypted):</span>
              </span>
              <button
                type="button"
                onClick={fetchExchangeStatus}
                disabled={isCheckingExchange}
                className="p-1 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-colors"
                title="بروزرسانی وضعیت صرافی"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingExchange ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-1.5 pb-2 border-b border-cyan-950/40">
              <span className="text-slate-400 block text-[10px]">توکن ادمین سرور (ADMIN_TOKEN):</span>
              <input
                type="password"
                placeholder="توکن ادمین جهت احراز هویت درخواست‌ها"
                value={adminTokenInput ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setAdminTokenInput(val);
                  localStorage.setItem('admin_token', val);
                }}
                className="w-full bg-[#020b17] border border-slate-700 rounded p-1.5 text-[11px] text-cyan-300 font-sans"
              />
            </div>

            {exchangeStatus?.connected ? (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اتصال لایو برقرار است ({exchangeStatus.isTestnet ? 'تست‌نت' : 'لایو واقعی'})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{exchangeStatus.keyMasked}</span>
                </div>
                <div className="text-[10px] text-slate-300 flex justify-between">
                  <span>موجودی USDT در دسترس:</span>
                  <span className="text-emerald-400 font-bold">${exchangeStatus.availableBalanceUsdt?.toFixed(2) || '0.00'}</span>
                </div>
                {exchangeStatus?.ipRestrictionWarning && (
                  <div className="mt-1.5 p-2 rounded bg-rose-950/45 border border-rose-500/40 text-[10.5px] text-rose-300 font-bold leading-relaxed text-right">
                    ⚠️ {exchangeStatus.ipRestrictionWarning}
                  </div>
                )}
                <div className="pt-1.5 border-t border-emerald-900/50 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRevokeCredentials}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[10px] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>لغو و حذف کلیدها (Revoke)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-[10.5px] text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span>کلیدهای صرافی پیکربندی نشده است (ترید خودکار لایو مسدود است).</span>
                </div>

                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder="Bybit API Key"
                    value={apiKeyInput ?? ''}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full bg-[#020b17] border border-slate-700 rounded p-1.5 text-[11px] text-cyan-300"
                  />
                  <input
                    type="password"
                    placeholder="Bybit API Secret (رمزنگاری در سرور - AES-256)"
                    value={apiSecretInput ?? ''}
                    onChange={(e) => setApiSecretInput(e.target.value)}
                    className="w-full bg-[#020b17] border border-slate-700 rounded p-1.5 text-[11px] text-cyan-300"
                  />
                  <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTestnet}
                      onChange={(e) => setIsTestnet(e.target.checked)}
                      className="accent-cyan-500"
                    />
                    <span>استفاده از Bybit Testnet (محیط آزمایشی فیوچرز)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveCredentials}
                    disabled={isCheckingExchange}
                    className="w-full bg-cyan-700 hover:bg-cyan-600 py-1.5 rounded-lg text-white font-bold text-[11px] transition-colors"
                  >
                    {isCheckingExchange ? 'در حال تایید و ذخیره در سرور...' : 'ثبت و رمزنگاری کلیدها در سرور'}
                  </button>
                </div>
              </div>
            )}

            {exchangeMsg && (
              <div className={`p-2 rounded text-[10px] ${exchangeMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700' : 'bg-rose-950/80 text-rose-300 border border-rose-700'}`}>
                {exchangeMsg.text}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-slate-400 block mb-1">درصد ریسک در هر معامله (Kelly Risk %):</span>
            <input 
              type="number" 
              step="0.1" 
              value={localSettings.riskPct ?? 1.5} 
              onChange={(e) => setLocalSettings({...localSettings, riskPct: parseFloat(e.target.value) || 1.5})} 
              className="w-full bg-[#020b17] border border-cyan-800 rounded p-2 text-cyan-300 font-bold"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-slate-200 font-bold block text-[11px]">🛡️ فیلتر تاییدیه خروج از فاز رنج (Range Filter)</span>
              <span className="text-[10px] text-slate-400 block">جلوگیری از باز شدن معامله در زمان کم‌نوسانی و ساید بودن بازار</span>
            </div>
            <input 
              type="checkbox" 
              checked={localSettings.rangeFilterEnabled} 
              onChange={(e) => setLocalSettings({...localSettings, rangeFilterEnabled: e.target.checked})} 
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </label>

          <label className="block">
            <span className="text-slate-400 block mb-1">حداقل آستانه نوسان مجاز (Min Volatility Threshold %):</span>
            <input 
              type="number" 
              step="0.05" 
              value={localSettings.volatilityThreshold ?? 0.28} 
              onChange={(e) => setLocalSettings({...localSettings, volatilityThreshold: parseFloat(e.target.value) || 0.28})} 
              className="w-full bg-[#020b17] border border-cyan-800 rounded p-2 text-cyan-300 font-bold"
            />
          </label>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-slate-200 font-bold block text-[11px]">🎯 نحوه تسویه سود معامله (Take-Profit Mode)</span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, takeProfitMode: 'FULL_TP1' })}
                className={`py-2 px-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  localSettings.takeProfitMode !== 'STEPPED_3_TIER'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                ⚡ خروج ۱۰۰٪ فوری در تارگت اول (TP1)
              </button>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, takeProfitMode: 'STEPPED_3_TIER' })}
                className={`py-2 px-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  localSettings.takeProfitMode === 'STEPPED_3_TIER'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                📈 خروج پله‌ای ۳ مرحله‌ای (TP1/TP2/TP3)
              </button>
            </div>
            <span className="text-[9.5px] text-slate-400 block">
              {localSettings.takeProfitMode !== 'STEPPED_3_TIER' 
                ? 'به محض رسیدن به تارگت اول، ۱۰۰٪ معامله با سود کامل بسته و ذخیره می‌شود.' 
                : 'در TP1 مقدار ۳۳٪، در TP2 مقدار ۳۳٪ و مابقی در TP3 تسویه می‌گردد.'}
            </span>
          </div>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-slate-200 font-bold block text-[11px]">🎯 ورود بهینه پولبک (Precision Limit Entry)</span>
              <span className="text-[10px] text-slate-400 block">ورود در بازگشت به اوردر بلاک/EMA20 به جای تعقیب مارکت</span>
            </div>
            <input 
              type="checkbox" 
              checked={localSettings.precisionPullbackEnabled} 
              onChange={(e) => setLocalSettings({...localSettings, precisionPullbackEnabled: e.target.checked})} 
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-slate-200 font-bold block text-[11px]">⚡ ماژول هجینگ هوشمند (افت ۲٪ و خروج سربه‌سر)</span>
              <span className="text-[10px] text-slate-400 block">فعال‌سازی پوزیشن معکوس دقیقاً در افت ۲٪ و تسویه خودکار در نقطه سربه‌سر ($0.00)</span>
            </div>
            <input 
              type="checkbox" 
              checked={localSettings.autoHedgeEnabled ?? true} 
              onChange={(e) => setLocalSettings({...localSettings, autoHedgeEnabled: e.target.checked})} 
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-slate-200 font-bold block text-[11px]">🔔 دریافت اعلان‌های سیستم</span>
              <span className="text-[10px] text-slate-400 block">اعلان‌های صوتی و تصویری سیگنال‌های قوی</span>
            </div>
            <input 
              type="checkbox" 
              checked={localSettings.notificationsEnabled} 
              onChange={(e) => setLocalSettings({...localSettings, notificationsEnabled: e.target.checked})} 
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </label>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button onClick={() => { onSave(localSettings); onClose(); }} className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-2.5 rounded-xl font-bold text-xs text-slate-900 transition-all">ذخیره تنظیمات</button>
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-bold text-xs text-slate-300 transition-all">انصراف</button>
        </div>
      </div>
    </div>
  );
};

