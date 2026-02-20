import { Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrbanInundationCardProps {
  visible: boolean;
  isLoading?: boolean;
  floodedUrbanKm2: number | null;
  urbanImpactPct: number | null;
}

export const UrbanInundationCard = ({
  visible,
  isLoading,
  floodedUrbanKm2,
  urbanImpactPct,
}: UrbanInundationCardProps) => {
  if (!visible) return null;

  const isHighRisk = urbanImpactPct !== null && urbanImpactPct > 10;

  const formatArea = (area: number) => {
    return area.toFixed(2);
  };

  const formatPercent = (pct: number) => {
    return pct.toFixed(1);
  };

  return (
    <div
      className={cn(
        'bg-transparent rounded-none border p-3 shadow-none',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        isHighRisk ? 'border-red-500/50' : 'border-white/10'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-3.5 h-3.5 text-white/60" />
        <span className="text-xs font-medium text-white/70">
          Urban Area at Risk (5km Radius)
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-3 h-3 text-white/50 animate-spin" />
          <span className="text-[10px] text-white/50">Calculating impact...</span>
        </div>
      )}

      {/* Data display */}
      {!isLoading && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/50">Inundated City Area</span>
            <span className="text-xs font-semibold text-white tabular-nums">
              {floodedUrbanKm2 !== null ? `${formatArea(floodedUrbanKm2)} km²` : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/50">% of Built Environment</span>
            <span className={cn(
              'text-xs font-semibold tabular-nums',
              isHighRisk ? 'text-red-400' : 'text-white'
            )}>
              {urbanImpactPct !== null ? `${formatPercent(urbanImpactPct)}%` : '—'}
            </span>
          </div>

          {/* Warning for high impact */}
          {isHighRisk && (
            <>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-medium text-red-400">
                  Significant Infrastructure Loss
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
