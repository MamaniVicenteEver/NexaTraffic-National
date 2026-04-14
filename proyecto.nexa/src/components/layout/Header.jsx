import React from 'react';
import { Pause, Play, ListFilter } from 'lucide-react';

export default function Header({ activeTab, isRunning, setIsRunning, selectedDepartment, setSelectedDepartment, DEPARTMENT_CENTERS }) {
  return (
    <header className="h-[60px] shrink-0 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center px-6 z-30">
      <div className="flex items-center gap-3">
        {/* Tu nuevo Logo Personalizado */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 141">
  <g fill="#605AC7" fill-rule="evenodd" shape-rendering="geometricPrecision">
    <path d="M 55 37 L 41 73 L 43 75 L 54 75 L 61 59 L 64 57 L 81 95 L 85 97 L 93 95 L 106 58 L 94 57 L 90 70 L 85 75 L 67 38 L 63 36 Z"/>
    <path d="M 103 36 L 100 39 L 99 47 L 109 47 L 111 38 Z"/>
    <path d="M 40 85 L 37 89 L 37 94 L 46 95 L 47 85 Z"/>
  </g>
</svg>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">NexaTraffic</h1>
        <span className="ml-2 text-xs font-mono text-zinc-500 uppercase tracking-widest border-l border-zinc-700 pl-3">
          Sistema Central
        </span>
      </div>

      <div className="flex items-center gap-6">
        {activeTab === 'dashboard' && (
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-6">
            <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1"><ListFilter className="w-3 h-3"/> Filtro Geográfico:</span>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer shadow-sm">
              <option value="ALL">Nacional (Todos)</option>
              {Object.keys(DEPARTMENT_CENTERS).map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
        )}
        <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all border ${isRunning ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800' : 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-indigo-500'}`}>
          {isRunning ? <><Pause className="w-4 h-4"/> Pausar Ingesta</> : <><Play className="w-4 h-4"/> Reanudar Ingesta</>}
        </button>
      </div>
    </header>
  );
}