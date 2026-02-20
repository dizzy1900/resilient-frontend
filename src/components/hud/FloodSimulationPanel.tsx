import { useState, useRef, useCallback, useEffect } from 'react';
import { Zap, Loader2, Droplets, Calendar, CloudRain, Info } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FloodSimulationPanelProps {
  onSimulate: () => void;
  isSimulating: boolean;
  canSimulate: boolean;
  totalRainIntensity: number;
  onTotalRainIntensityChange: (value: number) => void;
  selectedYear: number;
  onSelectedYearChange: (value: number) => void;
  isUserOverride: boolean;
  onUserOverrideChange: (value: boolean) => void;
}

// Rainfall intensity anchor points (% increase vs pre-industrial baseline)
// Based on climate science: ~7% increase per degree of warming (Clausius-Clapeyron)
const RAIN_ANCHORS = [
  { year: 2026, intensity: 9 },  // Current: ~1.4°C warming
  { year: 2030, intensity: 10 }, // ~1.5°C warming
  { year: 2050, intensity: 17 }, // ~2.1°C warming
];

// Calculate rain intensity from year using linear interpolation
const calculateRainFromYear = (year: number): number => {
  // Before first anchor
  if (year <= RAIN_ANCHORS[0].year) {
    return RAIN_ANCHORS[0].intensity;
  }
  
  // Between anchor points - linear interpolation
  for (let i = 0; i < RAIN_ANCHORS.length - 1; i++) {
    const current = RAIN_ANCHORS[i];
    const next = RAIN_ANCHORS[i + 1];
    
    if (year >= current.year && year <= next.year) {
      const t = (year - current.year) / (next.year - current.year);
      return Math.round(current.intensity + t * (next.intensity - current.intensity));
    }
  }
  
  // Beyond last anchor - extrapolate linearly
  const last = RAIN_ANCHORS[RAIN_ANCHORS.length - 1];
  const prev = RAIN_ANCHORS[RAIN_ANCHORS.length - 2];
  const rate = (last.intensity - prev.intensity) / (last.year - prev.year);
  return Math.round(last.intensity + rate * (year - last.year));
};

export const FloodSimulationPanel = ({
  onSimulate,
  isSimulating,
  canSimulate,
  totalRainIntensity,
  onTotalRainIntensityChange,
  selectedYear,
  onSelectedYearChange,
  isUserOverride,
  onUserOverrideChange,
}: FloodSimulationPanelProps) => {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Handle year change with automatic rain intensity interpolation
  const handleYearChange = useCallback((year: number) => {
    onSelectedYearChange(year);
    // Only auto-update intensity if user hasn't manually overridden
    if (!isUserOverride) {
      const interpolatedIntensity = calculateRainFromYear(year);
      onTotalRainIntensityChange(interpolatedIntensity);
    }
    // Reset user override when timeline is moved
    onUserOverrideChange(false);
  }, [onSelectedYearChange, onTotalRainIntensityChange, isUserOverride, onUserOverrideChange]);

  // Handle manual intensity change (sets user override)
  const handleIntensityChange = useCallback((value: number) => {
    onTotalRainIntensityChange(value);
    onUserOverrideChange(true); // Mark as user override
  }, [onTotalRainIntensityChange, onUserOverrideChange]);

  // Debounced simulation trigger
  const triggerDebouncedSimulation = useCallback(() => {
    if (!canSimulate) return;
    
    setIsDebouncing(true);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setIsDebouncing(false);
      onSimulate();
    }, 500);
  }, [canSimulate, onSimulate]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Auto-simulate on slider changes
  useEffect(() => {
    if (canSimulate) {
      triggerDebouncedSimulation();
    }
  }, [totalRainIntensity, canSimulate]); // eslint-disable-line react-hooks/exhaustive-deps

  const getIntensityBadgeColor = () => {
    if (totalRainIntensity < 10) {
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
    if (totalRainIntensity <= 15) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
    if (totalRainIntensity <= 25) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getRiskLabel = () => {
    if (totalRainIntensity < 10) return 'Current Baseline';
    if (totalRainIntensity <= 15) return null;
    if (totalRainIntensity <= 25) return 'High Risk';
    return 'Extreme Event';
  };

  const getRiskLabelColor = () => {
    if (totalRainIntensity < 10) return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    if (totalRainIntensity <= 25) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getProgressColor = () => {
    if (totalRainIntensity < 10) return 'bg-slate-500';
    if (totalRainIntensity <= 15) return 'bg-emerald-500';
    if (totalRainIntensity <= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const riskLabel = getRiskLabel();

  return (
    <GlassCard className="w-full lg:w-80 p-2.5 sm:p-3 lg:p-4">
      <div className="space-y-3 lg:space-y-4">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs lg:text-sm font-medium text-white/70">
          <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-blue-400" />
          <span>Flood Parameters</span>
          {isDebouncing && (
            <span className="ml-auto text-[10px] text-white/40 animate-pulse">Updating...</span>
          )}
        </div>

        {/* Year Slider (Timeline) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-white/50" />
              <span className="text-[10px] lg:text-xs text-white/50">Projection Year</span>
            </div>
            <Badge className="text-[10px] px-2 py-0.5 border bg-white/10 text-white/80 border-white/20">
              {selectedYear}
            </Badge>
          </div>
          <Slider
            value={[selectedYear]}
            onValueChange={(v) => handleYearChange(v[0])}
            min={2026}
            max={2050}
            step={1}
            className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-blue-500 [&_[data-radix-slider-range]]:via-blue-400 [&_[data-radix-slider-range]]:to-cyan-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
          />
          <div className="flex justify-between text-[9px] lg:text-[10px] text-white/40">
            <span>2026</span>
            <span>2038</span>
            <span>2050</span>
          </div>
        </div>

        {/* Rainfall Intensity Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CloudRain className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] lg:text-xs text-white/50">Rainfall Intensity</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-white/40 hover:text-white/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[220px] bg-slate-900/95 backdrop-blur-xl border-white/10"
                  >
                    <p className="text-xs">
                      Percentage increase in extreme rainfall vs pre-industrial baseline. Climate warming increases atmospheric moisture by ~7% per °C (Clausius-Clapeyron).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1.5">
              {riskLabel && (
                <Badge className={cn('text-[9px] px-1.5 py-0 border', getRiskLabelColor())}>
                  {riskLabel}
                </Badge>
              )}
              <Badge className={cn('text-[10px] px-2 py-0.5 font-bold tabular-nums border', getIntensityBadgeColor())}>
                +{totalRainIntensity}%
              </Badge>
            </div>
          </div>
          <Slider
            value={[totalRainIntensity]}
            onValueChange={(v) => handleIntensityChange(v[0])}
            min={0}
            max={40}
            step={1}
            className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-blue-500 [&_[data-radix-slider-range]]:via-orange-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
          />
          <div className="flex justify-between text-[9px] lg:text-[10px] text-white/40">
            <span>0%</span>
            <span>20%</span>
            <span>40%</span>
          </div>
          {/* Calibration info */}
          <div className="flex items-center gap-1 pt-0.5">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-400/80 bg-blue-500/5">
              vs Pre-industrial
            </Badge>
            {isUserOverride && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400/80 bg-amber-500/5">
                Manual Override
              </Badge>
            )}
          </div>
        </div>

        {/* Visual Label */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] lg:text-xs text-white/50">Rainfall Intensity (vs Pre-industrial)</span>
            <span className={cn(
              'text-xs lg:text-sm font-semibold tabular-nums',
              totalRainIntensity < 10 ? 'text-slate-400' :
              totalRainIntensity <= 15 ? 'text-emerald-400' :
              totalRainIntensity <= 25 ? 'text-orange-400' : 'text-red-400'
            )}>
              +{totalRainIntensity}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500 rounded-full', getProgressColor())}
              style={{ width: `${Math.min((totalRainIntensity / 40) * 100, 100)}%` }}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={onSimulate}
          disabled={!canSimulate || isSimulating}
          className={cn(
            'w-full h-10 lg:h-11 text-xs lg:text-sm font-semibold text-white transition-all duration-200 rounded-xl',
            'hover:scale-[1.02] active:scale-[0.98]',
            'bg-gradient-to-r from-blue-600 to-blue-400',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_20px_rgba(59,130,246,0.4)]',
            'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_30px_rgba(59,130,246,0.6)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
          )}
        >
          {isSimulating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Simulate Flood Risk
            </>
          )}
        </Button>

        {!canSimulate && (
          <p className="text-[10px] lg:text-xs text-white/40 text-center">Select a location on the map first</p>
        )}
      </div>
    </GlassCard>
  );
};
