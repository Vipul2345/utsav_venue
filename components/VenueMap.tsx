'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, ExternalLink, MapPin } from 'lucide-react';

interface VenueMapProps {
  latitude?: number | null;
  longitude?: number | null;
  venueName: string;
  address: string;
  city?: string;
}

export default function VenueMap({
  latitude,
  longitude,
  venueName,
  address,
  city = 'Bangalore',
}: VenueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Fallback coordinates for major cities
  const getCoordinates = (): [number, number] => {
    if (latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
      return [Number(latitude), Number(longitude)];
    }
    const lowerCity = (city || '').toLowerCase();
    if (lowerCity.includes('mumbai')) return [19.076, 72.8777];
    if (lowerCity.includes('delhi')) return [28.6139, 77.209];
    if (lowerCity.includes('hyderabad')) return [17.385, 78.4867];
    if (lowerCity.includes('chennai')) return [13.0827, 80.2707];
    if (lowerCity.includes('kolkata')) return [22.5726, 88.3639];
    if (lowerCity.includes('pune')) return [18.5204, 73.8567];
    // Default to Bangalore
    return [12.9716, 77.5946];
  };

  // Generate dynamic Google Maps directions URL
  const getGoogleMapsDirectionsUrl = (): string => {
    if (latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
      return `https://www.google.com/maps/dir/?api=1&destination=${Number(latitude)},${Number(longitude)}`;
    }
    const query = [venueName, address, city].filter(Boolean).join(', ');
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const [lat, lng] = getCoordinates();

    if (!mapInstanceRef.current) {
      // Fix default Leaflet icon paths
      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
      }).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 160px; padding: 4px;">
          <strong style="color: #92400e; font-size: 13px; display: block;">${venueName}</strong>
          <span style="color: #57534e; font-size: 11px; display: block; margin-top: 2px;">${address}</span>
        </div>
      `).openPopup();

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lng], 14);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, venueName, address, city]);

  return (
    <div className="space-y-3">
      <div
        ref={mapContainerRef}
        className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-stone-200 shadow-sm z-0"
        style={{ minHeight: '260px' }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-stone-600">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="line-clamp-1">{address}{city ? `, ${city}` : ''}</span>
        </div>

        <a
          href={getGoogleMapsDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-sm transition hover:shadow shrink-0 w-full sm:w-auto"
        >
          <Navigation className="w-4 h-4" />
          <span>Get Directions</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>
    </div>
  );
}
