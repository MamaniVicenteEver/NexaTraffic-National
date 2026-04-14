import React from 'react';
import { Hexagon, Activity, Route, Pause, Play, ListFilter } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, isRunning, setIsRunning, selectedDepartment, setSelectedDepartment, DEPARTMENT_CENTERS }) {
  return (
    <header className="h-[60px] shrink-0 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center px-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <Hexagon className="text-indigo-500 w-7 h-7 fill-indigo-500/20" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">NexaTraffic</h1>
        </div>
        <nav className="flex gap-2 ml-4 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
            <Activity className="w-4 h-4"/> Centro de Monitoreo
          </button>
          <button onClick={() => setActiveTab('trajectory')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'trajectory' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
            <Route className="w-4 h-4"/> Analítica de Rutas
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {activeTab === 'dashboard' && (
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-6">
            <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1"><ListFilter className="w-3 h-3"/> Filtro:</span>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer">
              <option value="ALL">Nacional (Todos)</option>
              {Object.keys(DEPARTMENT_CENTERS).map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
        )}
        <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all border ${isRunning ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800' : 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-indigo-500'}`}>
          {isRunning ? <><Pause className="w-4 h-4"/> Pausar Sistema</> : <><Play className="w-4 h-4"/> Reanudar Ingesta</>}
        </button>
      </div>
    </header>
  );
}