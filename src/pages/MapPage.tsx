import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { subscribeToIssues } from '../lib/firestore';
import type { Issue, IssueCategory, IssueSeverity } from '../types';
import IssueCard from '../components/IssueCard';
import { X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERITY_HEX: Record<IssueSeverity, string> = {
  low: '#4ADE80',
  medium: '#FACC15',
  high: '#FB923C',
  critical: '#EF4444',
};

const CATEGORIES: Array<{ value: IssueCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pothole', label: '🕳️ Pothole' },
  { value: 'streetlight', label: '💡 Streetlight' },
  { value: 'garbage', label: '🗑️ Garbage' },
  { value: 'water', label: '💧 Water' },
  { value: 'drainage', label: '🌊 Drainage' },
];

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0369a1' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [activeFilter, setActiveFilter] = useState<IssueCategory | 'all'>('all');
  const [mapReady, setMapReady] = useState(false);

  // Load Google Maps
  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    loader.load().then(() => {
      if (!mapRef.current) return;
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
        zoom: 13,
        styles: MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: 'roadmap',
      });
      setMapReady(true);
    });
  }, []);

  // Subscribe to real-time issues
  useEffect(() => {
    const unsub = subscribeToIssues(setIssues);
    return unsub;
  }, []);

  // Render markers when map is ready or issues/filter change
  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;

    const filtered = activeFilter === 'all' ? issues : issues.filter((i) => i.category === activeFilter);
    const currentIds = new Set(filtered.map((i) => i.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Add new markers
    filtered.forEach((issue) => {
      if (markersRef.current.has(issue.id)) return;
      const marker = new google.maps.Marker({
        position: { lat: issue.location.lat, lng: issue.location.lng },
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: SEVERITY_HEX[issue.severity],
          fillOpacity: 0.9,
          strokeColor: '#0f172a',
          strokeWeight: 2,
        },
        title: issue.title,
      });
      marker.addListener('click', () => setSelectedIssue(issue));
      markersRef.current.set(issue.id, marker);
    });
  }, [issues, activeFilter, mapReady]);

  return (
    <div className="relative h-[calc(100vh-56px)]">
      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Filter chips */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto px-4 max-w-full">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeFilter === value
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-orange-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Issue count badge */}
      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full px-3 py-1 text-sm text-slate-400">
        {(activeFilter === 'all' ? issues : issues.filter((i) => i.category === activeFilter)).length} issues
      </div>

      {/* FAB - Report Issue */}
      <Link
        to="/report"
        className="absolute bottom-8 right-4 w-14 h-14 bg-orange-500 hover:bg-orange-600 rounded-full shadow-lg flex items-center justify-center transition-colors"
      >
        <Plus size={24} className="text-white" />
      </Link>

      {/* Bottom Sheet - Issue Preview */}
      {selectedIssue && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-2xl p-4 animate-slide-up">
          <button
            onClick={() => setSelectedIssue(null)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white"
          >
            <X size={20} />
          </button>
          <IssueCard issue={selectedIssue} compact />
        </div>
      )}
    </div>
  );
}
