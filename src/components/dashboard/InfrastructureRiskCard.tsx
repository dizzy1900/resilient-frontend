import { Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfrastructureRiskCardProps {
  visible: boolean;
  isLoading?: boolean;
  floodedKm2: number | null;
  riskPct: number | null;
}

export const InfrastructureRiskCard = ({
  visible,
  isLoading,
  floodedKm2,
  riskPct,
}: InfrastructureRiskCardProps) => {
  if (!visible) return null;

  const isCritical = riskPct !== null && riskPct > 15;

  const formatArea = (area: number) => area.toFixed(2);
  const formatPercent = (pct: number) => pct.toFixed(1);

  return (
    <div
      className={cn(
        'bg-black/60 backdrop-blur-xl rounded-xl border p-3 shadow-2xl',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        isCritical ? 'border-red-500/50' : 'border-white/10'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-3.5 h-3.5 text-white/60" />
        <span className="text-xs font-medium text-white/70">
          Infrastructure at Risk (50km Radius)
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-3 h-3 text-white/50 animate-spin" />
          <span className="text-[10px] text-white/50">Calculating risk...</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/50">Flooded Urban Area</span>
            <span className="text-xs font-semibold text-white tabular-nums">
              {floodedKm2 !== null ? `${formatArea(floodedKm2)} km²` : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/50">% of Built Environment</span>
            <span className={cn(
              'text-xs font-semibold tabular-nums',
              isCritical ? 'text-red-400' : 'text-white'
            )}>
              {riskPct !== null ? `${formatPercent(riskPct)}%` : '—'}
            </span>
          </div>

          {isCritical && (
            <>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-medium text-red-400">
                  ⚠️ Critical Exposure
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
