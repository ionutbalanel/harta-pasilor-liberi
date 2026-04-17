import { BuildingReport } from '@/types/building';

const STORAGE_KEY = 'harta-rusinii-buildings';
const MIGRATION_KEY = 'harta-rusinii-demo-cleared-v1';

// One-time cleanup of legacy demo seed data
if (typeof window !== 'undefined' && !localStorage.getItem(MIGRATION_KEY)) {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(MIGRATION_KEY, '1');
}

export function getBuildings(): BuildingReport[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
