import React from 'react';
import { ShieldAlert, Crosshair, Navigation, Map as MapIcon, Activity, AlertTriangle } from 'lucide-react';

export default function KPICards({ metrics, selectedDepartment }) {
  return (
    <div className="grid grid-cols-3 gap-4 shrink-0">
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><MapIcon className="w-16 h-16"/></div>
        <span className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider flex items-center gap-2 mb-1">
          <Crosshair className="w-3.5 h-3.5 text-indigo-400" /> Eventos Ingeridos ({selectedDepartment})
        </span>
        <span className="text-3xl font-light text-zinc-100">{metrics.totalEvents.toLocaleString()}</span>
      </div>
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-16 h-16"/></div>
        <span className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider flex items-center gap-2 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Infracciones Detectadas
        </span>
        <span className="text-3xl font-light text-rose-400">{metrics.activeInfractions.toLocaleString()}</span>
      </div>
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-16 h-16"/></div>
        <span className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider flex items-center gap-2 mb-1">
          <Navigation className="w-3.5 h-3.5 text-emerald-500" /> Vel. Promedio de Red
        </span>
        <span className="text-3xl font-light text-emerald-400">{metrics.currentAvg} <span className="text-lg text-emerald-600 font-normal">km/h</span></span>
      </div>
    </div>
  );
}