import { useMemo } from 'react';
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
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Storm Surge Projection</span>
        <p className="text-[10px] text-white/40">
          Projected storm surge heights with and without mangrove protection
        </p>
        <div className="border border-white/10 p-3">
          <StormSurgeChart data={stormSurgeData} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-teal-500/20 p-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">Protection Rate</span>
          <span className="text-4xl font-light tracking-tighter text-teal-400">{protectionEfficiency}%</span>
          <p className="text-[10px] text-white/40 mt-1">
            Storm surge reduction by 2050
          </p>
        </div>
        <div className="border border-white/10 p-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">Mangrove Buffer</span>
          <span className="text-4xl font-light tracking-tighter text-white">{mangroveWidth}m</span>
          <p className="text-[10px] text-white/40 mt-1">
            Current protection width
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Risk Factor Breakdown</span>
        <p className="text-[10px] text-white/40">
          Primary factors contributing to coastal vulnerability
        </p>
        <div className="border border-white/10 p-4">
          <RiskBreakdownChart data={riskFactors} />
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Recommendations</span>
        <p className="text-[10px] text-white/40">
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
      <div className="pr-4">
        {content}
      </div>
    </ScrollArea>
  );
};
