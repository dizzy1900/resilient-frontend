import { Coordinate, Polygon } from './polygonMath';

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function simplex2D(x: number, y: number, random: () => number): number {
  const GRAD = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];

  const perm: number[] = [];
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];

  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);

  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;
  const gi0 = perm[ii + perm[jj]] % 8;
  const gi1 = perm[ii + i1 + perm[jj + j1]] % 8;
  const gi2 = perm[ii + 1 + perm[jj + 1]] % 8;

  const dot = (g: number[], x: number, y: number) => g[0] * x + g[1] * y;

  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    n0 = t0 * t0 * dot(GRAD[gi0], x0, y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    n1 = t1 * t1 * dot(GRAD[gi1], x1, y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    n2 = t2 * t2 * dot(GRAD[gi2], x2, y2);
  }

  return 70 * (n0 + n1 + n2);
}

function generateSeed(lat: number, lng: number): number {
  return Math.floor((lat * 1000 + lng * 10000) * 31337) % 2147483647;
}

export type ZoneMode = 'agriculture' | 'coastal' | 'flood' | 'portfolio';

const MODE_CONFIG = {
  agriculture: {
    baseRadiusKm: 15,
    irregularity: 0.25,
    vertices: 32,
  },
  coastal: {
    baseRadiusKm: 12,
    irregularity: 0.3,
    vertices: 28,
  },
  flood: {
    baseRadiusKm: 10,
    irregularity: 0.2,
    vertices: 36,
  },
};

export function generateIrregularZone(
  center: Coordinate,
  mode: ZoneMode,
  externalBoundary?: Polygon
): Polygon {
  if (externalBoundary) {
    return externalBoundary;
  }

  const config = MODE_CONFIG[mode];
  const seed = generateSeed(center.lat, center.lng);
  const random = seededRandom(seed);

  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos((center.lat * Math.PI) / 180);

  const coordinates: Coordinate[] = [];

  for (let i = 0; i < config.vertices; i++) {
    const angle = (i / config.vertices) * 2 * Math.PI;
    const noiseX = Math.cos(angle) * 2;
    const noiseY = Math.sin(angle) * 2;
    const noiseValue = simplex2D(noiseX + seed * 0.001, noiseY + seed * 0.001, random);
    const radiusVariation = 1 + noiseValue * config.irregularity;
    const radius = config.baseRadiusKm * radiusVariation;
    const latOffset = (Math.cos(angle) * radius) / kmPerDegreeLat;
    const lngOffset = (Math.sin(angle) * radius) / kmPerDegreeLng;

    coordinates.push({
      lat: center.lat + latOffset,
      lng: center.lng + lngOffset,
    });
  }

  return { coordinates };
}
