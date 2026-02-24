import { TrendingDown, TrendingUp, MapPin, Loader2 } from 'lucide-react';
import { Polygon, calculatePolygonArea } from '@/utils/polygonMath';
import { ZoneMode } from '@/utils/zoneGeneration';
import { cn } from '@/lib/utils';

interface SpatialAnalysisData {
  baseline_sq_km: number;
  future_sq_km: number;
  loss_pct: number;
}

interface ZoneLegendProps {
  baselineZone: Polygon | null;
  currentZone: Polygon | null;
  mode: ZoneMode;
  temperature: number;
  visible: boolean;
  spatialAnalysis?: SpatialAnalysisData | null;
  isSpatialLoading?: boolean;
}

const modeLabels = {
  agriculture: {
    label: 'Viable Growing Area',
    shrinkLabel: 'Lost',
    expandLabel: 'Gained',
  },
  coastal: {
    label: 'Safe Zone',
    shrinkLabel: 'At Risk',
    expandLabel: 'Protected',
  },
  flood: {
    label: 'Flood Risk Zone',
    shrinkLabel: 'Reduced',
    expandLabel: 'Expanded',
  },
  health: {
    label: 'Health Risk Zone',
    shrinkLabel: 'Reduced',
    expandLabel: 'Expanded',
  },
  portfolio: {
    label: 'Portfolio Zone',
    shrinkLabel: 'Reduced',
    expandLabel: 'Expanded',
  },
};

export const ZoneLegend = ({
  baselineZone,
  currentZone,
  mode,
  temperature,
  visible,
  spatialAnalysis,
  isSpatialLoading,
}: ZoneLegendProps) => {
  if (!visible || !baselineZone || !currentZone) return null;

  const labels = modeLabels[mode];
  const isAgriculture = mode === 'agriculture';

  // Use API data for agriculture mode, fallback to calculated values for other modes
  const useApiData = isAgriculture && spatialAnalysis !== null;
  
  // Calculated values (fallback for non-agriculture modes)
  const calculatedBaseArea = calculatePolygonArea(baselineZone);
  const calculatedCurrentArea = calculatePolygonArea(currentZone);
  const calculatedAreaChange = calculatedCurrentArea - calculatedBaseArea;
  const calculatedPercentChange = calculatedBaseArea > 0 ? (calculatedAreaChange / calculatedBaseArea) * 100 : 0;

  // Final values to display
  const baseArea = useApiData ? spatialAnalysis!.baseline_sq_km : calculatedBaseArea;
  const currentArea = useApiData ? spatialAnalysis!.future_sq_km : calculatedCurrentArea;
  const percentChange = useApiData ? -spatialAnalysis!.loss_pct : calculatedPercentChange;

  const isExpanding = mode === 'flood';
  const isNegative = isExpanding ? percentChange > 0 : percentChange < 0;

  // Color logic for loss percentage (agriculture mode with API data)
  const getLossColor = (lossPct: number) => {
    const absLoss = Math.abs(lossPct);
    if (absLoss < 5) return 'text-emerald-400'; // Green - Stable
    if (absLoss < 20) return 'text-amber-400'; // Orange - Moderate Risk
    return 'text-red-400'; // Red - Critical Risk
  };

  const lossColor = useApiData ? getLossColor(spatialAnalysis!.loss_pct) : (isNegative ? 'text-red-400' : 'text-emerald-400');

  const formatArea = (area: number) => {
    // Format with comma separator for thousands
    return Math.round(area).toLocaleString();
  };

  return (
    <div
      className={cn(
        'bg-transparent rounded-none border border-white/10 p-3 shadow-none',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3.5 h-3.5 text-white/60" />
        <span className="text-xs font-medium text-white/70">
          {isAgriculture ? 'Viable Growing Area (50km Radius)' : labels.label}
        </span>
      </div>

      {/* Loading state for spatial analysis */}
      {isAgriculture && isSpatialLoading && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-3 h-3 text-white/50 animate-spin" />
          <span className="text-[10px] text-white/50">Calculating area...</span>
        </div>
      )}

      {/* Show data when not loading */}
      {(!isAgriculture || !isSpatialLoading) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/50">Baseline</span>
            <span className="text-xs font-semibold text-white tabular-nums">
              {formatArea(baseArea)} km²
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/50">
              {isAgriculture ? 'Future' : `Current (+${temperature.toFixed(1)}°C)`}
            </span>
            <span className="text-xs font-semibold text-white tabular-nums">
              {formatArea(currentArea)} km²
            </span>
          </div>

          <div className="h-px bg-white/10 my-1" />

          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/50">
              {isNegative ? labels.shrinkLabel : labels.expandLabel}
            </span>
            <div className="flex items-center gap-1">
              {isNegative ? (
                <TrendingDown className={cn('w-3 h-3', lossColor)} />
              ) : (
                <TrendingUp className={cn('w-3 h-3', lossColor)} />
              )}
              <span className={cn('text-xs font-bold tabular-nums', lossColor)}>
                📉 {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
