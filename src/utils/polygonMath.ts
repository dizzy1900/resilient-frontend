export interface Coordinate {
  lng: number;
  lat: number;
}

export interface Polygon {
  coordinates: Coordinate[];
}

export function calculateCentroid(polygon: Polygon): Coordinate {
  const coords = polygon.coordinates;
  let sumLat = 0;
  let sumLng = 0;

  for (const coord of coords) {
    sumLat += coord.lat;
    sumLng += coord.lng;
  }

  return {
    lat: sumLat / coords.length,
    lng: sumLng / coords.length,
  };
}

export function calculatePolygonArea(polygon: Polygon): number {
  const coords = polygon.coordinates;
  const n = coords.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lngI = coords[i].lng;
    const latI = coords[i].lat;
    const lngJ = coords[j].lng;
    const latJ = coords[j].lat;
    area += lngI * latJ;
    area -= lngJ * latI;
  }

  area = Math.abs(area) / 2;
  const kmPerDegreeLat = 111;
  const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / n;
  const kmPerDegreeLng = 111 * Math.cos((avgLat * Math.PI) / 180);
  return area * kmPerDegreeLat * kmPerDegreeLng;
}

export function scalePolygon(polygon: Polygon, scale: number): Polygon {
  const centroid = calculateCentroid(polygon);
  const scaledCoords = polygon.coordinates.map((coord) => ({
    lng: centroid.lng + (coord.lng - centroid.lng) * scale,
    lat: centroid.lat + (coord.lat - centroid.lat) * scale,
  }));

  return { coordinates: scaledCoords };
}

export function polygonToGeoJSON(polygon: Polygon): GeoJSON.Feature<GeoJSON.Polygon> {
  const ring = [...polygon.coordinates.map((c) => [c.lng, c.lat]), [polygon.coordinates[0].lng, polygon.coordinates[0].lat]];
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
  };
}

export function createRingDifferenceGeoJSON(
  outer: Polygon,
  inner: Polygon
): GeoJSON.Feature<GeoJSON.Polygon> | null {
  const outerArea = calculatePolygonArea(outer);
  const innerArea = calculatePolygonArea(inner);
  if (innerArea >= outerArea) return null;

  const outerRing = [...outer.coordinates.map((c) => [c.lng, c.lat]), [outer.coordinates[0].lng, outer.coordinates[0].lat]];
  const innerRing = [...inner.coordinates.map((c) => [c.lng, c.lat]), [inner.coordinates[0].lng, inner.coordinates[0].lat]].reverse();

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [outerRing, innerRing],
    },
  };
}
