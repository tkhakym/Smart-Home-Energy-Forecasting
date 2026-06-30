import React, { useState, useEffect, useRef } from 'react';
import { Zap, DollarSign, TrendingUp, BotMessageSquare, Wind, Thermometer, Clock, Activity } from 'lucide-react';
import {
  SciChartSurface, NumericAxis, SplineMountainRenderableSeries, XyDataSeries,
  EAutoRange, NumberRange, SciChartJsNavyTheme, EAxisAlignment, EllipsePointMarker,
  GradientParams, SweepAnimation, GenericAnimation, easing,
  HtmlCustomAnnotation, EHorizontalAnchorPoint, EVerticalAnchorPoint, ECoordinateMode,
} from 'scichart';

// Initialize SciChart Wasm
SciChartSurface.loadWasmFromCDN();

// Inject necessary CSS for animations and alerts
// Inject necessary CSS for animations and alerts
// Inject necessary CSS for animations and alerts
if (typeof document !== 'undefined' && !document.getElementById('overview-styles')) {
  const style = document.createElement('style');
  style.id = 'overview-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght,MONO@0,300..800,1;1,300..800,1&display=swap');
    
    .font-code {
      font-family: 'Google Sans Code', monospace;
    }

    @keyframes sciPulse {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.9); }
      70%  { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    .sci-blink-dot {
      width: 12px; height: 12px; border-radius: 50%;
      background: #10b981; border: 2px solid #065f46;
      animation: sciPulse 1.5s ease-out infinite; pointer-events: none;
    }
    @keyframes cursorBlink {
      0%, 50% { opacity: 1; }
      50.01%, 100% { opacity: 0; }
    }
    .typing-cursor-idle { animation: cursorBlink 1s step-end infinite; }
    
    @keyframes shake {
      0% { transform: translate(1px, 1px) rotate(0deg); }
      10% { transform: translate(-1px, -2px) rotate(-1deg); }
      20% { transform: translate(-3px, 0px) rotate(1deg); }
      30% { transform: translate(3px, 2px) rotate(0deg); }
      40% { transform: translate(1px, -1px) rotate(1deg); }
      50% { transform: translate(-1px, 2px) rotate(-1deg); }
      60% { transform: translate(-3px, 1px) rotate(0deg); }
      70% { transform: translate(3px, 1px) rotate(-1deg); }
      80% { transform: translate(-1px, -1px) rotate(1deg); }
      90% { transform: translate(1px, 2px) rotate(0deg); }
      100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    .danger-alert {
      animation: shake 0.5s;
      animation-iteration-count: infinite;
      outline: 4px solid rgba(239, 68, 68, 0.6);
      background-color: rgba(153, 27, 27, 0.05);
    }
  `;
  document.head.appendChild(style);
}

const WINDOW = 20;
const TNB_RATE = 0.2703;
const LOCATION_NAME = 'Serdang, Selangor';

const SENSOR_CONFIG = [
  { key: 'ac',       dataKey: 'ac',            label: 'Air Conditioner',  color: '#38bdf8', max: 3.0, normal: 1.2, high: 2.2 },
  { key: 'fridge',   dataKey: 'fridge',        label: 'Fridge',   color: '#818cf8', max: 0.8, normal: 0.35, high: 0.6 },
  { key: 'tv',       dataKey: 'tv',            label: 'TV',       color: '#fb923c', max: 0.3, normal: 0.12, high: 0.22 },
  { key: 'lighting', dataKey: 'lighting',      label: 'Lighting', color: '#facc15', max: 0.5, normal: 0.2, high: 0.4 },
  { key: 'phantom',  dataKey: 'random_sensor', label: 'Phantom',  color: '#f472b6', max: 0.5, normal: 0.1, high: 0.3 },
];

function PowerChart({ history }) {
  const wrapperRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const annotationRef = useRef(null);
  const xAxisRef = useRef(null);
  const surfaceRef = useRef(null);
  const xCounterRef = useRef(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const div = document.createElement('div');
    div.style.width = '100%'; div.style.height = '100%';
    wrapper.appendChild(div);
    let surface;

    const init = async () => {
      const { sciChartSurface, wasmContext } = await SciChartSurface.create(div, { theme: new SciChartJsNavyTheme() });
      surface = sciChartSurface; surfaceRef.current = sciChartSurface;
      sciChartSurface.background = 'transparent';

      const xAxis = new NumericAxis(wasmContext, { isVisible: false, autoRange: EAutoRange.Never, visibleRange: new NumberRange(0, WINDOW) });
      xAxisRef.current = xAxis;
      sciChartSurface.xAxes.add(xAxis);
      sciChartSurface.yAxes.add(new NumericAxis(wasmContext, {
        axisAlignment: EAxisAlignment.Right, autoRange: EAutoRange.Always,
        labelStyle: { fontSize: 11, color: '#64748b' }, majorGridLineStyle: { color: '#1e293b', strokeThickness: 1 },
      }));

      const dataSeries = new XyDataSeries(wasmContext);
      dataSeriesRef.current = dataSeries;
      history.forEach((val, i) => dataSeries.append(i, val));
      xCounterRef.current = history.length;

      const pointMarker = new EllipsePointMarker(wasmContext, { width: 7, height: 7, fill: '#10b981', stroke: '#065f46', strokeThickness: 1.5 });
      sciChartSurface.renderableSeries.add(new SplineMountainRenderableSeries(wasmContext, {
        dataSeries, stroke: '#10b981', strokeThickness: 2.5, interpolationPoints: 10, pointMarker,
        fillLinearGradient: new GradientParams({ x: 0, y: 0 }, { x: 0, y: 1 }, [
          { offset: 0, color: 'rgba(16,185,129,0.35)' }, { offset: 1, color: 'rgba(16,185,129,0)' },
        ]),
        animation: new SweepAnimation({ duration: 600, fadeEffect: true }),
      }));

      const blinkDiv = document.createElement('div'); blinkDiv.className = 'sci-blink-dot';
      const annotation = new HtmlCustomAnnotation({
        x1: 0, y1: 0, horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        verticalAnchorPoint: EVerticalAnchorPoint.Center, coordinateMode: ECoordinateMode.DataValue,
        html: blinkDiv,
      });
      annotationRef.current = annotation;
      sciChartSurface.annotations.add(annotation);
    };

    init().catch(console.error);
    return () => { if (surface) surface.delete(); if (wrapper.contains(div)) wrapper.removeChild(div); };
  }, []);

  useEffect(() => {
    const ds = dataSeriesRef.current; const surface = surfaceRef.current;
    const xAxis = xAxisRef.current; const annotation = annotationRef.current;
    if (!ds || !surface || !xAxis) return;
    const latest = history[history.length - 1]; const x = xCounterRef.current++;
    ds.append(x, latest);
    surface.addAnimation(new GenericAnimation({
      from: xAxis.visibleRange.min, to: Math.max(0, x + 1 - WINDOW), duration: 1800, ease: easing.inOutCubic,
      onAnimate: (from, to, progress) => { const newMin = from + (to - from) * progress; xAxis.visibleRange = new NumberRange(newMin, newMin + WINDOW); },
    }));
    if (annotation) { annotation.x1 = x; annotation.y1 = latest; }
  }, [history]);

  return <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} />;
}

function SensorCard({ label, color, value, max }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col gap-2 justify-between h-full shadow-lg">
      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{label}</p>
      <p className="text-xl font-bold leading-none" style={{ color }}>{value.toFixed(2)} <span className="text-xs text-slate-500 font-medium">kW</span></p>
      <div className="h-[3px] bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct.toFixed(1)}%`, background: color }} />
      </div>
      <p className="text-[10px] text-slate-500 font-medium">RM {(value * TNB_RATE).toFixed(3)}/hr</p>
    </div>
  );
}

function BreakdownPanel({ data, total, predicted }) {
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 h-full flex flex-col justify-center gap-4 shadow-lg">
      <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Breakdown</p>
      {SENSOR_CONFIG.map((s) => {
        const val = data[s.dataKey] || 0;
        
        // CORRECTION: Calculate width based on the sensor's maximum capacity, not the shared total.
        const pct = Math.min(100, (val / s.max) * 100); 
        
        return (
          <div key={s.key} className="flex items-center gap-3">
            <span className="text-slate-400 text-xs w-16 shrink-0 font-medium">{s.label}</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
              <div 
                className="h-full rounded-full transition-all duration-300 ease-out" 
                style={{ 
                  width: `${pct.toFixed(1)}%`, 
                  background: s.color,
                  boxShadow: val > 0.1 ? `0 0 8px ${s.color}60` : 'none'
                }} 
              />
            </div>
            <span className="text-slate-300 text-xs w-14 text-right shrink-0 font-medium">{val.toFixed(2)} kW</span>
          </div>
        );
      })}
      
      <div className="flex justify-between items-baseline border-t border-slate-800 pt-3 mt-2">
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total</span>
        <span className="text-emerald-400 text-base font-bold">{total.toFixed(2)} kW</span>
      </div>
      
      <div className="flex justify-between items-baseline border-t border-slate-800/50 pt-2">
        <span className="text-purple-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={12} /> Predicted
        </span>
        <span className="text-purple-400 text-sm font-bold">{predicted.toFixed(2)} kW</span>
      </div>
    </div>
  );
}

function buildEnergyReport(data, total, predicted, tariff, config, rate, weather, powerLimit, costLimit) {
  const highItems = [];
  const elevatedItems = [];
  let highCost = 0;
  let recommendations = [];

  // 1. Dynamic Check Against Config Thresholds
  config.forEach(sensor => {
    const val = data[sensor.dataKey] || 0;
    if (val >= sensor.high) {
      highItems.push(sensor.label);
      highCost += val * rate;
      
      // Target advice based on specific appliance faults
      if (sensor.key === 'ac') {
        if (weather && weather.temp < 26) {
          recommendations.push("The outside temperature is a cool " + weather.temp + "°C; consider opening windows and shutting off the Air Con entirely.");
        } else {
          recommendations.push("Increase your AC thermostat setting to 24°C or use fan mode to drastically reduce motor stress.");
        }
      }
      if (sensor.key === 'fridge') recommendations.push("Avoid unnecessary fridge door openings and check if dust buildup on the rear coils is reducing cooling efficiency.");
      if (sensor.key === 'tv') recommendations.push("Turn off the TV console if the space is unoccupied, or lower the screen backlight setting.");
      if (sensor.key === 'lighting') recommendations.push("Deactivate overhead light switches in empty rooms or switch exclusively to localized desk lamps.");
      if (sensor.key === 'phantom') recommendations.push("Unplug sleeping chargers, media hubs, and microwave clocks directly at the wall outlet to kill vampire loads.");
    } else if (val >= sensor.normal) {
      elevatedItems.push(sensor.label);
    }
  });

  // 2. Early Warning System (Predictive Proactive Threshold Analysis)
  const hourlyCost = total * rate;
  if (total > powerLimit * 0.85 || hourlyCost > costLimit * 0.85) {
    const spaceLeftKw = powerLimit - total;
    if (total > powerLimit) {
      return `CRITICAL BREACH: Power consumption has passed your limit! Action Required: Instantly shut down the ${highItems.length > 0 ? highItems.join(' and ') : 'heaviest appliances'} to stop system overloading.`;
    }
    return `CRITICAL WARNING: You are operating at ${((total / powerLimit) * 100).toFixed(0)}% of your safety threshold with only ${spaceLeftKw.toFixed(2)} kW remaining. Action: Turn off non-essential loads immediately to avoid an automated threshold alert.`;
  }

  // 3. Compounded Multiple Appliance Alert
  if (highItems.length > 1) {
    return `COMPOUNDED OVERLOAD: Multiple high-drain appliances (${highItems.join(', ')}) are running simultaneously. Action Required: Stagger your appliance usage—run only one high-load device at a time to keep your baseline low.`;
  }

  // 4. Financial Context & Single Appliance Recommendations
  if (highItems.length === 1) {
    let message = `${highItems[0]} is drawing heavy load. `;
    if (tariff.label === 'Peak') {
      message += `You are in Peak hours. Defusing this spike right now could immediately shave RM ${highCost.toFixed(2)}/hr off your utility bill. Recommendation: ${recommendations.join(' ')}`;
    } else {
      message += `Pushing total draw to ${total.toFixed(2)} kW. Recommendation: ${recommendations.join(' ')}`;
    }
    return message;
  }

  // 5. Predictive Forecast Warnings
  if (predicted > total + 0.5) {
     return `Current power is stable, but the AI forecasts a spike to ${predicted.toFixed(2)} kW soon based on your historical patterns. Recommendation: Postpone running heavy manual chores or laundry cycles until this forecasted wave passes.`;
  }

  // 6. Mid-Level Baseline Warnings
  if (elevatedItems.length > 0) {
    return `${elevatedItems.join(', ')} running slightly above baseline. Total power is stable at ${total.toFixed(2)} kW. Check that these devices are not left running on standby.`;
  }

  return `All home appliances are operating efficiently within their normal ranges. Excellent! No corrective actions required.`;
}

function TypewriterText({ text, speed = 22, className }) {
  const [shown, setShown] = useState('');
  const indexRef = useRef(0);
  
  useEffect(() => {
    indexRef.current = 0;
    setShown('');
    const interval = setInterval(() => {
      indexRef.current += 1;
      setShown(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p className={className}>
      {shown}
      <span className={shown.length >= text.length ? 'typing-cursor-idle' : ''} style={{ display: 'inline-block', width: '2px', height: '1em', marginLeft: '2px', verticalAlign: '-2px', background: '#818cf8' }}/>
    </p>
  );
}

export default function Overview({ liveData, history, weather, tariff, total, predicted, powerLimit, costLimit }) {
  const reportSummary = buildEnergyReport(liveData, total, predicted, tariff, SENSOR_CONFIG, TNB_RATE);
  
  const hourlyCost = total * TNB_RATE;
  const powerPct = Math.min(100, (total / powerLimit) * 100);
  const costPct = Math.min(100, (hourlyCost / costLimit) * 100);
  
  const isPowerExceeded = total > powerLimit;
  const isCostExceeded = hourlyCost > costLimit;
  const isBreached = isPowerExceeded || isCostExceeded;

  const weatherIcon = (code) => {
    if (!code && code !== 0) return '🌡️';
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    return '⛈️';
  };

  return (
    <div className={`flex flex-col gap-5 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${isBreached ? 'danger-alert' : ''}`}>
      
      {/* ── LIMIT STATUS WIDGETS ── */}
      <div className="grid grid-cols-2 gap-5 shrink-0">
        <div className={`bg-slate-900 rounded-3xl border ${isPowerExceeded ? 'border-red-500/50' : 'border-slate-800'} p-6 flex flex-col gap-2 shadow-lg`}>
            <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <Zap size={14} className={isPowerExceeded ? "text-red-500" : "text-emerald-400"} /> Power Limit Status
                </span>
                <span className={`text-sm font-bold ${isPowerExceeded ? 'text-red-500' : 'text-slate-300'}`}>
                    {total.toFixed(2)} / {powerLimit} kW
                </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-in-out ${isPowerExceeded ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} 
                    style={{ width: `${powerPct}%` }} 
                />
            </div>
        </div>
        
        <div className={`bg-slate-900 rounded-3xl border ${isCostExceeded ? 'border-red-500/50' : 'border-slate-800'} p-6 flex flex-col gap-2 shadow-lg`}>
            <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <DollarSign size={14} className={isCostExceeded ? "text-red-500" : "text-amber-400"} /> Cost Limit Status (Hourly)
                </span>
                <span className={`text-sm font-bold ${isCostExceeded ? 'text-red-500' : 'text-slate-300'}`}>
                    RM {hourlyCost.toFixed(2)} / {costLimit}
                </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-in-out ${isCostExceeded ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} 
                    style={{ width: `${costPct}%` }} 
                />
            </div>
        </div>
      </div>

      {/* ── TOP ROW: Big Chart + Breakdown + Weather ── */}
      <div className="flex gap-5 flex-1 min-h-[340px]">
        <div className="flex-1 bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col relative overflow-hidden shadow-lg min-w-0">
          <div className="flex justify-between items-start mb-2 shrink-0 z-10 relative">
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold tracking-widest">Live Power Usage</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-5xl font-bold text-white tracking-tight">{total.toFixed(2)}</h2>
                <span className="text-xl text-slate-500 font-medium">kW</span>
              </div>
            </div>
            <Zap className="text-emerald-400 shrink-0" size={32} />
          </div>
          <div className="absolute inset-0 z-0 pt-24 px-4 pb-4">
            <PowerChart history={history} />
          </div>
        </div>

        <div className="w-[280px] shrink-0">
          <BreakdownPanel data={liveData} total={total} predicted={predicted} />
        </div>

        <div className="w-48 shrink-0 flex flex-col gap-5">
          <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col justify-center shadow-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Thermometer className="text-orange-400" size={16} />
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Outside</p>
            </div>
            {weather ? (
              <>
                <p className="text-3xl text-white">{weatherIcon(weather.code)} <span className="text-2xl font-bold">{weather.temp}°C</span></p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Wind size={12} className="text-slate-500" />
                  <p className="text-slate-500 text-xs font-medium">{weather.humidity}% humidity</p>
                </div>
                <p className="text-slate-600 text-[10px] mt-2 font-medium">{LOCATION_NAME}</p>
              </>
            ) : (<p className="text-slate-500 text-xs">Fetching…</p>)}
          </div>
          
          <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col justify-center shadow-lg relative">
            <div className="flex items-center gap-1.5 mb-3">
              <Clock size={15} className="text-slate-400" />
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Tariff</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: tariff.color, boxShadow: `0 0 8px ${tariff.color}` }} />
              <p className="text-base font-bold tracking-wide" style={{ color: tariff.color }}>{tariff.label}</p>
            </div>
            <p className="text-slate-400 text-xs mt-2 font-medium">RM {tariff.rate}/kWh</p>
            <p className="text-slate-600 text-[10px] mt-1">{tariff.label === 'Peak' ? '8am – 10pm' : '10pm – 8am'}</p>
            
            <div className="mt-auto pt-3 border-t border-slate-800/50">
              <p className="text-slate-500 text-[8px] uppercase tracking-wider font-semibold">
                Tenaga Nasional Berhad
              </p>
              <p className="text-slate-600 text-[8px]">
                Updated: June 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: AI Energy Insight (End-to-End) ── */}
      <div className="w-full bg-slate-900/80 rounded-3xl p-5 border border-slate-800 flex items-center gap-6 shadow-lg shrink-0">
        <div className="flex flex-col items-center justify-center shrink-0 border-r border-slate-800/60 pr-6 pl-2">
          <BotMessageSquare className="text-indigo-400 mb-1.5" size={28} />
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest text-center whitespace-nowrap">
            AI Insight
          </p>
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <TypewriterText 
            text={reportSummary} 
            speed={25} 
            className="font-code text-sm text-slate-400 leading-relaxed font-medium tracking-wide" 
          />
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div className="grid grid-cols-7 gap-5 h-[130px] shrink-0">
        {SENSOR_CONFIG.map(({ key, dataKey, label, color, max }) => (
          <SensorCard key={key} label={label} color={color} value={liveData[dataKey] || 0} max={max} />
        ))}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col gap-1.5 justify-between shadow-lg">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5"><DollarSign className="text-emerald-400" size={14}/>Cost Now</p>
          <p className="text-xl font-bold text-white tracking-tight">RM {(total * TNB_RATE).toFixed(2)}<span className="text-xs text-slate-500 font-medium">/hr</span></p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">RM {(total * TNB_RATE * 24).toFixed(2)}/day est.</p>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col gap-1.5 justify-between shadow-lg">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5"><TrendingUp className="text-purple-400" size={14}/>Predicted</p>
          <p className="text-xl font-bold text-white tracking-tight">RM {(predicted * TNB_RATE).toFixed(2)}<span className="text-xs text-slate-500 font-medium">/hr</span></p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">RM {(predicted * TNB_RATE * 24).toFixed(2)}/day est.</p>
        </div>
      </div>
    </div>
  );
}