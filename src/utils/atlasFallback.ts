import { GLOBAL_ATLAS_DATA } from '@/data/globalAtlas';

type AtlasItem = (typeof GLOBAL_ATLAS_DATA)[number];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findClosestAtlasItem(
  lat: number,
  lon: number,
  projectType: string
): AtlasItem | null {
  const matching = GLOBAL_ATLAS_DATA.filter((d) => d.project_type === projectType);
  if (matching.length === 0) return null;

  let closest: AtlasItem | null = null;
  let minDist = Infinity;

  for (const item of matching) {
    const dist = haversineDistance(lat, lon, item.location.lat, item.location.lon);
    if (dist < minDist) {
      minDist = dist;
      closest = item;
    }
  }

  return closest;
}
