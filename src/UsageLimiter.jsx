import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, DollarSign, Zap } from 'lucide-react';

export default function SettingsPage({ powerLimit, setPowerLimit, costLimit, setCostLimit }) {
  const [localPower, setLocalPower] = useState(powerLimit);
  const [localCost, setLocalCost] = useState(costLimit);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setPowerLimit(localPower);
    setCostLimit(localCost);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-900 rounded-3xl border border-slate-800 p-8 h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-500/10 rounded-2xl">
          <SettingsIcon className="text-indigo-400" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">System Limits</h2>
          <p className="text-slate-400 text-sm">Configure your energy usage thresholds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3 mb-4"><Zap className="text-emerald-400" size={20} /><h3 className="text-white font-semibold">Power Limit (kW)</h3></div>
          <input type="number" value={localPower} onChange={(e) => setLocalPower(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3 mb-4"><DollarSign className="text-amber-400" size={20} /><h3 className="text-white font-semibold">Cost Limit (RM)</h3></div>
          <input type="number" value={localCost} onChange={(e) => setLocalCost(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>

      <button onClick={handleSave} className="mt-8 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
        <Save size={18} /> {saved ? 'Saved!' : 'Save Configuration'}
      </button>
    </div>
  );
}