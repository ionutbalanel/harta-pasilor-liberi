export interface BuildingReport {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'public' | 'private' | 'institution';
  hasRamp: boolean;
  hasElevator: boolean;
  hasWideDoors: boolean;
  hasAdaptedBathroom: boolean;
  hasObstacleFreeAccess: boolean;
  comments: string;
  images: string[];
  verdict: 'accessible' | 'inaccessible';
  createdAt: string;
}

export type BuildingFilter = 'all' | 'accessible' | 'inaccessible';

export const BUILDING_TYPES: Record<BuildingReport['type'], string> = {
  public: 'Publică',
  private: 'Privată',
  institution: 'Instituție',
};

export function calculateVerdict(report: Pick<BuildingReport, 'hasRamp' | 'hasElevator' | 'hasWideDoors' | 'hasAdaptedBathroom' | 'hasObstacleFreeAccess'>): BuildingReport['verdict'] {
  const criteria = [report.hasRamp, report.hasElevator, report.hasWideDoors, report.hasAdaptedBathroom, report.hasObstacleFreeAccess];
  const met = criteria.filter(Boolean).length;
  // Accessible if at least 3 out of 5 criteria are met
  return met >= 3 ? 'accessible' : 'inaccessible';
}
