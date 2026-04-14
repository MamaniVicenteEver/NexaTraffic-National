import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CloudRain, Wind, Snowflake, ThermometerSun, AlertTriangle, Droplets } from 'lucide-react';

// --- MOCK DATA PARA GRÁFICOS ---
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const temperatureData = months.map((m, i) => ({
  month: m,
  temp1: 15 + Math.sin(i) * 10 + Math.random() * 5, // Línea Púrpura (Máximas)
  temp2: 5 + Math.sin(i) * 8 + Math.random() * 3,   // Línea Roja (Mínimas)
}));

const precipitationData = months.map((m, i) => ({
  month: m,
  rain1: Math.max(0, 20 + Math.cos(i) * 50 + Math.random() * 30), // Línea Azul
  rain2: Math.max(0, 10 + Math.cos(i + 1) * 40 + Math.random() * 20), // Línea Verde
}));

const historicalAlerts = months.map((m) => ({
  month: m,
  count: Math.floor(Math.random() * 8) + 2,
}));

// --- MOCK DATA PARA TABLA DE ALERTAS ---
const activeAlerts = [
  { id: 1, location: "Cochabamba (NXT-COC-112)", type: "Heavy Rain", icon: CloudRain, severity: "High-Red", value: "45mm/h", time: "14/04/2026, 07:57:28", status: "Active" },
  { id: 2, location: "Oruro (NXT-ORU-007)", type: "Wind", icon: Wind, severity: "Medium-Orange", value: "70km/h", time: "14/04/2026, 07:55:12", status: "Active" },
  { id: 3, location: "Potosí (NXT-PTS-004)", type: "Snow", icon: Snowflake, severity: "Low-Yellow", value: "120mm", time: "14/04/2026, 07:50:38", status: "Active" },
  { id: 4, location: "La Paz (NXT-LPZ-045)", type: "Snow", icon: Snowflake, severity: "High-Red", value: "70km/h", time: "14/04/2026, 07:45:10", status: "Active" },
  { id: 5, location: "Santa Cruz (NXT-SCZ-001)", type: "Heavy Rain", icon: CloudRain, severity: "Low-Yellow", value: "120mm", time: "14/04/2026, 07:40:05", status: "Active" },
];

export default function WeatherAlertsView() {
  
  // Función auxiliar para renderizar los badges de severidad
  const renderSeverityBadge = (severity) => {
    if (severity.includes('Red')) {
      return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{severity}</span>;
    }
    if (severity.includes('Orange')) {
      return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{severity}</span>;
    }
    return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{severity}</span>;
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 gap-4">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Alertas Climáticas</h2>
      </div>

      {/* --- TOP ROW: GRÁFICOS DE LÍNEAS/ÁREAS --- */}
      <div className="flex gap-4 h-[280px] shrink-0">
        
        {/* GRÁFICO 1: Temperature Trends */}
        <div className="flex-1 bg-[#121215] border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ThermometerSun className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-200">Temperature Trends</h3>
          </div>
          <div className="flex gap-4 text-[10px] text-zinc-400 mb-2 px-2">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Temperature (High)</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Temperature (Low)</span>
          </div>
          <div className="flex-1 w-full h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temperatureData}>
                <defs>
                  <linearGradient id="colorTemp1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTemp2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickMargin={8} />
                <YAxis stroke="#52525b" fontSize={10} width={25} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }} />
                <Area type="monotone" dataKey="temp1" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp1)" />
                <Area type="monotone" dataKey="temp2" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: Precipitation Levels */}
        <div className="flex-1 bg-[#121215] border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-zinc-200">Precipitation Levels</h3>
          </div>
          <div className="flex gap-4 text-[10px] text-zinc-400 mb-2 px-2">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Rainfall (Heavy)</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Rainfall (Light)</span>
          </div>
          <div className="flex-1 w-full h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={precipitationData}>
                <defs>
                  <linearGradient id="colorRain1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRain2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickMargin={8} />
                <YAxis stroke="#52525b" fontSize={10} width={30} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }} />
                <Area type="monotone" dataKey="rain1" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRain1)" />
                <Area type="monotone" dataKey="rain2" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRain2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- MIDDLE ROW: TABLA DE ALERTAS ACTIVAS --- */}
      <div className="bg-[#121215] border border-zinc-800 rounded-xl flex flex-col shadow-lg overflow-hidden shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-200">Active Alerts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-900/50 text-zinc-400 text-xs tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Alert Type</th>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Measured Value</th>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-800/50">
              {activeAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-zinc-300 font-medium">{alert.location}</td>
                  <td className="px-5 py-3 text-zinc-300">
                    <div className="flex items-center gap-2">
                      <alert.icon className="w-4 h-4 text-indigo-400" />
                      {alert.type}
                    </div>
                  </td>
                  <td className="px-5 py-3">{renderSeverityBadge(alert.severity)}</td>
                  <td className="px-5 py-3 text-zinc-300 font-mono text-xs">{alert.value}</td>
                  <td className="px-5 py-3 text-zinc-400 font-mono text-xs">{alert.time}</td>
                  <td className="px-5 py-3 text-zinc-300">{alert.status}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                      Resolve Manually
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- BOTTOM ROW: GRÁFICO HISTÓRICO DE BARRAS --- */}
      <div className="flex-1 min-h-[220px] bg-[#121215] border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col">
        <h3 className="text-sm font-bold text-zinc-200 mb-4">Historical Alerts per Month</h3>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalAlerts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickMargin={8} />
              <YAxis stroke="#52525b" fontSize={10} width={25} />
              <Tooltip 
                cursor={{ fill: '#27272a', opacity: 0.4 }}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }} 
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}