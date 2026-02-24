import { HeartPulse, AlertTriangle, Bug, Shield, Thermometer } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface HealthResults {
  productivity_loss_pct: number;
  economic_loss_daily: number;
  wbgt: number;
  projected_temp: number;
  malaria_risk: 'High' | 'Medium' | 'Low';
  dengue_risk: 'High' | 'Medium' | 'Low';
  workforce_size: number;
  daily_wage: number;
}

interface HealthResultsPanelProps {
  visible: boolean;
  isLoading: boolean;
  results?: HealthResults;
}

const riskColor = (risk: string) => {
  if (risk === 'High') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (risk === 'Medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
};

export const HealthResultsPanel = ({ visible, isLoading, results }: HealthResultsPanelProps) => {
  if (!visible && !isLoading) return null;

  if (isLoading) {
    return (
      <GlassCard className="w-full lg:w-80 p-3 sm:p-4 lg:p-5 animate-in slide-in-from-bottom lg:slide-in-from-right duration-300">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-400 animate-pulse" />
            <Skeleton className="h-5 w-32 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-40 bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
        </div>
      </GlassCard>
    );
  }

  if (!results) return null;

  const { productivity_loss_pct, economic_loss_daily, wbgt, projected_temp, malaria_risk, dengue_risk } = results;

  // Gauge color
  const gaugeColor = productivity_loss_pct >= 30
    ? 'from-red-500 to-red-400'
    : productivity_loss_pct >= 15
      ? 'from-amber-500 to-amber-400'
      : 'from-emerald-500 to-emerald-400';

  const gaugeTextColor = productivity_loss_pct >= 30
    ? 'text-red-400'
    : productivity_loss_pct >= 15
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <GlassCard className="w-full lg:w-80 p-3 sm:p-4 lg:p-5 border-rose-500/20 animate-in slide-in-from-bottom lg:slide-in-from-right duration-300 max-h-[70vh] overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none rounded-2xl" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-400" />
            <span className="text-sm lg:text-base font-semibold text-white">Heat Stress Analysis</span>
          </div>
          <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">
            WBGT {wbgt}°C
          </Badge>
        </div>

        {/* Productivity Loss Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] lg:text-xs text-white/50 flex items-center gap-1.5">
              <Thermometer className="w-3 h-3" />
              Labour Productivity Loss
            </span>
            <span className={cn('text-lg font-bold tabular-nums', gaugeTextColor)}>
              {productivity_loss_pct}%
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
            {/* Background gradient scale */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full" />
            <div
              className={cn('h-full rounded-full transition-all duration-700 bg-gradient-to-r', gaugeColor)}
              style={{ width: `${Math.min(productivity_loss_pct * 2, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/40">
            <span>0% (Safe)</span>
            <span>25%</span>
            <span>50% (Critical)</span>
          </div>
        </div>

        {/* Daily Economic Loss */}
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="text-[10px] text-white/50">Daily Economic Loss</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-red-400">
              -${economic_loss_daily.toLocaleString()}
            </span>
            <span className="text-xs text-white/40">/day</span>
          </div>
        </div>

        {/* Disease Vector Card */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-white/50">
            <Bug className="w-3.5 h-3.5" />
            <span>Disease Vector Risk</span>
          </div>

          {/* Malaria */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">Malaria Transmission Risk</span>
              <Badge className={cn('text-[10px] border', riskColor(malaria_risk))}>
                {malaria_risk === 'High' ? '🦟 Active Transmission' : malaria_risk === 'Medium' ? '⚠️ Moderate' : '✅ Low Risk'}
              </Badge>
            </div>
          </div>

          {/* Dengue */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">Dengue Fever Risk</span>
              <Badge className={cn('text-[10px] border', riskColor(dengue_risk))}>
                {dengue_risk === 'High' ? '🦟 High Risk' : dengue_risk === 'Medium' ? '⚠️ Moderate' : '✅ Low Risk'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Projected Temperature */}
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>Ambient Temperature</span>
          <span className="font-semibold text-white/80">{projected_temp}°C</span>
        </div>
      </div>
    </GlassCard>
  );
};
