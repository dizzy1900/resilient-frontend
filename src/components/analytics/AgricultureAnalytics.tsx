import { useMemo } from 'react';
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
  const rainfallData = useMemo(() => {
    if (chartData?.rainfall && chartData.rainfall.length > 0) {
      return chartData.rainfall;
    }
    return generateRainfallData(latitude, temperatureIncrease);
  }, [chartData, latitude, temperatureIncrease]);

  const soilMoistureData = useMemo(() => {
    if (chartData?.soilMoisture && chartData.soilMoisture.length > 0) {
      return chartData.soilMoisture.map(d => ({
        ...d,
        stressThreshold: 30,
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
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Rainfall Projection</span>
        <p className="text-[10px] text-white/40">
          Historical vs projected monthly rainfall at +{temperatureIncrease.toFixed(1)}°C warming
        </p>
        <div className="border border-white/10 p-3">
          <RainfallComparisonChart
            data={rainfallData}
            animateProjected={rainChange !== 0}
          />
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Soil Moisture Trend</span>
        <p className="text-[10px] text-white/40">
          Projected soil moisture levels throughout the year
        </p>
        <div className="border border-white/10 p-3">
          <SoilMoistureChart
            data={soilMoistureData.map(d => ({ month: d.month, moisture: d.moisture }))}
            wiltingPoint={0.20}
          />
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Risk Factor Breakdown</span>
        <p className="text-[10px] text-white/40">
          Primary factors contributing to agricultural risk
        </p>
        <div className="border border-white/10 p-4">
          <RiskBreakdownChart data={riskFactors} />
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Recommendations</span>
        <p className="text-[10px] text-white/40">
          Actions to improve resilience based on your risk profile
        </p>
        <div className="space-y-2">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      </div>

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
