import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import SidebarNav from './components/layout/SidebarNav';
import SidebarLogs from './components/layout/SidebarLogs';
import KPICards from './components/analytics/KPICards';
import SpeedChart from './components/analytics/SpeedChart';
import NodeMap from './components/maps/NodeMap';
import TrajectoryView from './components/views/TrajectoryView';
import InfractionsView from './components/views/InfractionsView';
import WeatherAlertsView from './components/views/WeatherAlertsView';
import { generatePoisson } from './utils/poissonEngine';
import mockData from './data/mockDatabase.json';
import { Activity, Cpu, X, Wifi, Network, MapPin } from 'lucide-react';

// DICCIONARIO DE CALLES EXPANDIDO (120+ Ubicaciones Reales)
const STREET_NAMES = {
  'Santa Cruz': [
    'Av. Banzer', 'Av. Cristo Redentor', '4to Anillo', 'Doble Vía La Guardia', 'Av. San Martín', 
    'Av. Irala', 'Av. Cañoto', 'Av. Argomosa', 'Av. Viedma', 'Av. Melchor Pinto', 
    'Av. Virgen de Cotoca', 'Av. Cumavi', 'Av. Tres Pasos al Frente', 'Av. Santos Dumont', 
    'Av. Roca y Coronado', 'Av. Piraí', 'Av. Radial 26', 'Av. Radial 27', 'Av. Mutualista', 
    'Av. Alemania', 'Av. Busch', 'Av. Equipetrol', 'Av. La Salle', 'Av. Roque Aguilera'
  ],
  'Cochabamba': [
    'Av. Blanco Galindo', 'Av. América', 'Av. Villazón', 'Circunvalación', 'Av. Heroínas', 
    'Av. Ayacucho', 'Av. Aroma', 'Av. San Martín', 'Av. Oquendo', 'Av. Papa Paulo', 
    'Av. Rubén Darío', 'Av. Simón López', 'Av. Víctor Ustáriz', 'Av. Petrolera', 
    'Av. 6 de Agosto', 'Av. Siles', 'Paseo El Prado', 'Av. Capitán Ustáriz', 'Av. D\'Orbigny'
  ],
  'La Paz': [
    'Av. 16 de Julio (Prado)', 'Av. Arce', 'Av. Costanera', 'Autopista La Paz-El Alto', 
    'Av. 6 de Agosto', 'Av. Busch', 'Av. Saavedra', 'Av. Buenos Aires', 'Av. Kantutani', 
    'Av. del Libertador', 'Calle 21 de Calacoto', 'Av. Ballivián', 'Av. Hernando Siles', 
    'Av. Roma', 'Av. Montenegro', 'Av. Illimani', 'Av. Camacho', 'Av. Mariscal Santa Cruz'
  ],
  'El Alto': [
    'Av. 6 de Marzo', 'Av. Juan Pablo II', 'Cruce Villa Adela', 'Av. Bolivia', 
    'Av. Litoral', 'Av. Julio César Valdez', 'Av. Cívica', 'Av. Satélite', 'Av. Panamericana'
  ],
  'Oruro': [
    'Av. 6 de Agosto', 'Av. del Ejército', 'Av. Sargento Flores', 'Av. Tomás Barrón', 
    'Av. Villarroel', 'Av. España', 'Av. La Paz', 'Calle Bolívar', 'Av. Tacna'
  ],
  'Potosí': [
    'Av. Murillo', 'Av. Tinkuy', 'Av. Pedro Domingo Murillo', 'Av. Villazón', 
    'Av. El Maestro', 'Av. Universitaria', 'Av. Litoral', 'Calle Hoyos', 'Av. Las Banderas'
  ],
  'Tarija': [
    'Av. Las Américas', 'Av. Panamericana', 'Av. Víctor Paz Estenssoro', 'Av. Jaime Paz Zamora', 
    'Av. Domingo Paz', 'Av. Belgrano', 'Av. Froilán Tejerina', 'Calle Sucre', 'Av. Integración'
  ],
  'Sucre': [
    'Av. Hernando Siles', 'Av. de las Américas', 'Av. del Maestro', 'Av. Germán Mendoza', 
    'Av. Jaime Mendoza', 'Calle Calvo', 'Calle San Alberto', 'Av. Venezuela'
  ],
  'Trinidad': [
    'Av. Cipriano Barace', 'Av. 6 de Agosto', 'Av. Pedro Ignacio Muiba', 'Av. Bolívar', 
    'Av. Panamericana', 'Av. Circunvalación', 'Av. Ganadera'
  ],
  'Cobija': [
    'Av. 9 de Febrero', 'Av. Internacional', 'Av. Pando', 'Av. 16 de Julio', 'Av. Fernández Molina'
  ],
  'DEFAULT': ['Av. Principal', 'Ruta Troncal', 'Calle 1']
};

const DEPARTMENT_CENTERS = {
  'La Paz': { lat: -16.5, lng: -68.15, zoom: 8, baseEvents: 4802500 },
  'Santa Cruz': { lat: -17.78, lng: -63.18, zoom: 8, baseEvents: 5104200 },
  'Cochabamba': { lat: -17.38, lng: -66.15, zoom: 9, baseEvents: 3105300 },
  'Oruro': { lat: -17.96, lng: -67.11, zoom: 9, baseEvents: 450100 },
  'Potosí': { lat: -19.58, lng: -65.75, zoom: 8, baseEvents: 320000 },
  'Tarija': { lat: -21.53, lng: -64.73, zoom: 9, baseEvents: 280000 },
  'Sucre': { lat: -19.03, lng: -65.26, zoom: 9, baseEvents: 188000 },
};

const INITIAL_NODES = (() => {
  const nodes = [];
  let id = 1;
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
    { name: 'Cobija', lat: -11.0333, lng: -68.7333, count: 2, spread: 0.01 }
  ];
  BOLIVIA_REGIONS.forEach(region => {
    for (let i = 0; i < region.count; i++) {
      const streets = STREET_NAMES[region.name] || STREET_NAMES['DEFAULT'];
      nodes.push({
        id: `NXT-${region.name.substring(0,3).toUpperCase()}-${id.toString().padStart(3, '0')}`,
        lat: region.lat + (Math.random() * region.spread * 2 - region.spread),
        lng: region.lng + (Math.random() * region.spread * 2 - region.spread),
        region: region.name,
        baseRegion: region.name === 'El Alto' ? 'La Paz' : region.name,
        streetName: streets[Math.floor(Math.random() * streets.length)], // Asignación de calle aleatoria
        active: false,
        currentStatus: 'IDLE',
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
  
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);

  useEffect(() => {
    const baseVal = selectedDepartment === 'ALL' ? 14250100 : DEPARTMENT_CENTERS[selectedDepartment]?.baseEvents || 500000;
    setMetrics(m => ({ ...m, totalEvents: baseVal }));
  }, [selectedDepartment]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      const vehiclesNow = generatePoisson(55);
      const newLogs = [];
      const activeNodesMap = new Map();
      let sumSpeeds = 0, localMaxSpeed = 0, validSpeedCount = 0, regionalEventCount = 0;
      
      for(let i=0; i<Math.min(vehiclesNow, 6); i++) {
        const availableNodes = selectedDepartment === 'ALL' ? INITIAL_NODES : INITIAL_NODES.filter(n => n.baseRegion === selectedDepartment);
        if (availableNodes.length === 0) continue;

        const node = availableNodes[Math.floor(Math.random() * availableNodes.length)];
        regionalEventCount++;
        let nodeStatus = 'NORMAL';

        if (node.type === 'Cámara ANPR') {
          const plate = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`;
          const speed = Math.floor(30 + Math.random() * 85);
          sumSpeeds += speed; validSpeedCount++;
          if(speed > localMaxSpeed) localMaxSpeed = speed;
          
          newLogs.push(`[${timeStr}] EVT_LOG | ${node.id} | Detección | Placa: ${plate} | Vel: ${speed}km/h`);

          if (speed > 95) {
            nodeStatus = 'INFRACTION';
            newLogs.push(`[${timeStr}] ALERTA  | MOTOR_INFRACCIONES | Exceso Límite | Placa: ${plate}`);
            
            setAlerts(prev => [{ 
              id: `LIVE-${Date.now()}-${i}`, 
              date: dateStr,
              time: timeStr, 
              location: node.region,
              nodeId: node.id,
              plate: plate, 
              speed: speed,
              limit: 80,
              status: 'Pendiente',
              hasEvidence: true,
              isLive: true 
            }, ...prev].slice(0, 50)); 
            
            setMetrics(m => ({ ...m, activeInfractions: m.activeInfractions + 1 }));
          }
        }
        if (activeNodesMap.get(node.id) !== 'INFRACTION') activeNodesMap.set(node.id, nodeStatus);
      }

      setSpeedData(prev => [...prev.slice(1), { time: timeStr, avg: Math.floor(55 + Math.random()*15), max: localMaxSpeed }]);
      setLogs(prev => [...prev, ...newLogs].slice(-150));
      setNodes(prev => prev.map(n => ({ ...n, active: activeNodesMap.has(n.id), currentStatus: activeNodesMap.get(n.id) || 'IDLE' })));
      setMetrics(m => ({ ...m, totalEvents: m.totalEvents + (selectedDepartment === 'ALL' ? vehiclesNow : regionalEventCount) }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, selectedDepartment]);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0b] text-zinc-300 font-sans overflow-hidden">
      
      {/* Modal Detalles HW */}
      {selectedNodeDetails && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-700 w-[480px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-900/20 border-b border-zinc-800 p-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded border border-indigo-500/30">
                  {selectedNodeDetails.type === 'Cámara ANPR' ? <Activity className="text-indigo-400 w-5 h-5"/> : <Network className="text-indigo-400 w-5 h-5"/>}
                </div>
                <div>
                  <h3 className="text-zinc-100 font-bold uppercase text-sm tracking-wider">Hardware IoT / Nodo Edge</h3>
                  <p className="text-xs text-indigo-400 font-mono">{selectedNodeDetails.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNodeDetails(null)} className="text-zinc-500 hover:text-white bg-zinc-900 rounded p-1"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded">
                  <div className="text-zinc-500 mb-1 uppercase font-semibold text-[10px]">Departamento</div>
                  <div className="text-zinc-200 font-medium">{selectedNodeDetails.region}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded">
                  <div className="text-zinc-500 mb-1 uppercase font-semibold text-[10px]">Avenida / Calle Principal</div>
                  <div className="text-indigo-300 font-bold truncate" title={selectedNodeDetails.streetName}>{selectedNodeDetails.streetName}</div>
                </div>
              </div>
              
              <div className="border border-zinc-800 rounded bg-zinc-900/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-zinc-400"/>
                  <span className="text-sm font-semibold text-zinc-300">Diagnóstico de Red</span>
                </div>
                <div className="flex flex-col gap-2 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-zinc-500">Tipo de Sensor:</span><span className="text-zinc-300">{selectedNodeDetails.type}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">IP Local:</span><span className="text-zinc-300">{selectedNodeDetails.ip}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Estado:</span><span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{selectedNodeDetails.status}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Latencia (Ping):</span><span className="text-zinc-300">{Math.floor(15 + Math.random()*30)} ms</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Coordenadas:</span><span className="text-zinc-300">{selectedNodeDetails.lat.toFixed(4)}, {selectedNodeDetails.lng.toFixed(4)}</span></div>
                </div>
              </div>

              <div className="h-16 bg-black border border-zinc-800 rounded flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#3f3f46_10px,#3f3f46_20px)]"></div>
                <div className="text-emerald-500 font-mono text-xs z-10 flex items-center gap-2">
                  <Wifi className="w-4 h-4 animate-pulse"/> Transmitiendo Telemetría...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header activeTab={activeTab} isRunning={isRunning} setIsRunning={setIsRunning} selectedDepartment={selectedDepartment} setSelectedDepartment={setSelectedDepartment} DEPARTMENT_CENTERS={DEPARTMENT_CENTERS} />

      <div className="flex flex-1 overflow-hidden relative">
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto bg-zinc-950">
          
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-4 h-full">
              <KPICards metrics={metrics} selectedDepartment={selectedDepartment} />
              <div className="flex gap-4 flex-1">
                <div className="w-2/3 bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden relative flex flex-col">
                  <NodeMap nodes={nodes} viewMode="dashboard" selectedDepartment={selectedDepartment} onNodeClick={setSelectedNodeDetails} />
                </div>
                <SpeedChart speedData={speedData} />
              </div>
            </div>
          )}

          {activeTab === 'trajectory' && (
            <TrajectoryView nodes={nodes} INITIAL_NODES={INITIAL_NODES} setSelectedNodeDetails={setSelectedNodeDetails} />
          )}

          {activeTab === 'infracciones' && (
            <InfractionsView infractionsData={mockData.infractions} liveAlerts={alerts} />
          )}

          {activeTab === 'clima' && (
            <WeatherAlertsView />
          )}

          {['clima', 'reportes', 'config'].includes(activeTab) && (
            <div className="flex-1 flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              <div className="text-center">
                <Activity className="w-12 h-12 mb-4 mx-auto opacity-50" />
                <p className="text-lg font-medium">Módulo en construcción</p>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'dashboard' && <SidebarLogs alerts={alerts} logs={logs} />}
        
      </div>
    </div>
  );
}