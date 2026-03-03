import { create } from 'zustand';

/**
 * Scenario parameters store for the Digital Twin "SCENARIO" tab.
 * Mirrors the baseline simulation parameters so users can configure
 * an alternative future scenario independently.
 */

export interface ScenarioParams {
  // Agriculture
  cropType: string;
  globalTempTarget: number;
  rainChange: number;
  currentCrop: string;
  proposedCrop: string;

  // Coastal
  mangroveWidth: number;
  propertyValue: number;
  totalSLR: number;
  includeStormSurge: boolean;
  coastalSelectedYear: number;
  seaWallEnabled: boolean;

  // Flood
  buildingValue: number;
  greenRoofsEnabled: boolean;
  permeablePavementEnabled: boolean;
  totalRainIntensity: number;
  floodSelectedYear: number;
  drainageEnabled: boolean;

  // Health
  healthTempTarget: number;
  healthSelectedYear: number;
  healthIntervention: 'none' | 'hvac_retrofit' | 'passive_cooling' | 'urban_cooling_center' | 'mosquito_eradication' | 'hospital_expansion';
  workforceSize: number;
  averageDailyWage: number;
  populationSize: number;
  gdpPerCapita: number;
  coolingCapex: number;
  coolingOpex: number;
  economyTier: string;
  customBedsPer1000: number | null;

  // Shared
  assetLifespan: number;
  dailyRevenue: number;
  expectedDowntimeDays: number;
  baseAnnualOpex: number;
}

interface ScenarioStore {
  params: ScenarioParams;
  /** Replace all params at once (e.g. clone from baseline). */
  setParams: (p: ScenarioParams) => void;
  /** Patch individual fields. */
  patch: (partial: Partial<ScenarioParams>) => void;
}

const DEFAULTS: ScenarioParams = {
  cropType: 'maize',
  globalTempTarget: 1.4,
  rainChange: 0,
  currentCrop: 'Maize',
  proposedCrop: 'None',
  mangroveWidth: 100,
  propertyValue: 5_000_000,
  totalSLR: 0.10,
  includeStormSurge: false,
  coastalSelectedYear: 2026,
  seaWallEnabled: false,
  buildingValue: 5_000_000,
  greenRoofsEnabled: false,
  permeablePavementEnabled: false,
  totalRainIntensity: 9,
  floodSelectedYear: 2026,
  drainageEnabled: false,
  healthTempTarget: 1.4,
  healthSelectedYear: 2026,
  healthIntervention: 'none',
  workforceSize: 100,
  averageDailyWage: 15,
  populationSize: 100_000,
  gdpPerCapita: 8500,
  coolingCapex: 150_000,
  coolingOpex: 15_000,
  economyTier: 'middle',
  customBedsPer1000: null,
  assetLifespan: 30,
  dailyRevenue: 20_000,
  expectedDowntimeDays: 14,
  baseAnnualOpex: 25_000,
};

export const useScenarioStore = create<ScenarioStore>((set) => ({
  params: { ...DEFAULTS },
  setParams: (p) => set({ params: { ...p } }),
  patch: (partial) => set((s) => ({ params: { ...s.params, ...partial } })),
}));
