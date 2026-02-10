import { useMemo } from 'react';
import { CloudRain, Droplets, AlertTriangle, Lightbulb } from 'lucide-react';
import { RainfallComparisonChart, RainfallChartData } from './RainfallComparisonChart';
import { SoilMoistureChart, SoilMoistureChartData } from './SoilMoistureChart';
import { RiskBreakdownChart } from './RiskBreakdownChart';
import { RecommendationCard } from './RecommendationCard';
import {
  generateRainfallData,
  generateSoilMoistureData,
  generateAgricultureRiskFactors,
} from '@/utils/mockAnalyticsData';
import { generateAgricultureRecommendations } from '@/utils/generateRecommendations';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SupplyChainRiskSection } from './SupplyChainRiskSection';

export interface ApiChartData {
  rainfall: RainfallChartData[];
  soilMoisture: SoilMoistureChartData[];
}

interface AgricultureAnalyticsProps {
  latitude: number;
  temperatureIncrease: number;
  cropType: string;
  embedded?: boolean;
  chartData?: ApiChartData | null;
  rainChange?: number;
  portfolioVolatilityPct?: number | null;
  adaptationActive?: boolean;
  adaptedVolatilityPct?: number | null;
}

export const AgricultureAnalytics = ({
  latitude,
  temperatureIncrease,
  cropType,
  embedded = false,
  chartData = null,
  rainChange = 0,
  portfolioVolatilityPct = null,
  adaptationActive = false,
  adaptedVolatilityPct = null,
}: AgricultureAnalyticsProps) => {
  // Use API data if available, otherwise generate mock data
  const rainfallData = useMemo(() => {
    if (chartData?.rainfall && chartData.rainfall.length > 0) {
      return chartData.rainfall;
    }
    return generateRainfallData(latitude, temperatureIncrease);
  }, [chartData, latitude, temperatureIncrease]);

  const soilMoistureData = useMemo(() => {
    if (chartData?.soilMoisture && chartData.soilMoisture.length > 0) {
      // Convert to the format expected by generateAgricultureRiskFactors
      return chartData.soilMoisture.map(d => ({
        ...d,
        stressThreshold: 30, // Default stress threshold for mock compatibility
      }));
    }
    return generateSoilMoistureData(latitude, temperatureIncrease);
  }, [chartData, latitude, temperatureIncrease]);

  const riskFactors = useMemo(
    () => generateAgricultureRiskFactors(temperatureIncrease, soilMoistureData),
    [temperatureIncrease, soilMoistureData]
  );

  const recommendations = useMemo(
    () =>
      generateAgricultureRecommendations({
        temperatureIncrease,
        riskFactors,
        soilMoistureData,
        cropType,
      }),
    [temperatureIncrease, riskFactors, soilMoistureData, cropType]
  );

  const content = (
    <div className="space-y-6">
      <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Rainfall Projection</h3>
          </div>
          <p className="text-xs text-white/50">
            Historical vs projected monthly rainfall at +{temperatureIncrease.toFixed(1)}°C warming
          </p>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <RainfallComparisonChart 
              data={rainfallData} 
              animateProjected={rainChange !== 0}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium text-white">Soil Moisture Trend</h3>
          </div>
          <p className="text-xs text-white/50">
            Projected soil moisture levels throughout the year
          </p>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <SoilMoistureChart 
              data={soilMoistureData.map(d => ({ month: d.month, moisture: d.moisture }))} 
              wiltingPoint={0.20}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white">Risk Factor Breakdown</h3>
          </div>
          <p className="text-xs text-white/50">
            Primary factors contributing to agricultural risk
          </p>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <RiskBreakdownChart data={riskFactors} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white">Recommendations</h3>
          </div>
          <p className="text-xs text-white/50">
            Actions to improve resilience based on your risk profile
          </p>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
        {/* Supply Chain Risk */}
        {portfolioVolatilityPct !== null && portfolioVolatilityPct !== undefined && (
          <SupplyChainRiskSection
            portfolioVolatilityPct={portfolioVolatilityPct}
            adaptationActive={adaptationActive}
            adaptedVolatilityPct={adaptedVolatilityPct ?? undefined}
          />
        )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="pr-4">
        {content}
      </div>
    </ScrollArea>
  );
};
