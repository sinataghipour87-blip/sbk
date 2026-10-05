import React, { useState, useEffect } from 'react';
import { ExecutionMode } from '../types/trading';

const ExecutionGovernorDashboard: React.FC = () => {
    const [mode, setMode] = useState<ExecutionMode>('BACKTEST');
    const [ceiling, setCeiling] = useState(5);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/execution/settings')
            .then(res => res.json())
            .then(data => {
                setMode(data.mode || 'BACKTEST');
                setCeiling(data.liveCapitalCeilingPct ?? 5);
            });
    }, []);

    const handleUpdate = (newMode: ExecutionMode, newCeiling: number) => {
        setLoading(true);
        fetch('/api/execution/mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: newMode, liveCapitalCeilingPct: newCeiling })
        })
        .then(() => {
            setMode(newMode);
            setCeiling(newCeiling);
            setLoading(false);
        });
    };

    return (
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-white">
            <h2 className="text-lg font-bold mb-4">مدیریت حالت اجرا (Execution Governor)</h2>
            <div className="flex gap-2 mb-4">
                {(['BACKTEST', 'TESTNET', 'PAPER', 'LIVE'] as ExecutionMode[]).map(m => (
                    <button
                        key={m}
                        className={`px-3 py-1 rounded ${mode === m ? 'bg-blue-600' : 'bg-slate-700'}`}
                        onClick={() => handleUpdate(m, ceiling)}
                    >
                        {m}
                    </button>
                ))}
            </div>
            <div className="mb-4">
                <label>سقف سرمایه لایو (%):</label>
                <input 
                    type="number" 
                    value={ceiling ?? 5} 
                    onChange={(e) => setCeiling(Number(e.target.value) || 5)}
                    className="ml-2 bg-slate-800 p-1 rounded"
                />
            </div>
            <div className="bg-slate-800 p-3 rounded">
                <h3 className="font-bold">داشبورد مقایسه‌ای</h3>
                <p>وضعیت فعلی: {mode}</p>
                <p>اسلیپیج واقعی در برابر پیش‌بینی: -</p>
                {/* Comparison logic goes here */}
            </div>
        </div>
    );
};

export default ExecutionGovernorDashboard;
