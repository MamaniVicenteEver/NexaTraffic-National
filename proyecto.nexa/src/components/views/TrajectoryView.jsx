import React, { useState } from 'react';
import { Activity, Search, Calendar, Download, FileText } from 'lucide-react';
import NodeMap from '../maps/NodeMap';
import mockData from '../../data/mockDatabase.json';

export default function TrajectoryView({ nodes, INITIAL_NODES, setSelectedNodeDetails }) {
  const [plateSearch, setPlateSearch] = useState('MFT-3650');
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchTrajectory = (e) => {
    e.preventDefault();
    if (!plateSearch) return;
    setIsSearching(true);
    
    setTimeout(() => {
      const searchPlate = plateSearch.toUpperCase();
      let historyNodes = [];

      // Simulación de Tiempos Realistas
      const generateMockTimes = (count) => {
        const times = [];
        let baseTime = new Date("2024-05-15T08:15:00");
        for(let i=0; i<count; i++) {
          const ampm = baseTime.getHours() >= 12 ? 'PM' : 'AM';
          const hr = baseTime.getHours() % 12 || 12;
          const min = baseTime.getMinutes().toString().padStart(2, '0');
          const sec = baseTime.getSeconds().toString().padStart(2, '0');
          times.push(`${hr}:${min}:${sec} ${ampm}`);
          baseTime = new Date(baseTime.getTime() + (Math.random() * 600000 + 300000));
        }
        return times;
      };

      if (mockData.vehicles[searchPlate]) {
        const ownerData = mockData.vehicles[searchPlate];
        const count = ownerData.baseRouteRegions.length;
        const timeList = generateMockTimes(count);
        
        for (let i=0; i<count; i++) {
          const reg = ownerData.baseRouteRegions[i];
          const regionNodes = INITIAL_NODES.filter(n => n.region === reg || n.baseRegion === reg);
          if (regionNodes.length > 0) {
            historyNodes.push({ 
              ...regionNodes[Math.floor(Math.random() * regionNodes.length)], 
              timestamp: timeList[i],
              speed: Math.floor(40 + Math.random() * 60)
            });
          }
        }
      } else {
        const timeList = generateMockTimes(5);
        for(let i=0; i<5; i++) {
          historyNodes.push({ 
            ...INITIAL_NODES[Math.floor(Math.random() * INITIAL_NODES.length)], 
            timestamp: timeList[i],
            speed: 60
          });
        }
      }

      setTrajectoryData({ plate: searchPlate, nodes: historyNodes, coords: historyNodes.map(n => [n.lat, n.lng]) });
      setIsSearching(false);
    }, 800); 
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-zinc-100 mb-4 tracking-tight">Trayectorias de Vehículos</h2>
      
      <div className="flex flex-1 gap-4 overflow-hidden">
        
        {/* Panel Izquierdo: Criterios */}
        <div className="w-[300px] bg-[#121215] border border-zinc-800 rounded-xl p-5 flex flex-col shrink-0 shadow-lg">
          <h3 className="text-lg font-semibold text-zinc-200 mb-6 border-b border-zinc-800 pb-2">Criterios de Consulta</h3>
          
          <form onSubmit={handleSearchTrajectory} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-400">Placa</label>
              <input type="text" placeholder="Ej: MFT-3650" value={plateSearch} onChange={(e) => setPlateSearch(e.target.value.toUpperCase())} className="bg-[#0a0a0b] border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 font-mono text-sm shadow-inner" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-400">Fecha/Hora Inicio</label>
              <div className="relative">
                <input type="text" defaultValue="15/05/2024 08:00:00" className="w-full bg-[#0a0a0b] border border-zinc-700 text-zinc-300 rounded-lg px-4 py-2.5 outline-none text-sm" />
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-400">Fecha/Hora Fin</label>
              <div className="relative">
                <input type="text" defaultValue="15/05/2024 10:00:00" className="w-full bg-[#0a0a0b] border border-zinc-700 text-zinc-300 rounded-lg px-4 py-2.5 outline-none text-sm" />
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            <button type="submit" disabled={isSearching} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              {isSearching ? <Activity className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>} 
              Consultar
            </button>
          </form>
        </div>

        {/* Panel Derecho: Mapa + Historial */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* Contenedor del Mapa y Botones Exportar */}
          <div className="flex-1 bg-[#121215] border border-zinc-800 rounded-xl relative overflow-hidden flex flex-col shadow-lg">
            {/* CORRECCIÓN DE Z-INDEX AQUÍ: Subido de z-[400] a z-[1000] */}
            <div className="absolute top-4 right-4 z-[1000] flex gap-2 pointer-events-auto">
              <button className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 backdrop-blur-sm transition-colors shadow-md hover:shadow-indigo-500/20">
                <Download className="w-3.5 h-3.5"/> Exportar JSON
              </button>
              <button className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 backdrop-blur-sm transition-colors shadow-md hover:shadow-indigo-500/20">
                <FileText className="w-3.5 h-3.5"/> CSV
              </button>
              <button className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 backdrop-blur-sm transition-colors shadow-md hover:shadow-indigo-500/20">
                <Download className="w-3.5 h-3.5"/> GPX
              </button>
            </div>
            
            <NodeMap nodes={nodes} trajectoryData={trajectoryData} viewMode="trajectory" selectedDepartment="ALL" onNodeClick={setSelectedNodeDetails} />
          </div>

          {/* Panel de Historial de Puntos (Abajo) */}
          <div className="h-[220px] bg-[#121215] border border-zinc-800 rounded-xl p-5 flex flex-col shrink-0 shadow-lg">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">Historial de Puntos</h3>
            
            {trajectoryData ? (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                  {trajectoryData.nodes.map((n, i) => {
                    const isSpeeding = n.speed > 80;
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm font-mono relative">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isSpeeding ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                        <div className={`${isSpeeding ? 'text-rose-400' : 'text-zinc-300'} truncate`}>
                          <span className="text-zinc-500">{n.timestamp.split(' ')[0]}</span> | {n.streetName} | {n.speed} km/h | 
                          <span className={isSpeeding ? 'font-bold ml-1' : 'ml-1'}>{isSpeeding ? 'Exceso de Velocidad' : 'Detectado'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                Realice una consulta para ver el historial de puntos.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}