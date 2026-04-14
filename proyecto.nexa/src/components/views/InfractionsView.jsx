import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Search, Calendar, ChevronDown, Camera, CheckCircle2, User, Car } from 'lucide-react';
import mockData from '../../data/mockDatabase.json';

const COLORS = {
  Pendiente: '#ef4444', 
  Notificado: '#eab308', 
  Pagado: '#22c55e'     
};

const BOLIVIA_DEPARTMENTS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosí", "Tarija", "Sucre", "Trinidad", "Cobija", "El Alto"
];

export default function InfractionsView({ infractionsData, liveAlerts = [] }) {
  const [searchInput, setSearchInput] = useState('');
  const [activePlateFilter, setActivePlateFilter] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const handleSearch = () => {
    setActivePlateFilter(searchInput.toUpperCase());
  };

  // LA MAGIA DE LA ARQUITECTURA HÍBRIDA: Fusionamos Stream (liveAlerts) con Batch (infractionsData)
  const combinedData = useMemo(() => {
    return [...liveAlerts, ...infractionsData];
  }, [liveAlerts, infractionsData]);

  // Filtrado reactivo de datos combinados
  const filteredInfractions = useMemo(() => {
    return combinedData.filter(inf => {
      const matchPlate = activePlateFilter ? inf.plate.includes(activePlateFilter) : true;
      const matchLocation = selectedLocation !== 'Todos' ? inf.location === selectedLocation : true;
      const matchStatus = selectedStatus !== 'Todos' ? inf.status === selectedStatus : true;
      return matchPlate && matchLocation && matchStatus;
    });
  }, [combinedData, activePlateFilter, selectedLocation, selectedStatus]);

  const pieData = useMemo(() => {
    const counts = { Pendiente: 0, Notificado: 0, Pagado: 0 };
    filteredInfractions.forEach(inf => {
      if (counts[inf.status] !== undefined) counts[inf.status]++;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).filter(data => data.value > 0);
  }, [filteredInfractions]);

  const rankingData = useMemo(() => {
    const counts = {};
    filteredInfractions.forEach(inf => { counts[inf.location] = (counts[inf.location] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map((item, index) => ({ name: item[0], count: item[1], rank: index + 1 }));
  }, [filteredInfractions]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
          Monitoreo de Infracciones
          {liveAlerts.length > 0 && (
            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full border border-rose-500/30 uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Lambda Stream Activo
            </span>
          )}
        </h2>
        <button className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          Exportar Reporte Completo
        </button>
      </div>

      {/* --- PANEL DE FILTROS SUPERIOR --- */}
      <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 mb-4 shadow-lg shrink-0">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Placa:</label>
            <input type="text" placeholder="Ej: MFT-3650" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-[#0a0a0b] border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 outline-none focus:border-indigo-500 font-mono text-sm" />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Ubicación:</label>
            <div className="relative">
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full bg-[#0a0a0b] border border-zinc-700 text-zinc-300 rounded-md px-3 py-2 outline-none appearance-none text-sm cursor-pointer focus:border-indigo-500">
                <option value="Todos">Nacional (Todos)</option>
                {BOLIVIA_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
          <div className="col-span-3 flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Rango de Fecha:</label>
            <div className="relative flex items-center">
              <input type="text" defaultValue="15/05/2026 - Hoy (Live)" className="w-full bg-[#0a0a0b] border border-zinc-700 text-zinc-300 rounded-md px-3 py-2 outline-none text-sm cursor-not-allowed opacity-70" disabled />
              <Calendar className="absolute right-3 w-4 h-4 text-zinc-500" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Estado:</label>
            <div className="relative">
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full bg-[#0a0a0b] border border-zinc-700 text-zinc-300 rounded-md px-3 py-2 outline-none appearance-none text-sm cursor-pointer focus:border-indigo-500">
                <option value="Todos">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Notificado">Notificado</option>
                <option value="Pagado">Pagado</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400 flex justify-between">Velocidad: <span>Todas</span></label>
            <div className="h-9 flex items-center px-1"><input type="range" min="60" max="160" defaultValue="60" className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer" /></div>
          </div>
          <div className="col-span-1 flex flex-col justify-end">
            <button onClick={handleSearch} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-md h-[38px] flex items-center justify-center shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-colors"><Search className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* --- CONTENEDOR PRINCIPAL: TABLA + STATS --- */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        
        {/* PANEL IZQUIERDO: Tabla de Infracciones */}
        <div className="flex-1 bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-900 z-10 shadow-md">
                <tr className="text-zinc-400 text-[11px] uppercase tracking-wider border-b border-zinc-800">
                  <th className="px-5 py-4 font-semibold">Fecha y Hora</th>
                  <th className="px-5 py-4 font-semibold">Ubicación / Nodo</th>
                  <th className="px-5 py-4 font-semibold">Vehículo / Placa</th>
                  <th className="px-5 py-4 font-semibold">Registro de Vel.</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold text-center">Evidencia</th>
                  <th className="px-5 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-zinc-800/50">
                {filteredInfractions.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-zinc-500">No se encontraron infracciones con los filtros aplicados.</td></tr>
                ) : (
                  filteredInfractions.map((inf) => {
                    const vehicleData = mockData.vehicles[inf.plate] || { owner: "Desconocido (Búsqueda API requerida)", model: "N/A" };
                    return (
                      <tr key={inf.id} className={`hover:bg-zinc-800/30 transition-colors group ${inf.isLive ? 'bg-indigo-900/10' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="text-zinc-300 flex items-center gap-2">
                            {inf.date}
                            {inf.isLive && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[9px] font-bold uppercase rounded border border-rose-500/30 animate-pulse">Live</span>}
                          </div>
                          <div className="text-zinc-500 font-mono text-[11px]">{inf.time}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-zinc-300 font-semibold">{inf.location}</div>
                          <div className="text-zinc-500 font-mono text-[10px]">ID: {inf.nodeId}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-mono font-bold text-indigo-400 text-base">{inf.plate}</div>
                          <div className="text-[10px] text-zinc-400 flex flex-col gap-0.5 mt-0.5">
                            <span className="flex items-center gap-1 truncate max-w-[150px]"><User className="w-3 h-3 shrink-0"/> {vehicleData.owner}</span>
                            <span className="flex items-center gap-1 truncate max-w-[150px]"><Car className="w-3 h-3 shrink-0"/> {vehicleData.model}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-rose-400 font-bold">{inf.speed} km/h</div> 
                          <div className="text-zinc-500 text-[11px]">Límite: {inf.limit} km/h</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider border flex w-max items-center gap-1.5 ${
                            inf.status === 'Pendiente' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            inf.status === 'Notificado' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-green-500/10 text-green-400 border-green-500/20'
                          }`}>
                            {inf.status === 'Pagado' && <CheckCircle2 className="w-3 h-3"/>}
                            {inf.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {inf.hasEvidence ? <button className="p-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-indigo-400 rounded text-zinc-400 transition-all mx-auto block" title="Ver foto"><Camera className="w-4 h-4" /></button> : <span className="text-zinc-600 text-xs">-</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity items-end">
                            <button className="text-[10px] uppercase font-bold tracking-wider bg-zinc-900 border border-zinc-700 hover:border-indigo-500 hover:text-indigo-400 text-zinc-400 px-2 py-1 rounded w-32 text-center transition-colors">Notificar</button>
                            <button className="text-[10px] uppercase font-bold tracking-wider bg-zinc-900 border border-zinc-700 hover:border-indigo-500 hover:text-indigo-400 text-zinc-400 px-2 py-1 rounded w-32 text-center transition-colors">Evidencia</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO: Resumen Estadístico */}
        <div className="w-[300px] flex flex-col gap-4 shrink-0">
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col max-h-[300px]">
            <h3 className="text-sm font-bold text-zinc-200 mb-4 pb-2 border-b border-zinc-800">Ranking de Ubicaciones</h3>
            <div className="flex flex-col gap-3 text-sm text-zinc-400 overflow-y-auto custom-scrollbar pr-2">
              {rankingData.length === 0 ? (
                <div className="text-xs text-zinc-600 italic">No hay datos para rankear.</div>
              ) : (
                rankingData.map(item => (
                  <div key={item.name} className="flex justify-between items-center bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
                    <span className="truncate flex items-center gap-2"><span className="text-indigo-500 font-bold text-[10px]">{item.rank}.</span> {item.name}</span> 
                    <span className="text-zinc-200 font-bold bg-zinc-800 px-2 py-0.5 rounded text-xs">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 flex-1 flex flex-col shadow-lg">
            <h3 className="text-sm font-bold text-zinc-200 mb-2">Distribución de Estados</h3>
            {pieData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs italic">Gráfico vacío</div>
            ) : (
              <div className="flex-1 w-full relative min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 w-full flex justify-center gap-4 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Pend.</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Notif.</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Pagado</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}