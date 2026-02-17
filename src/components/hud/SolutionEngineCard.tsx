import { Lightbulb, ArrowRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from '@/components/ui/button';

interface AdaptationStrategy {
  intervention_name: string;
  intervention_cost_usd: number;
  npv_improvement_usd: number;
  adaptation_roi_pct: number;
}

interface SolutionEngineCardProps {
  strategy: AdaptationStrategy | null;
}

const formatCurrency = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export const SolutionEngineCard = ({ strategy }: SolutionEngineCardProps) => {
  if (!strategy) return null;

  return (
    <GlassCard className="p-4 w-full space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Recommended Intervention</h3>
      </div>

      {/* Strategy Name */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <span className="text-[10px] text-white/50 uppercase tracking-wider">Strategy</span>
        <p className="text-base font-semibold text-white mt-1">🛡️ {strategy.intervention_name}</p>
      </div>

      {/* The Math */}
      <div className="space-y-2">
        {/* Cost */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/60">Cost to Implement</span>
          <span className="text-sm font-bold text-red-400 tabular-nums">
            {formatCurrency(strategy.intervention_cost_usd)}
          </span>
        </div>

        {/* Net Benefit */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/60">Net Benefit</span>
          <span className="text-sm font-bold text-emerald-400 tabular-nums">
            {formatCurrency(strategy.npv_improvement_usd)}
          </span>
        </div>

        {/* ROI */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/60">ROI</span>
          <span className="text-2xl font-bold text-emerald-400 tabular-nums">
            {strategy.adaptation_roi_pct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Simulate Button */}
      <Button
        className="w-full bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-500/30"
        onClick={() => {}}
      >
        Simulate Deployment
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </GlassCard>
  );
};
