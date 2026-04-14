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
    // PROTECCIÓN: Solo hacer fitBounds si hay coordenadas reales (evita el error Cannot read properties of undefined (reading 'x'))
    if (mapInstanceRef.current && viewMode === 'trajectory' && trajectoryData && trajectoryData.coords && trajectoryData.coords.length > 0) {
      try {
        mapInstanceRef.current.fitBounds(trajectoryData.coords, { padding: [50, 50], maxZoom: 9, duration: 1.5 });
      } catch (e) {
        console.warn("Leaflet bounds warning:", e);
      }
    }
  }, [trajectoryData, viewMode]);

  useEffect(() => {
    if (!window.L || !mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    
    const nodesToRender = viewMode === 'trajectory' && trajectoryData ? trajectoryData.nodes : nodes;

    nodesToRender.forEach(node => {
      const isTrajectoryNode = viewMode === 'trajectory';
      const inSelectedDept = selectedDepartment === 'ALL' || node.baseRegion === selectedDepartment;
      const isMuted = !inSelectedDept && !isTrajectoryNode;

      let color = '#3f3f46';
      if (isTrajectoryNode) color = '#f43f5e';
      else if (node.active && inSelectedDept) color = '#6366f1';

      const marker = window.L.circleMarker([node.lat, node.lng], {
        radius: isMuted ? 1.5 : (node.active || isTrajectoryNode ? 5 : 2.5),
        color: color,
        fillColor: color,
        fillOpacity: isMuted ? 0.1 : (node.active || isTrajectoryNode ? 0.9 : 0.4),
        weight: isTrajectoryNode ? 2 : 1
      }).bindTooltip(`
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; line-height: 1.4;">
          <div style="color: #818cf8; font-weight: 600;">${node.id}</div>
          <div style="color: #d4d4d8;">Sistema: <span style="color: #f4f4f5;">${node.type}</span></div>
          <div style="color: #d4d4d8;">Región: <span style="color: #f4f4f5;">${node.region}</span></div>
          <div style="color: #a1a1aa; font-size: 9px; margin-top: 2px;">Click para detalles</div>
        </div>
      `, { direction: 'top', className: 'custom-hover-tooltip', opacity: 1, offset: [0, -10] });

      marker.on('click', () => { if (onNodeClick) onNodeClick(node); });
      marker.addTo(markersLayerRef.current);
    });

    if (polylineLayerRef.current) {
      polylineLayerRef.current.clearLayers();
      // PROTECCIÓN: Solo dibujar polyline si hay 2 o más puntos
      if (viewMode === 'trajectory' && trajectoryData && trajectoryData.coords && trajectoryData.coords.length > 1) {
        window.L.polyline(trajectoryData.coords, { color: '#f43f5e', weight: 3, dashArray: '8, 8', opacity: 0.8 }).addTo(polylineLayerRef.current);
      }
    }
  }, [nodes, trajectoryData, viewMode, selectedDepartment]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#09090b' }} />;
}