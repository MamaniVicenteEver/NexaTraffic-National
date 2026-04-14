import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function SpeedChart({ speedData }) {
  return (
    <div className="w-1/3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-col p-4">
      <h3 className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider flex justify-between items-center mb-4 shrink-0">
        <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-indigo-400" /> Analítica de Velocidades</span>
      </h3>
      <div className="flex justify-between px-2 text-[10px] text-zinc-500 mb-2 shrink-0">
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div>Vel. Promedio</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"></div>Vel. Máxima</div>
      </div>
      
      {/* Se agrega min-h-[200px] para asegurar que Recharts no colapse */}
      <div className="flex-1 w-full h-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={speedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickMargin={5} />
            <YAxis stroke="#52525b" fontSize={9} width={25} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }} />
            <Line type="monotone" dataKey="max" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} name="Vel. Máxima" />
            <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} name="Vel. Promedio" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}