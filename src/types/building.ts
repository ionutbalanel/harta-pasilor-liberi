export type AccessibilityValue = 'yes' | 'no' | 'na';

export interface BuildingReport {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'public' | 'private' | 'institution';
  hasRamp: AccessibilityValue;
  hasElevator: AccessibilityValue;
  hasWideDoors: AccessibilityValue;
  hasAdaptedBathroom: AccessibilityValue;
  hasObstacleFreeAccess: AccessibilityValue;
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

export const ACCESSIBILITY_LABELS: Record<AccessibilityValue, string> = {
  yes: 'Da',
  no: 'Nu',
  na: 'Inutil',
};

interface CriteriaInput {
  hasRamp: AccessibilityValue;
  hasElevator: AccessibilityValue;
  hasWideDoors: AccessibilityValue;
  hasAdaptedBathroom: AccessibilityValue;
  hasObstacleFreeAccess: AccessibilityValue;
}

export function calculateVerdict(report: CriteriaInput): BuildingReport['verdict'] {
  // Essential criteria — a single "no" makes the building inaccessible
  const essentials: AccessibilityValue[] = [report.hasRamp, report.hasObstacleFreeAccess];
  if (essentials.includes('no')) return 'inaccessible';

  const all: AccessibilityValue[] = [
    report.hasRamp,
    report.hasElevator,
    report.hasWideDoors,
    report.hasAdaptedBathroom,
    report.hasObstacleFreeAccess,
  ];
  // Ignore "na" (inutil) — it doesn't affect the score
  const relevant = all.filter((v) => v !== 'na');
  if (relevant.length === 0) return 'inaccessible';
  const yes = relevant.filter((v) => v === 'yes').length;
  // Accessible if majority of relevant criteria are "yes"
  return yes / relevant.length > 0.5 ? 'accessible' : 'inaccessible';
}
