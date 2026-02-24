import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { RiskFactor, SoilMoistureData } from './mockAnalyticsData';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  priority: RecommendationPriority;
  icon: 'seed' | 'water' | 'shield' | 'leaf' | 'building' | 'waves' | 'tree' | 'drain';
}

interface AgricultureContext {
  temperatureIncrease: number;
  riskFactors: RiskFactor[];
  soilMoistureData: SoilMoistureData[];
  cropType: string;
}

interface CoastalContext {
  mangroveWidth: number;
  slope: number | null;
  stormWave: number | null;
  riskFactors: RiskFactor[];
  avoidedLoss: number;
}

interface FloodContext {
  greenRoofsEnabled: boolean;
  permeablePavementEnabled: boolean;
  riskFactors: RiskFactor[];
  floodDepthReduction: number;
}

export function generateAgricultureRecommendations(context: AgricultureContext): Recommendation[] {
  const { temperatureIncrease, riskFactors, soilMoistureData, cropType } = context;
  const recommendations: Recommendation[] = [];

  const heatStressFactor = riskFactors.find(f => f.name === 'Heat Stress');
  const droughtFactor = riskFactors.find(f => f.name === 'Drought Risk');
  const pestFactor = riskFactors.find(f => f.name === 'Pest Pressure');

  const droughtMonths = soilMoistureData.filter(d => d.moisture < d.stressThreshold).length;

  if (temperatureIncrease >= 2.0 || (heatStressFactor && heatStressFactor.percentage > 25)) {
    recommendations.push({
      id: 'heat-resistant-varieties',
      title: 'Switch to Heat-Resistant Varieties',
      description: `Your projected temperature increase of +${temperatureIncrease}°C puts ${cropType} at significant heat stress risk. Heat-tolerant varieties can maintain yields under thermal stress.`,
      impact: '15-25% yield protection',
      priority: 'high',
      icon: 'seed',
    });
  }

  if (droughtMonths >= 3 || (droughtFactor && droughtFactor.percentage > 30)) {
    recommendations.push({
      id: 'irrigation-scheduling',
      title: 'Implement Smart Irrigation',
      description: `${droughtMonths} months show soil moisture below critical thresholds. Precision irrigation with soil moisture sensors can optimize water use during dry periods.`,
      impact: '20-30% water savings',
      priority: 'high',
      icon: 'water',
    });
  }

  if (temperatureIncrease >= 1.5) {
    recommendations.push({
      id: 'cover-crops',
      title: 'Plant Cover Crops',
      description: 'Cover crops between main seasons improve soil health, reduce erosion, and increase water retention capacity during variable rainfall patterns.',
      impact: '10-15% soil health improvement',
      priority: temperatureIncrease >= 2.5 ? 'high' : 'medium',
      icon: 'leaf',
    });
  }

  if (pestFactor && pestFactor.percentage > 15) {
    recommendations.push({
      id: 'integrated-pest-management',
      title: 'Adopt Integrated Pest Management',
      description: 'Warmer temperatures accelerate pest life cycles. IPM strategies combining biological controls with targeted interventions reduce crop damage sustainably.',
      impact: '8-12% reduced pest losses',
      priority: pestFactor.percentage > 20 ? 'high' : 'medium',
      icon: 'shield',
    });
  }

  if (droughtFactor && droughtFactor.percentage > 20) {
    recommendations.push({
      id: 'mulching',
      title: 'Apply Organic Mulching',
      description: 'Mulching reduces soil evaporation by up to 70% and moderates soil temperature, protecting roots during heat events.',
      impact: '25-35% moisture retention',
      priority: 'medium',
      icon: 'leaf',
    });
  }

  recommendations.push({
    id: 'crop-rotation',
    title: 'Diversify Crop Rotation',
    description: `Rotating ${cropType} with nitrogen-fixing legumes improves soil resilience and breaks pest cycles amplified by climate change.`,
    impact: '5-10% long-term yield stability',
    priority: 'low',
    icon: 'seed',
  });

  return recommendations.slice(0, 5);
}

export function generateCoastalRecommendations(context: CoastalContext): Recommendation[] {
  const { mangroveWidth, slope, stormWave, riskFactors, avoidedLoss } = context;
  const recommendations: Recommendation[] = [];

  const erosionFactor = riskFactors.find(f => f.name === 'Erosion');
  const stormSurgeFactor = riskFactors.find(f => f.name === 'Storm Surge');

  if (mangroveWidth < 200) {
    const recommendedWidth = Math.min(300, mangroveWidth + 100);
    const additionalProtection = Math.round((recommendedWidth - mangroveWidth) * 2000);

    recommendations.push({
      id: 'expand-mangroves',
      title: 'Expand Mangrove Buffer',
      description: `Increasing mangrove width from ${mangroveWidth}m to ${recommendedWidth}m would significantly enhance wave attenuation and storm surge protection.`,
      impact: `+$${(additionalProtection / 1000).toFixed(0)}K additional protection`,
      priority: 'high',
      icon: 'tree',
    });
  }

  if (erosionFactor && erosionFactor.percentage > 25) {
    recommendations.push({
      id: 'erosion-control',
      title: 'Install Living Shoreline',
      description: 'Combining mangroves with oyster reefs and native vegetation creates a multi-layered defense against erosion while supporting biodiversity.',
      impact: '40-60% erosion reduction',
      priority: 'high',
      icon: 'waves',
    });
  }

  if (stormWave !== null && stormWave > 2.5) {
    recommendations.push({
      id: 'breakwater-assessment',
      title: 'Consider Hybrid Breakwaters',
      description: `Storm waves of ${stormWave.toFixed(1)}m pose significant risk. Submerged breakwaters combined with mangroves provide layered protection against extreme events.`,
      impact: '30-50% wave energy reduction',
      priority: stormWave > 3.5 ? 'high' : 'medium',
      icon: 'shield',
    });
  }

  if (slope !== null && slope < 3) {
    recommendations.push({
      id: 'setback-planning',
      title: 'Review Building Setbacks',
      description: `Low slope of ${slope.toFixed(1)}% increases flood intrusion distance. Consider relocating or elevating structures within 100m of the coastline.`,
      impact: 'Significant long-term protection',
      priority: 'medium',
      icon: 'building',
    });
  }

  if (stormSurgeFactor && stormSurgeFactor.percentage > 20) {
    recommendations.push({
      id: 'early-warning',
      title: 'Establish Early Warning System',
      description: 'Community-based early warning systems combined with evacuation planning reduce human risk during extreme storm events.',
      impact: 'Critical safety improvement',
      priority: 'medium',
      icon: 'shield',
    });
  }

  recommendations.push({
    id: 'mangrove-maintenance',
    title: 'Monitor Mangrove Health',
    description: 'Regular monitoring of mangrove density and health ensures sustained protection. Address any degradation promptly to maintain defense capacity.',
    impact: 'Sustained protection value',
    priority: 'low',
    icon: 'tree',
  });

  return recommendations.slice(0, 5);
}

export function generateFloodRecommendations(context: FloodContext): Recommendation[] {
  const { greenRoofsEnabled, permeablePavementEnabled, riskFactors, floodDepthReduction } = context;
  const recommendations: Recommendation[] = [];

  const runoffFactor = riskFactors.find(f => f.name === 'Surface Runoff');
  const drainageFactor = riskFactors.find(f => f.name === 'Drainage Capacity');

  if (!greenRoofsEnabled) {
    recommendations.push({
      id: 'green-roofs',
      title: 'Install Green Roofs',
      description: 'Green roofs absorb rainfall at the source, reducing stormwater runoff by 40-60% and providing additional insulation benefits.',
      impact: '6-10cm flood depth reduction',
      priority: 'high',
      icon: 'leaf',
    });
  }

  if (!permeablePavementEnabled) {
    recommendations.push({
      id: 'permeable-pavement',
      title: 'Convert to Permeable Pavement',
      description: 'Replacing impervious surfaces with permeable pavement allows water infiltration, reducing runoff volume and recharging groundwater.',
      impact: '4-8cm flood depth reduction',
      priority: 'high',
      icon: 'drain',
    });
  }

  if (runoffFactor && runoffFactor.percentage > 35) {
    recommendations.push({
      id: 'rain-gardens',
      title: 'Create Rain Gardens',
      description: 'Strategically placed rain gardens capture and filter stormwater, reducing peak flows to drainage systems during heavy rainfall.',
      impact: '15-25% local runoff reduction',
      priority: runoffFactor.percentage > 40 ? 'high' : 'medium',
      icon: 'leaf',
    });
  }

  if (drainageFactor && drainageFactor.percentage > 25) {
    recommendations.push({
      id: 'bioswales',
      title: 'Install Bioswales',
      description: 'Vegetated channels along roads and parking areas slow and filter stormwater while directing it away from vulnerable structures.',
      impact: '20-30% drainage improvement',
      priority: 'medium',
      icon: 'water',
    });
  }

  if (greenRoofsEnabled && permeablePavementEnabled && floodDepthReduction < 15) {
    recommendations.push({
      id: 'detention-basins',
      title: 'Add Underground Detention',
      description: 'Underground detention basins store excess stormwater during peak events and release it slowly, preventing downstream flooding.',
      impact: '5-10cm additional reduction',
      priority: 'medium',
      icon: 'drain',
    });
  }

  if (floodDepthReduction > 0) {
    recommendations.push({
      id: 'maintenance-program',
      title: 'Establish Maintenance Program',
      description: 'Regular maintenance of green infrastructure ensures continued performance. Schedule seasonal inspections and debris removal.',
      impact: 'Sustained effectiveness',
      priority: 'low',
      icon: 'shield',
    });
  }

  recommendations.push({
    id: 'flood-insurance',
    title: 'Review Flood Insurance Coverage',
    description: 'With implemented interventions, you may qualify for reduced flood insurance premiums. Document all improvements for insurers.',
    impact: 'Potential premium savings',
    priority: 'low',
    icon: 'shield',
  });

  return recommendations.slice(0, 5);
}

export function generateRecommendations(
  mode: DashboardMode,
  context: AgricultureContext | CoastalContext | FloodContext
): Recommendation[] {
  switch (mode) {
    case 'agriculture':
      return generateAgricultureRecommendations(context as AgricultureContext);
    case 'coastal':
      return generateCoastalRecommendations(context as CoastalContext);
    case 'flood':
      return generateFloodRecommendations(context as FloodContext);
    default:
      return [];
  }
}
