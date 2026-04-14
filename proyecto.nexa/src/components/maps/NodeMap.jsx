import React, { useEffect, useRef } from 'react';

export default function NodeMap({ nodes, trajectoryData, viewMode, selectedDepartment, onNodeClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polylineLayerRef = useRef(null);

  const DEPARTMENT_CENTERS = {
    'La Paz': { lat: -16.5, lng: -68.15, zoom: 8 },
    'Santa Cruz': { lat: -17.78, lng: -63.18, zoom: 8 },
    'Cochabamba': { lat: -17.38, lng: -66.15, zoom: 9 },
    'Oruro': { lat: -17.96, lng: -67.11, zoom: 9 },
    'Potosí': { lat: -19.58, lng: -65.75, zoom: 8 },
    'Tarija': { lat: -21.53, lng: -64.73, zoom: 9 },
    'Sucre': { lat: -19.03, lng: -65.26, zoom: 9 },
  };

  useEffect(() => {
    let isMounted = true;
    const initLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!isMounted) return;
      if (!mapInstanceRef.current && mapRef.current && window.L) {
        const map = window.L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([-16.2902, -63.5887], 6);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
        markersLayerRef.current = window.L.layerGroup().addTo(map);
        polylineLayerRef.current = window.L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }
    };
    initLeaflet();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && viewMode === 'dashboard') {
      if (selectedDepartment === 'ALL') {
        mapInstanceRef.current.flyTo([-16.2902, -63.5887], 6, { duration: 1.5 });
      } else if (DEPARTMENT_CENTERS[selectedDepartment]) {
        const d = DEPARTMENT_CENTERS[selectedDepartment];
        mapInstanceRef.current.flyTo([d.lat, d.lng], d.zoom, { duration: 1.5 });
      }
    }
  }, [selectedDepartment, viewMode]);

  useEffect(() => {
    if (mapInstanceRef.current && viewMode === 'trajectory' && trajectoryData && trajectoryData.coords && trajectoryData.coords.length > 0) {
      try {
        mapInstanceRef.current.fitBounds(trajectoryData.coords, { padding: [80, 80], maxZoom: 13, duration: 1.5 });
      } catch (e) {
        console.warn("Leaflet bounds warning:", e);
      }
    }
  }, [trajectoryData, viewMode]);

  useEffect(() => {
    if (!window.L || !mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    
    if (viewMode === 'trajectory' && trajectoryData) {
      trajectoryData.nodes.forEach((node, index) => {
        const isInfraction = node.speed > 80;
        const colorClass = isInfraction ? 'bg-rose-500' : 'bg-indigo-500';
        
        const iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="${colorClass} text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold border-2 border-zinc-900 shadow-lg z-10">${index + 1}</div>
            <div class="absolute whitespace-nowrap bg-zinc-900/90 backdrop-blur-sm border ${isInfraction ? 'border-rose-500/50 text-rose-400' : 'border-zinc-700 text-zinc-300'} px-2 py-1 rounded text-[9px] font-mono shadow-xl left-8 -top-1">
              ${node.timestamp.split(' ')[0]} - ${node.speed} km/h
            </div>
          </div>
        `;

        const customIcon = window.L.divIcon({ html: iconHtml, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        const marker = window.L.marker([node.lat, node.lng], { icon: customIcon });
        marker.on('click', () => { if (onNodeClick) onNodeClick(node); });
        marker.addTo(markersLayerRef.current);
      });
    } else {
      nodes.forEach(node => {
        const inSelectedDept = selectedDepartment === 'ALL' || node.baseRegion === selectedDepartment;
        const isMuted = !inSelectedDept;
        const isInfraction = node.currentStatus === 'INFRACTION';

        let color = '#3f3f46';
        if (isInfraction && inSelectedDept) color = '#ef4444'; 
        else if (node.active && inSelectedDept) color = '#6366f1';

        const radius = isMuted ? 1.5 : (isInfraction ? 7 : (node.active ? 5 : 2.5));

        // TOOLTIP OSCURO FORZADO (Resuelve el problema del fondo blanco)
        const tooltipHtml = `
          <div style="background-color: rgba(24, 24, 27, 0.95); border: 1px solid #3f3f46; padding: 10px; border-radius: 8px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; line-height: 1.5; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); text-align: left;">
            <div style="color: #818cf8; font-weight: 700; margin-bottom: 4px; border-bottom: 1px solid #3f3f46; padding-bottom: 4px; font-size: 12px;">${node.id}</div>
            <div style="color: #a1a1aa;">Dept: <span style="color: #f4f4f5; font-weight: 500;">${node.region}</span></div>
            <div style="color: #a1a1aa;">Avenida: <span style="color: #f4f4f5; font-weight: 500;">${node.streetName || 'Ubicación Reservada'}</span></div>
            <div style="color: #a1a1aa;">Sensor: <span style="color: #f4f4f5; font-weight: 500;">${node.type}</span></div>
            ${isInfraction ? '<div style="color: #ef4444; font-weight: bold; margin-top: 6px; background: rgba(239,68,68,0.1); padding: 3px 6px; border-radius: 4px; text-align: center; border: 1px solid rgba(239,68,68,0.3);">¡INFRACCIÓN ACTIVA!</div>' : ''}
            <div style="color: #52525b; font-size: 9px; margin-top: 6px; text-align: center; font-style: italic;">Click para inspeccionar hardware</div>
          </div>
        `;

        const marker = window.L.circleMarker([node.lat, node.lng], {
          radius: radius,
          color: color,
          fillColor: color,
          fillOpacity: isMuted ? 0.1 : (isInfraction ? 1 : (node.active ? 0.8 : 0.4)),
          weight: 1
        }).bindTooltip(tooltipHtml, { direction: 'top', className: 'custom-hover-tooltip', opacity: 1, offset: [0, -10] });

        marker.on('click', () => { if (onNodeClick) onNodeClick(node); });
        marker.addTo(markersLayerRef.current);
      });
    }

    if (polylineLayerRef.current) {
      polylineLayerRef.current.clearLayers();
      if (viewMode === 'trajectory' && trajectoryData && trajectoryData.coords && trajectoryData.coords.length > 1) {
        window.L.polyline(trajectoryData.coords, { color: '#6366f1', weight: 3, opacity: 0.8 }).addTo(polylineLayerRef.current);
      }
    }
  }, [nodes, trajectoryData, viewMode, selectedDepartment]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#09090b' }} />;
}