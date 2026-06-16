import React, { useEffect, useRef, useState } from 'react';

const MapView = ({ destination, activities = [] }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const [coords, setCoords] = useState(null); // { lat, lon }
  const [loading, setLoading] = useState(false);

  // 1. Geocode destination on mount/change
  useEffect(() => {
    if (!destination) return;

    const geocode = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setCoords({
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon)
            });
            return;
          }
        }
      } catch (err) {
        console.error('Geocoding failed, using fallback:', err);
      }

      // Fallbacks for common cities to ensure high reliability
      const lowerDest = destination.toLowerCase();
      if (lowerDest.includes('tokyo') || lowerDest.includes('japan')) {
        setCoords({ lat: 35.6762, lon: 139.6503 });
      } else if (lowerDest.includes('paris') || lowerDest.includes('france')) {
        setCoords({ lat: 48.8566, lon: 2.3522 });
      } else if (lowerDest.includes('london') || lowerDest.includes('uk')) {
        setCoords({ lat: 51.5074, lon: -0.1278 });
      } else if (lowerDest.includes('bali')) {
        setCoords({ lat: -8.4095, lon: 115.1889 });
      } else if (lowerDest.includes('greece') || lowerDest.includes('athens')) {
        setCoords({ lat: 37.9838, lon: 23.7275 });
      } else {
        // Default to a central geographic coordinate if unknown
        setCoords({ lat: 25.0, lon: 0.0 });
      }
      setLoading(false);
    };

    geocode();
  }, [destination]);

  // 2. Initialize and manage Map instance
  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;
    
    // Check if Leaflet L global object is available
    if (typeof window === 'undefined' || !window.L) {
      console.warn('Leaflet is not loaded on window.');
      return;
    }

    const L = window.L;

    // Remove existing instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lon],
      zoom: 12,
      scrollWheelZoom: false
    });

    // Add Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords]);

  // 3. Render markers & polyline path when activities list updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !coords || typeof window === 'undefined' || !window.L) return;

    const L = window.L;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!activities || activities.length === 0) return;

    const points = [];

    activities.forEach((act, idx) => {
      // Deterministic offset to spread out activities around the city center
      const angle = (idx / activities.length) * 2 * Math.PI;
      const radius = 0.015 + (idx * 0.003); // spiral outwards slightly
      const actLat = coords.lat + Math.cos(angle) * radius * 0.6;
      const actLon = coords.lon + Math.sin(angle) * radius;

      points.push([actLat, actLon]);

      // Create Custom Pin Icon
      const markerHtml = `
        <div style="
          background-color: var(--color-indigo-600, #4f46e5);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 11px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${idx + 1}</div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-map-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; max-width: 180px;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #1e293b;">${idx + 1}. ${act.title}</h4>
          <p style="margin: 0; color: #64748b; font-size: 10px; line-height: 1.4;">${act.time} · ${act.category}</p>
        </div>
      `;

      const marker = L.marker([actLat, actLon], { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Draw connecting polyline route
    if (points.length > 1) {
      const polyline = L.polyline(points, {
        color: '#6366f1',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 10',
        lineJoin: 'round'
      }).addTo(map);

      polylineRef.current = polyline;

      // Fit map bounds to show all markers
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [30, 30] });
      } catch (e) {
        console.warn('Could not fit map bounds:', e);
      }
    } else if (points.length === 1) {
      map.setView(points[0], 12);
    }
  }, [activities, coords]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-64 sm:h-80 bg-slate-50">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      {(!coords || loading) && (
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 border-2 border-indigo-200 border-t-brand-indigo rounded-full animate-spin" />
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Loading Map…</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
