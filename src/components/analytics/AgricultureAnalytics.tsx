import { useMemo } from 'react';
import { CloudRain, Droplets, AlertTriangle, Lightbulb } from 'lucide-react';
import { RainfallComparisonChart } from './RainfallComparisonChart';
import { SoilMoistureChart } from './SoilMoistureChart';
import { RiskBreakdownChart } from './RiskBreakdownChart';
import { RecommendationCard } from './RecommendationCard';
import {
  generateRainfallData,
  generateSoilMoistureData,
  generateAgricultureRiskFactors,
} from '@/utils/mockAnalyticsData';
import { generateAgricultureRecommendations } from '@/utils/generateRecommendations';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgricultureAnalyticsProps {
  latitude: number;
  temperatureIncrease: number;
  cropType: string;
  embedded?: boolean;
}

export const AgricultureAnalytics = ({
  latitude,
  temperatureIncrease,
  cropType,
  embedded = false,
}: AgricultureAnalyticsProps) => {
  const rainfallData = useMemo(
    () => generateRainfallData(latitude, temperatureIncrease),
    [latitude, temperatureIncrease]
  );

  const soilMoistureData = useMemo(
    () => generateSoilMoistureData(latitude, temperatureIncrease),
    [latitude, temperatureIncrease]
  );

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
    <div className={`space-y-6 ${embedded ? '' : 'pr-4'}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Rainfall Projection</h3>
          </div>
          <p className="text-xs text-white/50">
            Historical vs projected monthly rainfall at +{temperatureIncrease}°C warming
          </p>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <RainfallComparisonChart data={rainfallData} />
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
            <SoilMoistureChart data={soilMoistureData} />
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
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      {content}
    </ScrollArea>
  );
};
