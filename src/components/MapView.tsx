import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BuildingReport, BUILDING_TYPES } from '@/types/building';
import { Button } from '@/components/ui/button';
import { Locate, LoaderCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Lightbox from './Lightbox';
import { generateReportPDF } from '@/lib/generateReportPDF';

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
  const criteria: Array<[string, BuildingReport['hasRamp']]> = [
    ['Rampă de acces', building.hasRamp],
    ['Lift funcțional', building.hasElevator],
    ['Uși largi', building.hasWideDoors],
    ['Grup sanitar adaptat', building.hasAdaptedBathroom],
    ['Acces fără obstacole', building.hasObstacleFreeAccess],
  ];

  const renderMark = (val: BuildingReport['hasRamp']) => {
    if (val === 'yes') return { color: '#16a34a', icon: '✓' };
    if (val === 'no') return { color: '#ef4444', icon: '✗' };
    return { color: '#6b7280', icon: '–' };
  };

  const criteriaHtml = criteria.map(([label, val]) => {
    const { color, icon } = renderMark(val);
    return `<div style="display:flex;align-items:center;gap:6px;font-size:12px"><span style="color:${color}">${icon}</span><span>${label}</span></div>`;
  }).join('');

  const commentsHtml = building.comments
    ? `<p style="font-size:12px;color:#444;font-style:italic;border-top:1px solid #eee;padding-top:6px;margin-top:8px">"${building.comments}"</p>`
    : '';

  const imagesHtml = building.images.length > 0
    ? `<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">${building.images.map((img, i) => `<img src="${img}" alt="Foto" data-lightbox-building="${building.id}" data-lightbox-index="${i}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;cursor:zoom-in"/>`).join('')}</div>`
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
      <button data-pdf-building="${building.id}" style="margin-top:10px;width:100%;padding:8px 10px;border:0;border-radius:8px;background:#1a1a1a;color:white;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Descarcă raport PDF
      </button>
      <button data-delete-building="${building.id}" style="margin-top:6px;width:100%;padding:8px 10px;border:1px solid #ef4444;border-radius:8px;background:white;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
        Șterge
      </button>
    </div>
  `;
}

interface MapViewProps {
  buildings: BuildingReport[];
  onMapClick: (lat: number, lng: number) => void;
  isAdding: boolean;
  onDelete: (id: string) => void;
}

const MapView = ({ buildings, onMapClick, isAdding, onDelete }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

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
    if (!map) {
      console.warn('[geolocation] Map not initialized yet');
      return;
    }

    // Geolocation requires a secure context (HTTPS) on most browsers, especially mobile.
    const isSecure = window.isSecureContext || location.hostname === 'localhost';
    if (!isSecure) {
      console.error('[geolocation] Insecure context. Geolocation requires HTTPS.', {
        protocol: location.protocol,
        hostname: location.hostname,
      });
      toast({
        title: 'Necesită HTTPS',
        description: 'Geolocația funcționează doar pe conexiuni securizate (HTTPS).',
        variant: 'destructive',
      });
      return;
    }

    if (!('geolocation' in navigator)) {
      console.error('[geolocation] navigator.geolocation not available');
      toast({
        title: 'Geolocație indisponibilă',
        description: 'Browser-ul nu suportă geolocația.',
        variant: 'destructive',
      });
      return;
    }

    console.log('[geolocation] Requesting current position...', {
      userAgent: navigator.userAgent,
      secureContext: window.isSecureContext,
    });
    setLocating(true);

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      console.log('[geolocation] Position received', { latitude, longitude, accuracy });
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([latitude, longitude]);
      } else {
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userLocationIcon })
          .addTo(map)
          .bindPopup('Locația ta');
      }
      map.flyTo([latitude, longitude], 15, { duration: 1.2 });
      setLocating(false);
      toast({
        title: 'Locație detectată',
        description: `Acuratețe: ~${Math.round(accuracy)}m`,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      setLocating(false);
      console.error('[geolocation] Error', { code: err.code, message: err.message });
      const messages: Record<number, { title: string; description: string }> = {
        1: {
          title: 'Permisiune refuzată',
          description: 'Activează accesul la locație din setările browserului și reîncarcă pagina.',
        },
        2: {
          title: 'Locație indisponibilă',
          description: 'Verifică dacă GPS-ul este activat și ai semnal.',
        },
        3: {
          title: 'Timeout',
          description: 'Cererea a expirat. Încearcă din nou într-un loc cu semnal mai bun.',
        },
      };
      const msg = messages[err.code] ?? {
        title: 'Eroare la geolocație',
        description: err.message || 'Încearcă din nou.',
      };
      toast({ ...msg, variant: 'destructive' });
    };

    // Call directly inside the user-gesture click handler — no awaits before this.
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
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

  // Delegate clicks on popup images (lightbox) and PDF download button
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();

    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Delete button
      const delBtn = target.closest('[data-delete-building]') as HTMLElement | null;
      if (delBtn) {
        const id = delBtn.getAttribute('data-delete-building');
        if (!id) return;
        const pwd = window.prompt('Introdu parola pentru a șterge această clădire:');
        if (pwd === null) return;
        if (pwd !== 'Flor@2026') {
          toast({
            title: 'Parolă incorectă',
            description: 'Ștergerea a fost anulată.',
            variant: 'destructive',
          });
          return;
        }
        onDelete(id);
        map.closePopup();
        return;
      }

      // PDF download button (may be clicked on the button or its inner svg/path)
      const pdfBtn = target.closest('[data-pdf-building]') as HTMLElement | null;
      if (pdfBtn) {
        const id = pdfBtn.getAttribute('data-pdf-building');
        const b = buildings.find((x) => x.id === id);
        if (b) {
          generateReportPDF({
            name: b.name,
            address: b.address,
            type: b.type,
            lat: b.lat,
            lng: b.lng,
            hasRamp: b.hasRamp,
            hasElevator: b.hasElevator,
            hasWideDoors: b.hasWideDoors,
            hasAdaptedBathroom: b.hasAdaptedBathroom,
            hasObstacleFreeAccess: b.hasObstacleFreeAccess,
            comments: b.comments,
            images: b.images,
            verdict: b.verdict,
          });
        }
        return;
      }

      // Lightbox image click
      if (target.tagName !== 'IMG') return;
      const id = target.getAttribute('data-lightbox-building');
      const idxAttr = target.getAttribute('data-lightbox-index');
      if (!id || idxAttr === null) return;
      const b = buildings.find((x) => x.id === id);
      if (!b || !b.images.length) return;
      setLightbox({ images: b.images, index: Number(idxAttr) || 0 });
    };

    container.addEventListener('click', handler);
    return () => container.removeEventListener('click', handler);
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
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((l) => (l ? { ...l, index: i } : l))}
        />
      )}
    </div>
  );
};

export default MapView;
