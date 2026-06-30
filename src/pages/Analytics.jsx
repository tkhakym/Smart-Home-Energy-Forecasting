import React, { useState, useEffect } from 'react';
import { Database, Server, Cpu, Clock } from 'lucide-react';

function HistoricalList({ data, view }) {
  // If data is empty, inform the user based on the selected view
  if (!data || data.length === 0) {
    return (
      <div className="text-slate-500 text-sm p-4 italic">
        No records found for {view} view. Try "Live" to see incoming data.
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-2 flex flex-col gap-2 mt-2">
      {data.map((d, i) => {
        // Handle variations in keys returned by grouped SQL queries
        const powerValue = d.total_power !== undefined ? d.total_power : (d.average || 0);
        
        return (
          <div key={i} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <span className="text-sm text-slate-300 font-mono">
              {d.timestamp}
            </span>
            <span className="text-sm font-bold text-emerald-400">
              {typeof powerValue === 'number' ? powerValue.toFixed(2) : "0.00"} kW
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [dbData, setDbData] = useState({ totals: {}, history: [] });
  const [timeView, setTimeView] = useState('live'); 

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Explicitly requesting the view from the backend
        const res = await fetch(`http://127.0.0.1:5001/api/analytics?view=${timeView}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setDbData(data);
      } catch (e) { console.warn('Analytics DB fetch failed', e); }
    };
    
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 2000);
    return () => clearInterval(interval);
  }, [timeView]);

  const totals = dbData.totals || {};
  const totalSum = totals.sum_total || 1; 

  const appliances = [
    { label: 'Air Con', value: totals.sum_ac || 0, color: '#38bdf8' },
    { label: 'Fridge', value: totals.sum_fridge || 0, color: '#818cf8' },
    { label: 'TV', value: totals.sum_tv || 0, color: '#fb923c' },
    { label: 'Lighting', value: totals.sum_lighting || 0, color: '#facc15' },
    { label: 'Phantom', value: totals.sum_phantom || 0, color: '#f472b6' },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-4 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <Database className="text-indigo-400" />
        Database Analytics
      </h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col h-[340px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold tracking-widest">Cumulative Device Draw</p>
              <p className="text-sm text-slate-500 mt-1">Total energy consumed by appliance based on SQLite history.</p>
            </div>
            <Server className="text-indigo-400" size={24} />
          </div>
          
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            {appliances.map((app, idx) => {
              const pct = (app.value / totalSum) * 100;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{app.label}</span>
                    <span style={{ color: app.color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: app.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 h-[340px]">
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 flex flex-col flex-1">
             <div className="flex items-center gap-2 mb-2">
                <Cpu className="text-emerald-400" size={16} />
                <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">Database Records</p>
             </div>
             <p className="text-4xl font-bold text-white mt-1">{totals.record_count || 0}</p>
             <p className="text-xs text-slate-500 mt-1">Rows inserted from Wokwi</p>
          </div>

          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden flex-[1.5]">
            <div className="absolute -inset-10 bg-emerald-500/10 blur-3xl rounded-full" />
            <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest mb-3 z-10">Eco Score</p>
            <div className="relative flex items-center justify-center z-10 mb-2">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * 92) / 100} className="text-emerald-400" strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-white">92</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col h-80 mb-6">
        <div className="flex justify-between items-center mb-2 shrink-0">
          <div>
            <p className="text-slate-400 uppercase text-xs font-bold tracking-widest">Historical Timeline Trace</p>
            <p className="text-sm text-slate-500 mt-1">Recorded instances from the local database.</p>
          </div>
          
          <div className="flex bg-slate-800/80 rounded-lg p-1 gap-1 border border-slate-700">
            {['live', 'hourly', 'daily', 'monthly'].map((view) => (
              <button
                key={view}
                onClick={() => setTimeView(view)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all duration-200 ${
                  timeView === view 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 w-full overflow-hidden mt-1">
          <HistoricalList data={dbData.history} view={timeView} />
        </div>
      </div>
    </div>
  );
}