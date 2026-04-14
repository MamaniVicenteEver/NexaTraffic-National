import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ListFilter } from 'lucide-react';

export default function SidebarLogs({ alerts, logs }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (autoScroll) logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  return (
    <div className="w-1/5 shrink-0 border-l border-zinc-800 bg-[#0a0a0b] flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
      <div className="flex flex-col h-[40%] border-b border-zinc-800">
        <div className="p-3 bg-zinc-900/40 flex justify-between items-center shrink-0">
          <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Alertas Críticas
          </h2>
        </div>
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
          {alerts.length === 0 ? <div className="text-center text-zinc-600 text-xs mt-4">Sin alertas pendientes.</div> : 
            alerts.map(a => (
              <div key={a.id} className="bg-zinc-900 border border-rose-900/30 border-l-2 border-l-rose-500 p-2.5 rounded shadow-sm animate-in slide-in-from-right-2 duration-300">
                <div className="flex justify-between text-zinc-500 mb-1.5 items-center">
                  <span className="text-[10px] bg-zinc-950 px-1.5 rounded text-zinc-400">{a.time}</span>
                  <span className="text-[10px] font-mono text-rose-400/80">{a.location}</span>
                </div>
                <div className="text-xs text-zinc-200">
                  Exceso Vel. <span className="text-rose-400 font-bold ml-1">{a.speed} km/h</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Placa: <span className="text-white font-mono bg-zinc-800 px-1 rounded">{a.plate}</span></div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 bg-[#09090b]">
        <div className="p-3 bg-zinc-900/40 flex justify-between items-center shrink-0 border-b border-zinc-800">
          <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <ListFilter className="w-3.5 h-3.5 text-indigo-400" /> Kafka Live Feed
          </h2>
          <label className="text-[10px] flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="accent-indigo-500 w-3 h-3" /> Auto-scroll
          </label>
        </div>
        <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed">
          {logs.length === 0 ? <div className="text-zinc-600 text-center mt-4">Esperando stream...</div> : null}
          {logs.map((log, i) => {
            let col = 'text-zinc-500';
            if (log.includes('ALERTA')) col = 'text-rose-400 font-semibold';
            if (log.includes('EVT_LOG')) col = 'text-indigo-300';
            if (log.includes('AUDIT')) col = 'text-amber-400/90';
            return <div key={i} className={`mb-1.5 break-words pb-1 border-b border-zinc-900/50 ${col}`}>{log}</div>
          })}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}