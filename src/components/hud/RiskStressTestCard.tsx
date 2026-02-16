import { ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Progress } from '@/components/ui/progress';

interface MonteCarloData {
  metrics?: {
    npv_usd?: {
      mean?: number;
      std?: number;
      p5?: number;
      min?: number;
    };
  };
}

interface RiskStressTestCardProps {
  monteCarloData: MonteCarloData | null;
}

/** Derive VaR (95%) from NPV p5 percentile */
const getVaR95 = (mc: MonteCarloData): number => {
  return mc.metrics?.npv_usd?.p5 ?? 0;
};

/** Estimate default probability from NPV distribution (probability NPV < 0) */
const getDefaultProbability = (mc: MonteCarloData): number => {
  const mean = mc.metrics?.npv_usd?.mean ?? 0;
  const std = mc.metrics?.npv_usd?.std ?? 1;
  if (std === 0) return mean < 0 ? 100 : 0;
  // z-score for NPV = 0
  const z = -mean / std;
  // Approximate CDF using logistic approximation of normal CDF
  const prob = 1 / (1 + Math.exp(-1.7 * z));
  return Math.max(0, Math.min(100, prob * 100));
};

const formatCurrency = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const getDefaultProbColor = (prob: number) => {
  if (prob < 5) return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Low Risk' };
  if (prob < 20) return { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'Moderate' };
  return { bar: 'bg-red-500', text: 'text-red-400', label: 'High Risk' };
};

export const RiskStressTestCard = ({ monteCarloData }: RiskStressTestCardProps) => {
  if (!monteCarloData) return null;

  const var95 = getVaR95(monteCarloData);
  const defaultProb = getDefaultProbability(monteCarloData);
  const isVarNegative = var95 < 0;
  const probStyle = getDefaultProbColor(defaultProb);

  return (
    <GlassCard className="p-4 w-full space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white">Risk Stress Test</h3>
      </div>

      {/* VaR (95%) */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Value at Risk (95%)</span>
          {isVarNegative ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </div>
        <div className={`text-2xl font-bold tabular-nums ${isVarNegative ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatCurrency(var95)}
        </div>
        <span className={`text-[10px] ${isVarNegative ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
          {isVarNegative ? 'Potential Loss' : 'Positive Outlook'}
        </span>
      </div>

      {/* Default Probability */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Default Probability</span>
          <span className={`text-xs font-semibold ${probStyle.text}`}>
            {defaultProb.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${probStyle.bar}`}
            style={{ width: `${Math.min(defaultProb, 100)}%` }}
          />
        </div>
        <span className={`text-[10px] ${probStyle.text}`}>{probStyle.label}</span>
      </div>
    </GlassCard>
  );
};

export { getDefaultProbability };
