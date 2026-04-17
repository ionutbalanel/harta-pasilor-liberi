import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BuildingReport, BUILDING_TYPES } from '@/types/building';
import { Button } from '@/components/ui/button';
import { Locate, LoaderCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Republic of Moldova default view
const MOLDOVA_CENTER: [number, number] = [47.0105, 28.8638];
const MOLDOVA_ZOOM = 8;

const userLocationIcon = L.divIcon({
  html: `<div style="position:relative;width:20px;height:20px"><div style="position:absolute;inset:0;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #3b82f6,0 2px 8px rgba(0,0,0,0.3)"></div><div style="position:absolute;inset:-8px;background:#3b82f6;border-radius:50%;opacity:0.2;animation:pulse 2s infinite"></div></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (verdict: 'accessible' | 'inaccessible') => {
  const color = verdict === 'accessible' ? '#16a34a' : '#ef4444';
  const svg = verdict === 'accessible'
    ? '<polyline points="20 6 9 17 4 12"></polyline>'
    : '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
  return L.divIcon({
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
};

function buildPopupContent(building: BuildingReport): string {
  const verdictColor = building.verdict === 'accessible' ? '#16a34a' : '#ef4444';
  const verdictLabel = building.verdict === 'accessible' ? '✓ Accesibilă' : '✗ Inaccesibilă';
  const criteria = [
    ['Rampă de acces', building.hasRamp],
    ['Lift funcțional', building.hasElevator],
    ['Uși largi', building.hasWideDoors],
    ['Grup sanitar adaptat', building.hasAdaptedBathroom],
    ['Acces fără obstacole', building.hasObstacleFreeAccess],
  ] as const;

  const criteriaHtml = criteria.map(([label, val]) =>
    `<div style="display:flex;align-items:center;gap:6px;font-size:12px"><span style="color:${val ? '#16a34a' : '#ef4444'}">${val ? '✓' : '✗'}</span><span>${label}</span></div>`
  ).join('');

  const commentsHtml = building.comments
    ? `<p style="font-size:12px;color:#444;font-style:italic;border-top:1px solid #eee;padding-top:6px;margin-top:8px">"${building.comments}"</p>`
    : '';

  const imagesHtml = building.images.length > 0
    ? `<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">${building.images.slice(0, 3).map(img => `<img src="${img}" alt="Foto" style="width:60px;height:60px;object-fit:cover;border-radius:8px"/>`).join('')}</div>`
    : '';

  return `
    <div style="padding:12px;font-family:Inter,sans-serif;min-width:200px">
      <div style="margin-bottom:8px">
        <span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;color:white;background:${verdictColor}">${verdictLabel}</span>
      </div>
      <h3 style="font-weight:700;font-size:15px;margin:0 0 2px;color:#1a1a1a">${building.name}</h3>
      <p style="font-size:12px;color:#666;margin:0 0 8px">${building.address} · ${BUILDING_TYPES[building.type]}</p>
      <div style="display:flex;flex-direction:column;gap:3px">${criteriaHtml}</div>
      ${commentsHtml}
      ${imagesHtml}
    </div>
  `;
}

interface MapViewProps {
  buildings: BuildingReport[];
  onMapClick: (lat: number, lng: number) => void;
  isAdding: boolean;
}

const MapView = ({ buildings, onMapClick, isAdding }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(MOLDOVA_CENTER, MOLDOVA_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const locateUser = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!('geolocation' in navigator)) {
      toast({ title: 'Geolocație indisponibilă', description: 'Browser-ul nu suportă geolocația.', variant: 'destructive' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          userMarkerRef.current = L.marker([latitude, longitude], { icon: userLocationIcon })
            .addTo(map)
            .bindPopup('Locația ta');
        }
        map.flyTo([latitude, longitude], 15, { duration: 1.2 });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast({
          title: 'Nu am putut obține locația',
          description: err.code === 1 ? 'Permisiunea a fost refuzată.' : 'Încearcă din nou.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Handle click
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      if (isAdding) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handler);
    if (isAdding) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }

    return () => {
      map.off('click', handler);
      map.getContainer().style.cursor = '';
    };
  }, [isAdding, onMapClick]);

  // Update markers
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;

    group.clearLayers();
    buildings.forEach((building) => {
      const marker = L.marker([building.lat, building.lng], {
        icon: createIcon(building.verdict),
      });
      marker.bindPopup(buildPopupContent(building));
      group.addLayer(marker);
    });
  }, [buildings]);

  return (
    <div className="relative w-full h-full">
      {isAdding && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
          📍 Click pe hartă pentru a alege locația
        </div>
      )}
      <Button
        onClick={locateUser}
        disabled={locating}
        size="icon"
        variant="secondary"
        className="absolute bottom-6 right-3 z-[1000] shadow-lg h-11 w-11 rounded-full"
        aria-label="Centrează pe locația mea"
        title="Centrează pe locația mea"
      >
        {locating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Locate className="h-5 w-5" />}
      </Button>
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
    </div>
  );
};

export default MapView;
