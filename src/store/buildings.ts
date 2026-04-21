import { BuildingReport } from '@/types/building';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'building-images';

type DbRow = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: BuildingReport['type'];
  has_ramp: BuildingReport['hasRamp'];
  has_elevator: BuildingReport['hasElevator'];
  has_wide_doors: BuildingReport['hasWideDoors'];
  has_adapted_bathroom: BuildingReport['hasAdaptedBathroom'];
  has_obstacle_free_access: BuildingReport['hasObstacleFreeAccess'];
  comments: string;
  images: string[];
  verdict: BuildingReport['verdict'];
  created_at: string;
};

function rowToReport(row: DbRow): BuildingReport {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: Number(row.lat),
    lng: Number(row.lng),
    type: row.type,
    hasRamp: row.has_ramp,
    hasElevator: row.has_elevator,
    hasWideDoors: row.has_wide_doors,
    hasAdaptedBathroom: row.has_adapted_bathroom,
    hasObstacleFreeAccess: row.has_obstacle_free_access,
    comments: row.comments ?? '',
    images: row.images ?? [],
    verdict: row.verdict,
    createdAt: row.created_at,
  };
}

export async function fetchBuildings(): Promise<BuildingReport[]> {
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to fetch buildings:', error);
    return [];
  }
  return (data as DbRow[]).map(rowToReport);
}

/**
 * Uploads a data-URL or http URL image to storage and returns the public URL.
 * Returns the original URL if it's already an http(s) URL.
 */
export async function uploadBuildingImage(dataUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(dataUrl)) return dataUrl;

  // dataUrl format: data:image/png;base64,XXXX
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');
  const mime = match[1];
  const base64 = match[2];
  const ext = mime.split('/')[1]?.split('+')[0] || 'jpg';
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const filename = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, bytes, { contentType: mime, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function addBuilding(
  report: Omit<BuildingReport, 'id' | 'createdAt'>
): Promise<BuildingReport> {
  // Upload any base64 images first, replace with public URLs
  const uploadedImages = await Promise.all(
    report.images.map((img) => uploadBuildingImage(img))
  );

  const { data, error } = await supabase
    .from('buildings')
    .insert({
      name: report.name,
      address: report.address,
      lat: report.lat,
      lng: report.lng,
      type: report.type,
      has_ramp: report.hasRamp,
      has_elevator: report.hasElevator,
      has_wide_doors: report.hasWideDoors,
      has_adapted_bathroom: report.hasAdaptedBathroom,
      has_obstacle_free_access: report.hasObstacleFreeAccess,
      comments: report.comments,
      images: uploadedImages,
      verdict: report.verdict,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToReport(data as DbRow);
}

export async function deleteBuilding(id: string): Promise<void> {
  const { error } = await supabase.from('buildings').delete().eq('id', id);
  if (error) throw error;
}

export function getStats(buildings: BuildingReport[]) {
  const total = buildings.length;
  const accessible = buildings.filter((b) => b.verdict === 'accessible').length;
  const inaccessible = total - accessible;
  const accessiblePercent = total > 0 ? Math.round((accessible / total) * 100) : 0;
  return { total, accessible, inaccessible, accessiblePercent };
}
