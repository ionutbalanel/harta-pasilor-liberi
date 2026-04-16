import { BuildingReport } from '@/types/building';

const STORAGE_KEY = 'harta-rusinii-buildings';

// Sample data for demo
const SAMPLE_DATA: BuildingReport[] = [
  {
    id: '1',
    name: 'Primăria Sector 3',
    address: 'Calea Dudești 191, București',
    lat: 44.4168,
    lng: 26.1255,
    type: 'public',
    hasRamp: false,
    hasElevator: true,
    hasWideDoors: false,
    hasAdaptedBathroom: false,
    hasObstacleFreeAccess: false,
    comments: 'Intrarea principală nu are rampă. Ușile sunt prea înguste pentru scaun rulant.',
    images: [],
    verdict: 'inaccessible',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Biblioteca Națională',
    address: 'Bulevardul Unirii 22, București',
    lat: 44.4275,
    lng: 26.1040,
    type: 'institution',
    hasRamp: true,
    hasElevator: true,
    hasWideDoors: true,
    hasAdaptedBathroom: true,
    hasObstacleFreeAccess: true,
    comments: 'Clădire complet accesibilă, renovată recent.',
    images: [],
    verdict: 'accessible',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Spitalul Universitar',
    address: 'Splaiul Independenței 169, București',
    lat: 44.4350,
    lng: 26.0520,
    type: 'public',
    hasRamp: true,
    hasElevator: true,
    hasWideDoors: true,
    hasAdaptedBathroom: false,
    hasObstacleFreeAccess: false,
    comments: 'Rampă și lift disponibile, dar grupurile sanitare nu sunt adaptate.',
    images: [],
    verdict: 'inaccessible',
    createdAt: new Date().toISOString(),
  },
];

export function getBuildings(): BuildingReport[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DATA));
    return SAMPLE_DATA;
  }
  return JSON.parse(stored);
}

export function addBuilding(building: BuildingReport): void {
  const buildings = getBuildings();
  buildings.push(building);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildings));
}

export function getStats(buildings: BuildingReport[]) {
  const total = buildings.length;
  const accessible = buildings.filter(b => b.verdict === 'accessible').length;
  const inaccessible = total - accessible;
  const accessiblePercent = total > 0 ? Math.round((accessible / total) * 100) : 0;
  return { total, accessible, inaccessible, accessiblePercent };
}
