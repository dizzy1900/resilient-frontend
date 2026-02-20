import { Polygon, scalePolygon } from './polygonMath';
import { ZoneMode } from './zoneGeneration';

const MODE_SCALING = {
  agriculture: {
    direction: 'shrink' as const,
    minScaleAt3C: 0.55,
  },
  coastal: {
    direction: 'shrink' as const,
    minScaleAt3C: 0.60,
  },
  flood: {
    direction: 'expand' as const,
    maxScaleAt3C: 1.50,
  },
};

export function calculateZoneAtTemperature(
  baselineZone: Polygon,
  temperature: number,
  mode: ZoneMode
): Polygon {
  const config = MODE_SCALING[mode as keyof typeof MODE_SCALING];
  
  // Portfolio mode doesn't use zone morphing - return baseline unchanged
  if (!config) {
    return baselineZone;
  }
  const clampedTemp = Math.max(0, Math.min(3, temperature));
  const tempRatio = clampedTemp / 3;

  let scale: number;

  if (config.direction === 'shrink') {
    scale = 1 - tempRatio * (1 - config.minScaleAt3C);
  } else {
    scale = 1 + tempRatio * (config.maxScaleAt3C - 1);
  }

  return scalePolygon(baselineZone, scale);
}

export function getZoneChangePercentage(
  baselineZone: Polygon,
  currentZone: Polygon,
  mode: ZoneMode
): number {
  const baseCount = baselineZone.coordinates.length;
  const currentCount = currentZone.coordinates.length;
  if (baseCount === 0 || currentCount === 0) return 0;

  let baseArea = 0;
  let currentArea = 0;
  for (let i = 0; i < baseCount; i++) {
    const j = (i + 1) % baseCount;
    baseArea += baselineZone.coordinates[i].lng * baselineZone.coordinates[j].lat;
    baseArea -= baselineZone.coordinates[j].lng * baselineZone.coordinates[i].lat;
  }
  for (let i = 0; i < currentCount; i++) {
    const j = (i + 1) % currentCount;
    currentArea += currentZone.coordinates[i].lng * currentZone.coordinates[j].lat;
    currentArea -= currentZone.coordinates[j].lng * currentZone.coordinates[i].lat;
  }

  baseArea = Math.abs(baseArea);
  currentArea = Math.abs(currentArea);

  if (baseArea === 0) return 0;

  const percentChange = ((currentArea - baseArea) / baseArea) * 100;

  if (mode === 'flood') {
    return Math.round(percentChange);
  }
  return Math.round(percentChange);
}

export interface ZoneColors {
  fillColor: string;
  fillOpacity: number;
  outlineColor: string;
  lossColor: string;
  baselineOutlineColor: string;
}

const BASELINE_COLORS: Record<string, string> = {
  agriculture: '#22c55e',
  coastal: '#14b8a6',
  flood: '#3b82f6',
  portfolio: '#a855f7',
};

const LOSS_COLORS: Record<string, string> = {
  agriculture: 'rgba(239, 68, 68, 0.55)',
  coastal: 'rgba(239, 68, 68, 0.55)',
  flood: 'rgba(249, 115, 22, 0.55)',
  portfolio: 'rgba(168, 85, 247, 0.55)',
};

export function getZoneColors(mode: ZoneMode, temperature: number): ZoneColors {
  const tempRatio = Math.min(temperature / 3, 1);

  const baseColors: Record<string, { r: number; g: number; b: number }> = {
    agriculture: { r: 34, g: 197, b: 94 },
    coastal: { r: 20, g: 184, b: 166 },
    flood: { r: 59, g: 130, b: 246 },
    portfolio: { r: 168, g: 85, b: 247 },
  };

  const warningColor = { r: 245, g: 158, b: 11 };
  const dangerColor = { r: 239, g: 68, b: 68 };

  const base = baseColors[mode] || baseColors.agriculture;
  let target = warningColor;
  let ratio = tempRatio * 2;

  if (tempRatio > 0.5) {
    target = dangerColor;
    ratio = (tempRatio - 0.5) * 2;
  }

  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

  const r = lerp(base.r, target.r, ratio);
  const g = lerp(base.g, target.g, ratio);
  const b = lerp(base.b, target.b, ratio);

  return {
    fillColor: `rgb(${r}, ${g}, ${b})`,
    fillOpacity: 0.3 + tempRatio * 0.15,
    outlineColor: mode === 'agriculture' ? '#22c55e' : mode === 'coastal' ? '#14b8a6' : mode === 'portfolio' ? '#a855f7' : '#f97316',
    lossColor: LOSS_COLORS[mode] || LOSS_COLORS.agriculture,
    baselineOutlineColor: BASELINE_COLORS[mode] || BASELINE_COLORS.agriculture,
  };
}
