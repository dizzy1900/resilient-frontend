import { useMemo } from 'react';
import { Waves, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { StormSurgeChart } from './StormSurgeChart';
import { RiskBreakdownChart } from './RiskBreakdownChart';
import { RecommendationCard } from './RecommendationCard';
import {
  generateStormSurgeData,
  generateCoastalRiskFactors,
} from '@/utils/mockAnalyticsData';
import { generateCoastalRecommendations } from '@/utils/generateRecommendations';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CoastalAnalyticsProps {
  mangroveWidth: number;
  slope: number | null;
  stormWave: number | null;
  avoidedLoss: number;
  embedded?: boolean;
}

export const CoastalAnalytics = ({
  mangroveWidth,
  slope,
  stormWave,
  avoidedLoss,
  embedded = false,
}: CoastalAnalyticsProps) => {
  const stormSurgeData = useMemo(
    () => generateStormSurgeData(mangroveWidth),
    [mangroveWidth]
  );

  const riskFactors = useMemo(
    () => generateCoastalRiskFactors(slope, stormWave, mangroveWidth),
    [slope, stormWave, mangroveWidth]
  );

  const recommendations = useMemo(
    () =>
      generateCoastalRecommendations({
        mangroveWidth,
        slope,
        stormWave,
        riskFactors,
        avoidedLoss,
      }),
    [mangroveWidth, slope, stormWave, riskFactors, avoidedLoss]
  );

  const protectionEfficiency = useMemo(() => {
    const baseline = stormSurgeData[stormSurgeData.length - 1]?.baseline ?? 1;
    const protected_ = stormSurgeData[stormSurgeData.length - 1]?.withMangroves ?? 1;
    return Math.round((1 - protected_ / baseline) * 100);
  }, [stormSurgeData]);

  const content = (
    <div className={`space-y-6 ${embedded ? '' : 'pr-4'}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-medium text-white">Storm Surge Projection</h3>
          </div>
          <p className="text-xs text-white/50">
            Projected storm surge heights with and without mangrove protection
          </p>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <StormSurgeChart data={stormSurgeData} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-teal-500/10 rounded-xl p-4 border border-teal-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-white/60">Protection Rate</span>
            </div>
            <span className="text-2xl font-bold text-teal-400">{protectionEfficiency}%</span>
            <p className="text-[10px] text-white/40 mt-1">
              Storm surge reduction by 2050
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Waves className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/60">Mangrove Buffer</span>
            </div>
            <span className="text-2xl font-bold text-white">{mangroveWidth}m</span>
            <p className="text-[10px] text-white/40 mt-1">
              Current protection width
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white">Risk Factor Breakdown</h3>
          </div>
          <p className="text-xs text-white/50">
            Primary factors contributing to coastal vulnerability
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
            Actions to enhance coastal protection
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
