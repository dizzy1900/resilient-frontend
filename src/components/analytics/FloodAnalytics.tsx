import { useMemo } from 'react';
import { Droplets, AlertTriangle, Lightbulb, TrendingDown, CheckCircle2 } from 'lucide-react';
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
}

export const FloodAnalytics = ({
  greenRoofsEnabled,
  permeablePavementEnabled,
  floodDepthReduction,
  valueProtected,
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

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-6 pr-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Drainage Capacity Analysis</h3>
          </div>
          <p className="text-xs text-white/50">
            Current capacity vs demand during heavy rainfall events
          </p>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <FloodCapacityChart data={capacityData} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">Depth Reduction</span>
            </div>
            <span className="text-2xl font-bold text-blue-400">
              {floodDepthReduction > 0 ? `-${floodDepthReduction}` : floodDepthReduction}cm
            </span>
            <p className="text-[10px] text-white/40 mt-1">
              Peak flood depth reduction
            </p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-white/60">Active Measures</span>
            </div>
            <span className="text-2xl font-bold text-emerald-400">
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white">Risk Factor Breakdown</h3>
          </div>
          <p className="text-xs text-white/50">
            Primary factors contributing to flood risk
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
            Actions to improve flood resilience
          </p>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
