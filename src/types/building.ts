export type AccessibilityValue = 'yes' | 'no' | 'na';

export type CriterionValue = AccessibilityValue | null;

export interface BuildingReport {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'public' | 'private' | 'institution';
  hasRamp: CriterionValue;
  hasElevator: CriterionValue;
  hasWideDoors: CriterionValue;
  hasAdaptedBathroom: CriterionValue;
  hasObstacleFreeAccess: CriterionValue;
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
  na: 'Neconform',
};

interface CriteriaInput {
  hasRamp: CriterionValue;
  hasElevator: CriterionValue;
  hasWideDoors: CriterionValue;
  hasAdaptedBathroom: CriterionValue;
  hasObstacleFreeAccess: CriterionValue;
}

export function calculateVerdict(report: CriteriaInput): BuildingReport['verdict'] {
  // Essential criteria — a single "no" makes the building inaccessible
  const essentials: CriterionValue[] = [report.hasRamp, report.hasObstacleFreeAccess];
  if (essentials.includes('no')) return 'inaccessible';

  const all: CriterionValue[] = [
    report.hasRamp,
    report.hasElevator,
    report.hasWideDoors,
    report.hasAdaptedBathroom,
    report.hasObstacleFreeAccess,
  ];
  // Ignore "na" (inutil) and unanswered (null) — they don't affect the score
  const relevant = all.filter((v) => v !== 'na' && v !== null);
  if (relevant.length === 0) return 'inaccessible';
  const yes = relevant.filter((v) => v === 'yes').length;
  // Accessible if majority of relevant criteria are "yes"
  return yes / relevant.length > 0.5 ? 'accessible' : 'inaccessible';
}
