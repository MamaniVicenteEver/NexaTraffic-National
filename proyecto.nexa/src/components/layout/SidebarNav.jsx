import React, { useState } from 'react';
import { LayoutDashboard, AlertTriangle, Route, CloudLightning, FileBarChart, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SidebarNav({ activeTab, setActiveTab }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
    { id: 'infracciones', label: 'Monitoreo Infracciones', icon: AlertTriangle },
    { id: 'trajectory', label: 'Trayectorias', icon: Route },
    { id: 'clima', label: 'Alertas Climáticas', icon: CloudLightning },
    { id: 'reportes', label: 'Reportes', icon: FileBarChart },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className={`bg-[#0a0a0b] border-r border-zinc-800 transition-all duration-300 flex flex-col z-20 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      
      {/* Botón para colapsar/expandir */}
      <div className="p-3 flex justify-end border-b border-zinc-800/50">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title={isCollapsed ? "Expandir menú" : "Ocultar menú"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 flex flex-col gap-1 p-2 mt-2">
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
              } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className={`shrink-0 ${isActive ? 'w-5 h-5' : 'w-5 h-5'}`} />
              
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}