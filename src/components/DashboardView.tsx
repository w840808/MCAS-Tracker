'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, MCASLog } from '@/lib/supabase';
import { Loader2, AlertTriangle, TrendingUp, Filter, Activity, Cloud, Search, Edit2, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type TimeWindow = '7' | '14' | '30' | 'all';

export function DashboardView({ onEditLog }: { onEditLog?: (log: MCASLog) => void }) {
  const [logs, setLogs] = useState<MCASLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('14');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('mcas_logs')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setLogs(data as MCASLog[]);
    }
    setIsLoading(false);
  };

  const filteredLogs = useMemo(() => {
    if (timeWindow === 'all') return logs;
    const days = parseInt(timeWindow);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return logs.filter(l => new Date(l.created_at) >= cutoff);
  }, [logs, timeWindow]);

  const deleteLog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    const { error } = await supabase.from('mcas_logs').delete().eq('id', id);
    if (!error) {
      setLogs(logs.filter(l => l.id !== id));
    } else {
      alert('Failed to delete: ' + error.message);
    }
  };

  const displayLogs = useMemo(() => {
    let result = filteredLogs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.symptoms?.some(s => s.toLowerCase().includes(q)) ||
        l.foods?.some(f => f.item.toLowerCase().includes(q)) ||
        l.meds_and_supps?.some(m => m.item.toLowerCase().includes(q)) ||
        l.time_block.toLowerCase().includes(q)
      );
    }
    // Reverse so newest is at top for the list view
    return [...result].reverse();
  }, [filteredLogs, searchQuery]);

  // Insight Engine Logic (Co-factor & Delayed Reaction)
  const insights = useMemo(() => {
    const cards: string[] = [];
    if (filteredLogs.length < 3) return ["Not enough data for insights yet. Keep logging!"];

    let highStressCount = 0;
    let totalFlares = 0;
    let rescueMedUsage = 0;

    filteredLogs.forEach(log => {
      if (log.is_flare_phase) totalFlares++;
      if (log.stress_level >= 7) highStressCount++;
      if (log.meds_and_supps.some(m => m.type === 'rescue_medication')) rescueMedUsage++;
    });

    // Time-Lag Logic: Find if allergy_index >= 7 was preceded by specific triggers in last 48h
    // (Simplified for MVP, would normally group by user/time precisely)
    const flareLogs = filteredLogs.filter(l => l.allergy_index >= 7);
    if (flareLogs.length > 0) {
      cards.push(`Recent Trend: Found ${flareLogs.length} high-severity events in the selected window.`);
    }

    if (rescueMedUsage > 0) {
      cards.push(`Rescue meds were needed ${rescueMedUsage} times recently. Watch out for overlapping triggers like High UV or Pressure Drops.`);
    }

    if (totalFlares > 0 && highStressCount > 0) {
      cards.push(`Co-factor detected: High stress coincides with your flare phases. Consider adding stress-reduction techniques to your daily routine.`);
    }

    if (cards.length === 0) {
      cards.push("Your histamine bucket looks relatively stable. Great job managing triggers!");
    }

    return cards;
  }, [filteredLogs]);

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div className="p-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-200">
      <header className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Analysis Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Shifting Triggers & Histamine Bucket</p>
        </div>
      </header>

      {/* Time Window Selector */}
      <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
        {[
          { id: '7', label: '7D' },
          { id: '14', label: '14D' },
          { id: '30', label: '1M' },
          { id: 'all', label: 'All' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTimeWindow(t.id as TimeWindow)}
            className={twMerge(
              "flex-1 text-xs font-semibold py-2 rounded-lg transition-all",
              timeWindow === t.id ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Histamine Bucket Chart (Simplified SVG visualization) */}
      <div className="glass-panel p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" /> Histamine Bucket Trend
        </h2>
        
        {filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-10 text-center">No data for this time window.</p>
        ) : (
          <div className="w-full flex flex-col mt-4">
            {/* Chart Area */}
            <div className="relative h-44 w-full flex items-end justify-between border-b border-slate-700/50 pt-8">
              {/* Threshold & Grid Lines */}
              <div className="absolute top-[30%] left-0 w-full border-t-2 border-rose-500/50 border-dashed z-0" />
              <span className="absolute top-[30%] -mt-4 left-0 text-[10px] text-rose-400 font-bold z-0">Threshold (7)</span>
              
              <div className="absolute top-[50%] left-0 w-full border-t border-slate-700/30 border-dashed z-0" />
              <span className="absolute top-[50%] -mt-4 left-0 text-[10px] text-slate-500 font-medium z-0">5</span>

              {/* Area Chart Background */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="line-gradient" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
                <polygon 
                  points={`0,100 ${filteredLogs.map((log, i) => `${(i / (filteredLogs.length - 1 || 1)) * 100},${100 - (log.allergy_index / 10) * 100}`).join(' ')} 100,100`} 
                  fill="url(#area-gradient)" 
                />
                <polyline 
                  points={filteredLogs.map((log, i) => `${(i / (filteredLogs.length - 1 || 1)) * 100},${100 - (log.allergy_index / 10) * 100}`).join(' ')} 
                  fill="none" 
                  stroke="url(#line-gradient)" 
                  strokeWidth="3" 
                  vectorEffect="non-scaling-stroke" 
                />
              </svg>
              
              {filteredLogs.map((log, i) => {
                const height = `${(log.allergy_index / 10) * 100}%`;
                const hasRescue = log.meds_and_supps.some(m => m.type === 'rescue_medication');
                const hasWeather = log.weather_temp !== null && log.weather_temp !== undefined;
                const isEdgeLeft = i <= 1;
                const isEdgeRight = i >= filteredLogs.length - 2;
                const tooltipAlignment = isEdgeLeft ? 'left-0' : isEdgeRight ? 'right-0' : 'left-1/2 -translate-x-1/2';

                return (
                  <div 
                    key={log.id} 
                    className="relative flex flex-col items-center justify-end w-full h-full group z-10"
                    onClick={() => setSelectedPointId(selectedPointId === log.id ? null : log.id)}
                  >
                    {/* Hover Tooltip with Weather Data */}
                    <div className={twMerge(
                      "absolute bottom-full mb-2 transition-opacity bg-slate-800 text-xs p-3 rounded-xl border border-slate-600 z-[100] w-max max-w-[220px] pointer-events-none shadow-2xl",
                      tooltipAlignment,
                      selectedPointId === log.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      <p className="font-bold mb-1.5 text-indigo-300 border-b border-slate-700 pb-1">
                        Score: {log.allergy_index} | {log.time_block}
                      </p>
                      {hasWeather ? (
                        <div className="text-slate-300 text-[11px] space-y-1 mt-1.5">
                          <div className="flex justify-between gap-4"><span className="text-slate-400">Temp:</span> <span>{log.weather_temp}°C</span></div>
                          <div className="flex justify-between gap-4"><span className="text-slate-400">Press:</span> <span>{log.weather_pressure} hPa</span></div>
                          {log.weather_aqi !== null && log.weather_aqi !== undefined && <div className="flex justify-between gap-4"><span className="text-slate-400">AQI:</span> <span>{log.weather_aqi}</span></div>}
                          {log.weather_pm?.pm10 !== undefined && <div className="flex justify-between gap-4"><span className="text-slate-400">PM10:</span> <span>{log.weather_pm.pm10}</span></div>}
                          {log.weather_pm?.pm2_5 !== undefined && <div className="flex justify-between gap-4"><span className="text-slate-400">PM2.5:</span> <span>{log.weather_pm.pm2_5}</span></div>}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-[10px] mt-1">No weather data</p>
                      )}
                    </div>

                    {/* Score Label right above bar */}
                    <div 
                      className="absolute text-[11px] font-bold mb-1 drop-shadow-md z-20 group-hover:opacity-0 transition-opacity"
                      style={{ 
                        bottom: height,
                        color: log.allergy_index >= 7 ? '#fb7185' : log.allergy_index >= 4 ? '#fbbf24' : '#34d399'
                      }}
                    >
                      {log.allergy_index}
                    </div>

                    {/* Rescue Marker */}
                    {hasRescue && (
                      <div 
                        className="absolute text-rose-500 z-20"
                        style={{ bottom: `calc(${height} + 18px)` }}
                      >
                        <AlertTriangle size={12} />
                      </div>
                    )}

                    {/* Area Chart Data Point Dot */}
                    <div 
                      className="absolute z-20 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-[#0f172a] group-hover:scale-[1.8] transition-transform cursor-pointer"
                      style={{ 
                        bottom: `calc(${height} - 6px)`,
                        backgroundColor: log.allergy_index >= 7 ? '#fb7185' : log.allergy_index >= 4 ? '#fbbf24' : '#34d399',
                        boxShadow: `0 0 10px ${log.allergy_index >= 7 ? 'rgba(251,113,133,0.8)' : log.allergy_index >= 4 ? 'rgba(251,191,36,0.8)' : 'rgba(52,211,153,0.8)'}`
                      }}
                    />
                    
                    {/* Invisible Hitbox for Hover */}
                    <div className="w-full h-full absolute inset-0 z-10 cursor-pointer" />
                  </div>
                );
              })}
            </div>
            
            {/* X-Axis Dates Area */}
            <div className="w-full flex items-start justify-between pt-2 h-16">
              {filteredLogs.map((log, i) => {
                const hasWeather = log.weather_temp !== null && log.weather_temp !== undefined;
                const timeIcon = log.time_block === 'Morning' ? '🌅' : log.time_block === 'Afternoon' ? '☀️' : log.time_block === 'Evening' ? '🌇' : '🌙';
                return (
                  <div key={`date-${log.id}`} className="w-full flex flex-col items-center relative">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap transform -rotate-45 absolute top-1">
                      {new Date(log.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                    </span>
                    <span className="absolute top-6 text-[10px] drop-shadow-sm">{timeIcon}</span>
                    {/* Small Weather Icon indicator */}
                    {hasWeather && (
                      <Cloud size={10} className="text-sky-400/50 absolute top-10" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Insight Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-400" /> Dynamic Insights
        </h2>
        {insights.map((insight, i) => (
          <div key={i} className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 p-4 rounded-xl">
            <p className="text-sm text-indigo-100 leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>

      {/* History & Database */}
      <div className="space-y-4 pt-8 border-t border-slate-800 mt-8">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          History & Database
        </h2>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text"
            placeholder="Search symptoms, foods, meds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 placeholder:text-slate-500 transition-all"
          />
        </div>

        {/* Log Cards */}
        <div className="space-y-3">
          {displayLogs.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">No matching records found.</p>
          ) : (
            displayLogs.map(log => (
              <div key={log.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3 relative group transition-colors hover:bg-slate-800/60">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      {new Date(log.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Score: {log.allergy_index} | {log.time_block} {log.is_flare_phase && '🔥 Flare'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {onEditLog && (
                      <button onClick={() => onEditLog(log)} className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-md bg-slate-800 hover:bg-indigo-500/20 transition-colors">
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button onClick={() => deleteLog(log.id)} className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md bg-slate-800 hover:bg-rose-500/20 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] capitalize">
                  {log.menstrual_phase && log.menstrual_phase !== 'None' && (
                    <span className="bg-fuchsia-500/10 text-fuchsia-300 px-2 py-0.5 rounded border border-fuchsia-500/20">
                      ♀ {log.menstrual_phase}
                    </span>
                  )}
                  {log.symptoms?.map((s, idx) => (
                    <span key={`sym-${idx}`} className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded border border-rose-500/20">{s}</span>
                  ))}
                  {log.foods?.map((f, idx) => (
                    <span key={`food-${idx}`} className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">{f.item} {f.qty ? `(${f.qty}g)` : ''}</span>
                  ))}
                  {log.meds_and_supps?.map((m, idx) => (
                    <span key={`med-${idx}`} className="bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">{m.item} {m.dose ? `(${m.dose}mg)` : ''}</span>
                  ))}
                </div>

                {/* Food Image Thumbnail */}
                {log.food_image_url && (
                  <div 
                    className="mt-3 relative w-full max-w-[120px] h-24 rounded-lg overflow-hidden border border-slate-700/50 cursor-pointer group shrink-0"
                    onClick={() => setExpandedImage(log.food_image_url!)}
                  >
                    <img src={log.food_image_url} alt="Food" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                       <span className="text-white text-[10px] font-bold bg-black/60 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setExpandedImage(null)}
        >
          <button className="absolute top-6 right-6 p-2 bg-slate-800/80 hover:bg-rose-500 rounded-full text-white transition-colors">
            <X size={24} />
          </button>
          <img 
            src={expandedImage} 
            alt="Expanded food" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
