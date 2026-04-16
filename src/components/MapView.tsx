import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BuildingReport } from '@/types/building';
import { CheckCircle2, XCircle, MapPin } from 'lucide-react';
import { BUILDING_TYPES } from '@/types/building';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const accessibleIcon = new L.DivIcon({
  html: `<div style="background:#16a34a;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
});

const inaccessibleIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
});

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
  isAdding: boolean;
}

function MapClickHandler({ onMapClick, isAdding }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (isAdding) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface MapViewProps {
  buildings: BuildingReport[];
  onMapClick: (lat: number, lng: number) => void;
  isAdding: boolean;
}

const CriteriaRow = ({ label, value }: { label: string; value: boolean }) => (
  <div className="flex items-center gap-1.5 text-xs">
    {value ? (
      <span style={{ color: '#16a34a' }}>✓</span>
    ) : (
      <span style={{ color: '#ef4444' }}>✗</span>
    )}
    <span>{label}</span>
  </div>
);

const MapView = ({ buildings, onMapClick, isAdding }: MapViewProps) => {
  return (
    <div className="relative w-full h-full">
      {isAdding && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
          📍 Click pe hartă pentru a alege locația
        </div>
      )}
      <MapContainer
        center={[44.4268, 26.1025]}
        zoom={13}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} isAdding={isAdding} />
        {buildings.map((building) => (
          <Marker
            key={building.id}
            position={[building.lat, building.lng]}
            icon={building.verdict === 'accessible' ? accessibleIcon : inaccessibleIcon}
          >
            <Popup>
              <div style={{ padding: '12px', fontFamily: 'Inter, sans-serif', minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'white',
                    background: building.verdict === 'accessible' ? '#16a34a' : '#ef4444',
                  }}>
                    {building.verdict === 'accessible' ? '✓ Accesibilă' : '✗ Inaccesibilă'}
                  </span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px', color: '#1a1a1a' }}>
                  {building.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  {building.address} · {BUILDING_TYPES[building.type]}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' }}>
                  <CriteriaRow label="Rampă de acces" value={building.hasRamp} />
                  <CriteriaRow label="Lift funcțional" value={building.hasElevator} />
                  <CriteriaRow label="Uși largi" value={building.hasWideDoors} />
                  <CriteriaRow label="Grup sanitar adaptat" value={building.hasAdaptedBathroom} />
                  <CriteriaRow label="Acces fără obstacole" value={building.hasObstacleFreeAccess} />
                </div>
                {building.comments && (
                  <p style={{ fontSize: '12px', color: '#444', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                    "{building.comments}"
                  </p>
                )}
                {building.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {building.images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img} alt="Foto" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
