import { useMemo } from 'react';
import { FloodCapacityChart } from './FloodCapacityChart';
import { RiskBreakdownChart } from './RiskBreakdownChart';
import { RecommendationCard } from './RecommendationCard';
import {
  generateFloodCapacityData,
  generateFloodRiskFactors,
} from '@/utils/mockAnalyticsData';
import { generateFloodRecommendations } from '@/utils/generateRecommendations';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FloodAnalyticsProps {
  greenRoofsEnabled: boolean;
  permeablePavementEnabled: boolean;
  floodDepthReduction: number;
  valueProtected: number;
  embedded?: boolean;
}

export const FloodAnalytics = ({
  greenRoofsEnabled,
  permeablePavementEnabled,
  floodDepthReduction,
  valueProtected,
  embedded = false,
}: FloodAnalyticsProps) => {
  const capacityData = useMemo(
    () => generateFloodCapacityData(greenRoofsEnabled, permeablePavementEnabled),
    [greenRoofsEnabled, permeablePavementEnabled]
  );

  const riskFactors = useMemo(
    () => generateFloodRiskFactors(greenRoofsEnabled, permeablePavementEnabled),
    [greenRoofsEnabled, permeablePavementEnabled]
  );

  const recommendations = useMemo(
    () =>
      generateFloodRecommendations({
        greenRoofsEnabled,
        permeablePavementEnabled,
        riskFactors,
        floodDepthReduction,
      }),
    [greenRoofsEnabled, permeablePavementEnabled, riskFactors, floodDepthReduction]
  );

  const activeInterventions = [
    greenRoofsEnabled && 'Green Roofs',
    permeablePavementEnabled && 'Permeable Pavement',
  ].filter(Boolean);

  const content = (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Drainage Capacity Analysis</span>
        <p className="text-[10px] text-white/40">
          Current capacity vs demand during heavy rainfall events
        </p>
        <div className="border border-white/10 p-3">
          <FloodCapacityChart data={capacityData} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-blue-500/20 p-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">Depth Reduction</span>
          <span className="text-4xl font-light tracking-tighter text-blue-400">
            {floodDepthReduction > 0 ? `-${floodDepthReduction}` : floodDepthReduction}cm
          </span>
          <p className="text-[10px] text-white/40 mt-1">
            Peak flood depth reduction
          </p>
        </div>
        <div className="border border-emerald-500/20 p-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">Active Measures</span>
          <span className="text-4xl font-light tracking-tighter text-emerald-400">
            {activeInterventions.length}
          </span>
          <p className="text-[10px] text-white/40 mt-1">
            {activeInterventions.length > 0
              ? activeInterventions.join(', ')
              : 'No interventions active'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Risk Factor Breakdown</span>
        <p className="text-[10px] text-white/40">
          Primary factors contributing to flood risk
        </p>
        <div className="border border-white/10 p-4">
          <RiskBreakdownChart data={riskFactors} />
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Recommendations</span>
        <p className="text-[10px] text-white/40">
          Actions to improve flood resilience
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
