import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, BarChart3, Settings, Activity, Gauge } from 'lucide-react';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import UsageLimiter from './UsageLimiter';
import Login from "./pages/Login";

const TNB_RATE = 0.2703;
const DAILY_BUDGET = 200;
const LOCATION = { name: 'Serdang, Selangor', lat: 2.9967, lon: 101.7187 };

function getTariffBlock() {
  const h = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  if (isWeekend) return { label: 'Off-Peak', color: '#10b981', rate: 0.218 };
  if (h >= 8 && h < 22) return { label: 'Peak', color: '#f59e0b', rate: 0.2703 };
  return { label: 'Off-Peak', color: '#10b981', rate: 0.218 };
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  
  const [powerLimit, setPowerLimit] = useState(() => parseFloat(localStorage.getItem('powerLimit')) || 5.0);
  const [costLimit, setCostLimit] = useState(() => parseFloat(localStorage.getItem('costLimit')) || 20.0);
  
  const [liveData, setLiveData] = useState({ total_power: 0, ac: 0, fridge: 0, tv: 0, lighting: 0, random_sensor: 0, current_usage_kW: 0, predicted_next_hour_kW: 0 });
  const [history, setHistory] = useState(Array(20).fill(0));
  const [weather, setWeather] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [dailyKwh, setDailyKwh] = useState(0);
  const [uptime, setUptime] = useState(0);
  
  const tariff = getTariffBlock();
  const accRef = useRef(0);

  // Authentication check on load
  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('powerLimit', powerLimit);
    localStorage.setItem('costLimit', costLimit);
  }, [powerLimit, costLimit]);

  // Data polling - only runs when authenticated
  useEffect(() => {
    if (!isAuthenticated) return; 

    const fetchLive = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5001/latest');
        const data = await res.json();
        setLiveData(data);
        const kw = data.total_power || data.current_usage_kW || 0;
        setHistory(prev => [...prev.slice(1), kw]);
        accRef.current += kw * (2 / 3600);
        setDailyKwh(parseFloat(accRef.current.toFixed(4)));
      } catch (err) { console.warn("Live fetch error", err) }
    };

    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FKuala_Lumpur`);
        const json = await res.json();
        setWeather({ temp: Math.round(json.current.temperature_2m), humidity: json.current.relative_humidity_2m, code: json.current.weather_code });
      } catch (e) { console.warn('Weather fetch error', e) }
    };

    const fetchDaily = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5001/daily');
        const data = await res.json();
        setDailyData(data.reverse());
      } catch (e) { console.warn('Daily fetch error', e) }
    };

    fetchLive(); fetchWeather(); fetchDaily();
    const timer = setInterval(() => setUptime(prev => prev + 1), 60000);
    const intervalLive = setInterval(fetchLive, 2000);
    const intervalWeather = setInterval(fetchWeather, 300000);
    
    return () => { clearInterval(intervalLive); clearInterval(intervalWeather); clearInterval(timer); };
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isLoggedIn');
  };

  const total = liveData.total_power || liveData.current_usage_kW || 0;
  const predicted = liveData.predicted_next_hour_kW || 0;

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen p-4 flex justify-center bg-[#020617] font-sans relative">
      <button onClick={handleLogout} className="absolute top-8 right-8 text-slate-600 hover:text-white text-xs uppercase font-bold z-50">Logout</button>
      
      <div className="w-full max-w-[1500px] h-full flex gap-5">
        <div className="w-64 shrink-0 flex flex-col gap-4 h-full">
          <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative flex flex-col h-[380px] shrink-0">
             <div className="absolute inset-0">
                <img src="/house.png" alt="My House" className="w-full h-full object-cover opacity-70" />
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent z-10" />
             <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
                <h1 className="text-3xl font-bold text-white">Lounge</h1>
                <p className="text-emerald-400 font-bold mt-2">{dailyKwh.toFixed(3)} kWh Today</p>
                <div className="flex items-center gap-2 mt-4 p-2 bg-slate-950/50 rounded-lg border border-slate-800">
                  <Activity size={14} className="text-indigo-400" />
                  <span className="text-[11px] text-slate-300">Online ({uptime} min)</span>
                </div>
             </div>
          </div>

          <div className="flex-1 bg-slate-900/80 rounded-3xl border border-slate-800 p-3 flex flex-col gap-2">
            <button onClick={() => setActivePage('overview')} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${activePage === 'overview' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <LayoutDashboard size={20} /> Overview
            </button>
            <button onClick={() => setActivePage('analytics')} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${activePage === 'analytics' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <BarChart3 size={20} /> Deep Analytics
            </button>
            <button onClick={() => setActivePage('limiter')} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${activePage === 'limiter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Gauge size={20} /> Usage Limiter
            </button>
            <div className="flex-1" />
            <button onClick={() => setActivePage('settings')} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${activePage === 'settings' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Settings size={20} /> Settings
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto pr-2 pb-6">
          {activePage === 'overview' && <Overview liveData={liveData} history={history} weather={weather} tariff={tariff} total={total} predicted={predicted} powerLimit={powerLimit} costLimit={costLimit} />}
          {activePage === 'analytics' && <Analytics dailyData={dailyData} />}
          {activePage === 'limiter' && <UsageLimiter powerLimit={powerLimit} setPowerLimit={setPowerLimit} costLimit={costLimit} setCostLimit={setCostLimit} />}
          {activePage === 'settings' && <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 text-white">System Settings</div>}
        </div>
      </div>
    </div>
  );
}