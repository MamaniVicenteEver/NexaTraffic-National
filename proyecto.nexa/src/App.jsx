import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import SidebarLogs from './components/layout/SidebarLogs';
import KPICards from './components/analytics/KPICards';
import SpeedChart from './components/analytics/SpeedChart';
import NodeMap from './components/maps/NodeMap';
import { generatePoisson } from './utils/poissonEngine';
import mockData from './data/mockDatabase.json';
import { Activity, Search, User, Car, Clock, CheckCircle2, Info, X, Cpu, Network, Wifi, Map as MapIcon, Route } from 'lucide-react';

const DEPARTMENT_CENTERS = {
  'La Paz': { lat: -16.5, lng: -68.15, zoom: 8, baseEvents: 4802500 },
  'Santa Cruz': { lat: -17.78, lng: -63.18, zoom: 8, baseEvents: 5104200 },
  'Cochabamba': { lat: -17.38, lng: -66.15, zoom: 9, baseEvents: 3105300 },
  'Oruro': { lat: -17.96, lng: -67.11, zoom: 9, baseEvents: 450100 },
  'Potosí': { lat: -19.58, lng: -65.75, zoom: 8, baseEvents: 320000 },
  'Tarija': { lat: -21.53, lng: -64.73, zoom: 9, baseEvents: 280000 },
  'Sucre': { lat: -19.03, lng: -65.26, zoom: 9, baseEvents: 188000 },
};

const BOLIVIA_REGIONS = [
  { name: 'La Paz', lat: -16.4897, lng: -68.1193, count: 45, spread: 0.15 },
  { name: 'El Alto', lat: -16.5000, lng: -68.1500, count: 20, spread: 0.08 },
  { name: 'Santa Cruz', lat: -17.7833, lng: -63.1833, count: 55, spread: 0.2 },
  { name: 'Cochabamba', lat: -17.3833, lng: -66.1500, count: 35, spread: 0.1 },
  { name: 'Oruro', lat: -17.9667, lng: -67.1167, count: 12, spread: 0.05 },
  { name: 'Potosí', lat: -19.5833, lng: -65.7500, count: 10, spread: 0.05 },
  { name: 'Tarija', lat: -21.5333, lng: -64.7333, count: 10, spread: 0.05 },
  { name: 'Sucre', lat: -19.0333, lng: -65.2627, count: 8, spread: 0.05 },
  { name: 'Trinidad', lat: -14.8333, lng: -64.9000, count: 3, spread: 0.02 },
  { name: 'Cobija', lat: -11.0333, lng: -68.7333, count: 2, spread: 0.01 },
];

const INITIAL_NODES = (() => {
  const nodes = [];
  let id = 1;
  BOLIVIA_REGIONS.forEach(region => {
    for (let i = 0; i < region.count; i++) {
      nodes.push({
        id: `NXT-${region.name.substring(0,3).toUpperCase()}-${id.toString().padStart(3, '0')}`,
        lat: region.lat + (Math.random() * region.spread * 2 - region.spread),
        lng: region.lng + (Math.random() * region.spread * 2 - region.spread),
        region: region.name,
        baseRegion: region.name === 'El Alto' ? 'La Paz' : region.name,
        active: false,
        type: Math.random() > 0.85 ? 'Clima / Ambiental' : 'Cámara ANPR',
        ip: `10.45.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        status: 'ONLINE',
        lastMaintenance: `12/03/2026`
      });
      id++;
    }
  });
  return nodes;
})();

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRunning, setIsRunning] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [speedData, setSpeedData] = useState(Array(20).fill({ time: '', avg: 60, max: 90 }));
  const [metrics, setMetrics] = useState({ totalEvents: 14250100, activeInfractions: 1842, currentAvg: 62 });
  const [nodes, setNodes] = useState(INITIAL_NODES);
  
  const [plateSearch, setPlateSearch] = useState('');
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [timeFilter, setTimeFilter] = useState('HOY');
  
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [serverTime, setServerTime] = useState('');

  useEffect(() => {
    const baseVal = selectedDepartment === 'ALL' ? 14250100 : DEPARTMENT_CENTERS[selectedDepartment]?.baseEvents || 500000;
    setMetrics(m => ({ ...m, totalEvents: baseVal }));
  }, [selectedDepartment]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      setServerTime(timeStr);
      
      const vehiclesNow = generatePoisson(55);
      const newLogs = [];
      const activeIds = new Set();
      let sumSpeeds = 0, localMaxSpeed = 0, validSpeedCount = 0, regionalEventCount = 0;
      
      const logsToGenerate = Math.min(vehiclesNow, 6); 
      for(let i=0; i<logsToGenerate; i++) {
        const availableNodes = selectedDepartment === 'ALL' ? INITIAL_NODES : INITIAL_NODES.filter(n => n.baseRegion === selectedDepartment);
        if (availableNodes.length === 0) continue;

        const node = availableNodes[Math.floor(Math.random() * availableNodes.length)];
        activeIds.add(node.id);
        regionalEventCount++;
        
        if (node.type === 'Cámara ANPR') {
          const plate = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`;
          const speed = Math.floor(30 + Math.random() * 85);
          sumSpeeds += speed; validSpeedCount++;
          if(speed > localMaxSpeed) localMaxSpeed = speed;
          
          newLogs.push(`[${timeStr}] EVT_LOG | ${node.id} | Detección | Placa: ${plate} | Vel: ${speed}km/h`);

          if (speed > 95) {
            newLogs.push(`[${timeStr}] ALERTA  | MOTOR_INFRACCIONES | Exceso Límite | Placa: ${plate}`);
            setAlerts(prev => [{ id: Date.now() + i, time: timeStr, plate, location: `${node.region} (${node.id})`, speed }, ...prev].slice(0, 10));
            setMetrics(m => ({ ...m, activeInfractions: m.activeInfractions + 1 }));
          }
        }
      }

      const currentAvg = validSpeedCount > 0 ? Math.floor(sumSpeeds / validSpeedCount) : Math.floor(55 + Math.random()*15);
      const currentMax = localMaxSpeed > 0 ? localMaxSpeed : Math.floor(currentAvg + Math.random()*30);
      
      setSpeedData(prev => [...prev.slice(1), { time: timeStr, avg: currentAvg, max: currentMax }]);
      setLogs(prev => [...prev, ...newLogs].slice(-150));
      setNodes(prev => prev.map(n => ({ ...n, active: activeIds.has(n.id) })));
      setMetrics(m => ({ ...m, totalEvents: m.totalEvents + (selectedDepartment === 'ALL' ? vehiclesNow : regionalEventCount), currentAvg }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, selectedDepartment]);

  const handleSearchTrajectory = (e) => {
    e.preventDefault();
    if (!plateSearch) return;
    setIsSearching(true);
    
    setTimeout(() => {
      const searchPlate = plateSearch.toUpperCase();
      let historyNodes = [];
      let ownerData = null;
      let totalNodesToPick = 0;

      const generateMockTimes = (count) => {
        const times = [];
        let curTime = new Date();
        for(let i=0; i<count; i++) {
          times.push(curTime.toLocaleTimeString('en-US', { hour12: false }) + ' ' + curTime.toLocaleDateString());
          curTime = new Date(curTime.getTime() - (Math.random() * 3600000 + 1800000));
        }
        return times;
      };

      if (mockData.vehicles[searchPlate]) {
        ownerData = mockData.vehicles[searchPlate];
        if (timeFilter === 'HOY') totalNodesToPick = Math.min(4, ownerData.baseRouteRegions.length);
        else if (timeFilter === '2_DIAS') totalNodesToPick = Math.min(8, ownerData.baseRouteRegions.length);
        else totalNodesToPick = ownerData.baseRouteRegions.length;

        const timeList = generateMockTimes(totalNodesToPick);
        for (let i=0; i<totalNodesToPick; i++) {
          const reg = ownerData.baseRouteRegions[i];
          const regionNodes = INITIAL_NODES.filter(n => n.region === reg || n.baseRegion === reg);
          if (regionNodes.length > 0) historyNodes.push({ ...regionNodes[Math.floor(Math.random() * regionNodes.length)], timestamp: timeList[i] });
        }
      } else {
        totalNodesToPick = timeFilter === 'HOY' ? 3 : (timeFilter === '2_DIAS' ? 6 : 10);
        const timeList = generateMockTimes(totalNodesToPick);
        for(let i=0; i<totalNodesToPick; i++) historyNodes.push({ ...INITIAL_NODES[Math.floor(Math.random() * INITIAL_NODES.length)], timestamp: timeList[i] });
        historyNodes.sort((a,b) => a.lng - b.lng); 
        ownerData = { owner: "No Registrado en Sistema", ci: "N/A", model: "Desconocido", status: "Activo", fines: 0 };
      }

      setTrajectoryData({ plate: searchPlate, ownerData, nodes: historyNodes, coords: historyNodes.map(n => [n.lat, n.lng]) });
      setIsSearching(false);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] AUDIT | PATH-ENGINE | Búsqueda placa ${searchPlate}.`]);
    }, 800); 
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
      
      {/* MODAL DETALLE DE NODO */}
      {selectedNodeDetails && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-700 w-[450px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-indigo-900/20 border-b border-zinc-800 p-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded border border-indigo-500/30">
                  <Cpu className="text-indigo-400 w-5 h-5"/>
                </div>
                <div><h3 className="text-zinc-100 font-bold uppercase text-sm">Hardware IoT</h3><p className="text-xs text-indigo-400 font-mono">{selectedNodeDetails.id}</p></div>
              </div>
              <button onClick={() => setSelectedNodeDetails(null)} className="text-zinc-500 hover:text-white bg-zinc-900 rounded p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded"><div className="text-zinc-500 mb-1 uppercase font-semibold text-[10px]">Ubicación</div><div className="text-zinc-200 font-medium">{selectedNodeDetails.region}</div></div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded"><div className="text-zinc-500 mb-1 uppercase font-semibold text-[10px]">Sensor</div><div className="text-zinc-200 font-medium">{selectedNodeDetails.type}</div></div>
              </div>
              <div className="border border-zinc-800 rounded bg-zinc-900/50 p-4 text-xs font-mono flex flex-col gap-2">
                <div className="flex justify-between"><span className="text-zinc-500">IP:</span><span className="text-zinc-300">{selectedNodeDetails.ip}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Estado:</span><span className="text-emerald-400">{selectedNodeDetails.status}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Latencia:</span><span className="text-zinc-300">~24 ms</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header activeTab={activeTab} setActiveTab={setActiveTab} isRunning={isRunning} setIsRunning={setIsRunning} selectedDepartment={selectedDepartment} setSelectedDepartment={setSelectedDepartment} DEPARTMENT_CENTERS={DEPARTMENT_CENTERS} />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-4/5 flex flex-col p-4 gap-4 overflow-y-auto bg-zinc-950/50">
          
          {activeTab === 'dashboard' && (
            <>
              <KPICards metrics={metrics} selectedDepartment={selectedDepartment} />
              <div className="flex gap-4 flex-1 min-h-[400px]">
                <div className="w-2/3 bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden relative flex flex-col">
                   <div className="absolute top-4 left-4 z-[400] bg-zinc-950/80 border border-zinc-800 px-3 py-2 rounded-lg text-xs shadow-xl"><MapIcon className="inline w-3.5 h-3.5 text-indigo-400 mr-1"/> Cobertura IoT Nacional</div>
                  <NodeMap nodes={nodes} viewMode="dashboard" selectedDepartment={selectedDepartment} onNodeClick={setSelectedNodeDetails} />
                </div>
                <SpeedChart speedData={speedData} />
              </div>
            </>
          )}

          {activeTab === 'trajectory' && (
            <div className="flex flex-1 gap-4">
              <div className="w-1/3 bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col">
                <h2 className="text-lg font-bold text-zinc-100 mb-4">Registro de Entidades</h2>
                <form onSubmit={handleSearchTrajectory} className="flex flex-col gap-3 mb-4">
                  <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-2">
                    <option value="HOY">Últimas 24 Horas</option>
                    <option value="2_DIAS">Últimos 2 Días</option>
                    <option value="30_DIAS">Últimos 30 Días</option>
                  </select>
                  <input type="text" placeholder="Ej: SCZ-123" value={plateSearch} onChange={(e) => setPlateSearch(e.target.value.toUpperCase())} className="bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-3 font-mono text-sm" />
                  <button type="submit" disabled={!plateSearch || isSearching} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                    {isSearching ? <Activity className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>} Rastrear
                  </button>
                </form>

                {trajectoryData && !isSearching && (
                  <div className="flex-1 overflow-y-auto bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                    <div className="border-b border-zinc-800 pb-3 mb-3">
                      <span className="text-lg font-mono text-indigo-400 font-bold">{trajectoryData.plate}</span>
                      <div className="text-xs text-zinc-400 mt-2"><User className="inline w-3 h-3 mr-1"/>{trajectoryData.ownerData.owner}</div>
                      <div className="text-xs text-zinc-400 mt-1"><Car className="inline w-3 h-3 mr-1"/>{trajectoryData.ownerData.model}</div>
                    </div>
                    <div className="pl-2 border-l-2 border-indigo-900 ml-2">
                      {trajectoryData.nodes.map((n, i) => (
                        <div key={i} className="mb-3 relative"><div className="absolute w-2 h-2 rounded-full bg-indigo-500 -left-[13px] top-1"></div><div className="text-xs text-zinc-200">{n.region}</div><div className="text-[10px] text-zinc-500"><Clock className="inline w-3 h-3 mr-1"/>{n.timestamp}</div></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-2/3 bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden relative">
                <NodeMap nodes={nodes} trajectoryData={trajectoryData} viewMode="trajectory" selectedDepartment="ALL" onNodeClick={setSelectedNodeDetails} />
              </div>
            </div>
          )}
        </div>

        <SidebarLogs alerts={alerts} logs={logs} />
      </div>
    </div>
  );
}