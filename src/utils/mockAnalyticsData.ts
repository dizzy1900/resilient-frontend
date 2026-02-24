import { DashboardMode } from '@/components/dashboard/ModeSelector';

export interface RainfallData {
  month: string;
  historical: number;
  projected: number;
}

export interface SoilMoistureData {
  month: string;
  moisture: number;
  stressThreshold: number;
}

export interface RiskFactor {
  name: string;
  percentage: number;
  color: string;
}

export interface StormSurgeData {
  year: string;
  baseline: number;
  withMangroves: number;
}

export interface FloodCapacityData {
  category: string;
  capacity: number;
  demand: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function generateRainfallData(
  latitude: number,
  temperatureIncrease: number
): RainfallData[] {
  const seed = Math.abs(Math.floor(latitude * 1000));
  const random = seededRandom(seed);

  const isTropical = Math.abs(latitude) < 23.5;
  const baseRainfall = isTropical ? 180 : 80;
  const seasonalVariation = isTropical ? 0.4 : 0.6;

  return MONTHS.map((month, index) => {
    const seasonalFactor = Math.sin((index / 12) * Math.PI * 2 - Math.PI / 2) * seasonalVariation + 1;
    const historical = Math.round(baseRainfall * seasonalFactor * (0.8 + random() * 0.4));
    const projectionMultiplier = 1 + (temperatureIncrease * 0.12) + (random() * 0.1 - 0.05);
    const projected = Math.round(historical * projectionMultiplier);

    return { month, historical, projected };
  });
}

export function generateSoilMoistureData(
  latitude: number,
  temperatureIncrease: number
): SoilMoistureData[] {
  const seed = Math.abs(Math.floor(latitude * 1000)) + 500;
  const random = seededRandom(seed);

  const isTropical = Math.abs(latitude) < 23.5;
  const baseMoisture = isTropical ? 55 : 45;
  const stressThreshold = 30;

  return MONTHS.map((month, index) => {
    const seasonalFactor = Math.cos((index / 12) * Math.PI * 2) * 0.3;
    const temperatureImpact = temperatureIncrease * 4;
    const moisture = Math.max(
      15,
      Math.min(
        80,
        baseMoisture + seasonalFactor * 20 - temperatureImpact + (random() * 10 - 5)
      )
    );

    return {
      month,
      moisture: Math.round(moisture),
      stressThreshold,
    };
  });
}

export function generateAgricultureRiskFactors(
  temperatureIncrease: number,
  soilMoistureData: SoilMoistureData[]
): RiskFactor[] {
  const avgMoisture = soilMoistureData.reduce((sum, d) => sum + d.moisture, 0) / 12;
  const droughtMonths = soilMoistureData.filter(d => d.moisture < d.stressThreshold).length;

  const heatStress = Math.min(40, Math.round(temperatureIncrease * 12 + 5));
  const droughtRisk = Math.min(45, Math.round(droughtMonths * 4 + (50 - avgMoisture) * 0.5));
  const pestPressure = Math.min(25, Math.round(temperatureIncrease * 5 + 10));
  const soilDegradation = Math.max(5, 100 - heatStress - droughtRisk - pestPressure);

  return [
    { name: 'Drought Risk', percentage: droughtRisk, color: '#f59e0b' },
    { name: 'Heat Stress', percentage: heatStress, color: '#ef4444' },
    { name: 'Pest Pressure', percentage: pestPressure, color: '#8b5cf6' },
    { name: 'Soil Degradation', percentage: soilDegradation, color: '#6b7280' },
  ].sort((a, b) => b.percentage - a.percentage);
}

export function generateStormSurgeData(
  mangroveWidth: number
): StormSurgeData[] {
  const years = ['2025', '2030', '2035', '2040', '2045', '2050'];
  const baseIncrease = 0.08;

  return years.map((year, index) => {
    const baseline = 1.2 + index * baseIncrease + (index * index * 0.01);
    const reductionFactor = Math.min(0.6, mangroveWidth / 500);
    const withMangroves = baseline * (1 - reductionFactor);

    return {
      year,
      baseline: Math.round(baseline * 100) / 100,
      withMangroves: Math.round(withMangroves * 100) / 100,
    };
  });
}

export function generateCoastalRiskFactors(
  slope: number | null,
  stormWave: number | null,
  mangroveWidth: number
): RiskFactor[] {
  const slopeRisk = slope !== null ? Math.min(40, Math.round((10 - slope) * 4)) : 25;
  const waveRisk = stormWave !== null ? Math.min(35, Math.round(stormWave * 8)) : 30;
  const erosionRisk = Math.max(15, Math.round(40 - mangroveWidth / 10));
  const remaining = Math.max(10, 100 - slopeRisk - waveRisk - erosionRisk);

  return [
    { name: 'Erosion', percentage: erosionRisk, color: '#f59e0b' },
    { name: 'Storm Surge', percentage: slopeRisk, color: '#3b82f6' },
    { name: 'Wave Impact', percentage: waveRisk, color: '#06b6d4' },
    { name: 'Sea Level Rise', percentage: remaining, color: '#6b7280' },
  ].sort((a, b) => b.percentage - a.percentage);
}

export function generateFloodCapacityData(
  greenRoofsEnabled: boolean,
  permeablePavementEnabled: boolean
): FloodCapacityData[] {
  const baseCapacity = 100;
  const greenRoofBonus = greenRoofsEnabled ? 25 : 0;
  const pavementBonus = permeablePavementEnabled ? 20 : 0;

  return [
    {
      category: 'Surface Runoff',
      capacity: baseCapacity + greenRoofBonus + pavementBonus,
      demand: 140,
    },
    {
      category: 'Drainage System',
      capacity: baseCapacity + Math.round(pavementBonus * 0.5),
      demand: 120,
    },
    {
      category: 'Soil Absorption',
      capacity: baseCapacity + Math.round(pavementBonus * 1.5),
      demand: 110,
    },
    {
      category: 'Retention Basins',
      capacity: baseCapacity + Math.round(greenRoofBonus * 0.8),
      demand: 95,
    },
  ];
}

export function generateFloodRiskFactors(
  greenRoofsEnabled: boolean,
  permeablePavementEnabled: boolean
): RiskFactor[] {
  const baseRunoff = 45;
  const baseDrainage = 30;
  const baseSaturation = 25;

  const runoffReduction = (greenRoofsEnabled ? 10 : 0) + (permeablePavementEnabled ? 8 : 0);
  const drainageReduction = permeablePavementEnabled ? 5 : 0;

  const surfaceRunoff = Math.max(20, baseRunoff - runoffReduction);
  const drainageCapacity = Math.max(20, baseDrainage - drainageReduction);
  const soilSaturation = baseSaturation;

  return [
    { name: 'Surface Runoff', percentage: surfaceRunoff, color: '#3b82f6' },
    { name: 'Drainage Capacity', percentage: drainageCapacity, color: '#06b6d4' },
    { name: 'Soil Saturation', percentage: soilSaturation, color: '#6b7280' },
  ].sort((a, b) => b.percentage - a.percentage);
}

export function generateYieldComparisonData(
  yieldBaseline: number,
  yieldResilient: number,
  temperatureIncrease: number
): { scenario: string; yield: number; color: string }[] {
  const projectedBaseline = yieldBaseline * (1 - temperatureIncrease * 0.08);
  const projectedResilient = yieldResilient * (1 - temperatureIncrease * 0.03);

  return [
    { scenario: 'Current Baseline', yield: Math.round(yieldBaseline * 100) / 100, color: '#6b7280' },
    { scenario: 'Projected Baseline', yield: Math.round(projectedBaseline * 100) / 100, color: '#ef4444' },
    { scenario: 'With Resilient Seeds', yield: Math.round(projectedResilient * 100) / 100, color: '#10b981' },
  ];
}

export function calculateResilienceScore(
  mode: DashboardMode,
  riskFactors: RiskFactor[],
  avoidedLoss: number,
  maxPotentialLoss: number
): number {
  const riskWeight = riskFactors.reduce((sum, factor) => {
    const weight = factor.percentage / 100;
    return sum + weight * (factor.name.includes('Heat') || factor.name.includes('Storm') ? 1.2 : 1);
  }, 0);

  const protectionRatio = maxPotentialLoss > 0 ? avoidedLoss / maxPotentialLoss : 0.5;
  const baseScore = (1 - riskWeight / riskFactors.length) * 50 + protectionRatio * 50;

  return Math.round(Math.min(100, Math.max(0, baseScore)));
}
