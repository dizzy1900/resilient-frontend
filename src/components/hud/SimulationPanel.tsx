import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Loader2, Thermometer, Calendar, CloudRain, Info } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SimulationPanelProps {
  mode: DashboardMode;
  onSimulate: () => void;
  isSimulating: boolean;
  canSimulate: boolean;
  label?: string;
  globalTempTarget: number;
  onGlobalTempTargetChange: (value: number) => void;
  rainChange: number;
  onRainChangeChange: (value: number) => void;
  selectedYear: number;
  onSelectedYearChange: (value: number) => void;
  yieldPotential?: number | null; // API result: actual yield potential from simulation
}

// Scientific anchor points from research (Absolute GWL values)
const CLIMATE_ANCHORS = [
  { year: 2026, temp: 1.4 },
  { year: 2030, temp: 1.5 },
  { year: 2050, temp: 2.1 },
];

// Calculate absolute GWL from year using linear interpolation
const calculateTempFromYear = (year: number): number => {
  // Find the two anchor points to interpolate between
  for (let i = 0; i < CLIMATE_ANCHORS.length - 1; i++) {
    const current = CLIMATE_ANCHORS[i];
    const next = CLIMATE_ANCHORS[i + 1];
    
    if (year >= current.year && year <= next.year) {
      // Linear interpolation
      const t = (year - current.year) / (next.year - current.year);
      return current.temp + t * (next.temp - current.temp);
    }
  }
  
  // If beyond the last anchor, return the last value
  return CLIMATE_ANCHORS[CLIMATE_ANCHORS.length - 1].temp;
};
// Baseline rainfall in mm for calculations
const BASELINE_RAINFALL_MM = 700;

const modeConfig = {
  agriculture: {
    color: 'emerald',
    gradientClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    shadowClass: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_20px_rgba(16,185,129,0.4)]',
    hoverShadowClass: 'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_30px_rgba(16,185,129,0.6)]',
  },
  coastal: {
    color: 'teal',
    gradientClass: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    shadowClass: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_20px_rgba(20,184,166,0.4)]',
    hoverShadowClass: 'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_30px_rgba(20,184,166,0.6)]',
  },
  flood: {
    color: 'blue',
    gradientClass: 'bg-gradient-to-r from-blue-600 to-blue-400',
    shadowClass: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_20px_rgba(59,130,246,0.4)]',
    hoverShadowClass: 'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_30px_rgba(59,130,246,0.6)]',
  },
  health: {
    color: 'rose',
    gradientClass: 'bg-gradient-to-r from-rose-600 to-rose-400',
    shadowClass: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_20px_rgba(244,63,94,0.4)]',
    hoverShadowClass: 'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_30px_rgba(244,63,94,0.6)]',
  },
  portfolio: {
    color: 'purple',
    gradientClass: 'bg-gradient-to-r from-purple-600 to-purple-400',
    shadowClass: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_20px_rgba(147,51,234,0.4)]',
    hoverShadowClass: 'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_30px_rgba(147,51,234,0.6)]',
  },
};

export const SimulationPanel = ({
  mode,
  onSimulate,
  isSimulating,
  canSimulate,
  label,
  globalTempTarget,
  onGlobalTempTargetChange,
  rainChange,
  onRainChangeChange,
  selectedYear,
  onSelectedYearChange,
  yieldPotential,
}: SimulationPanelProps) => {
  const config = modeConfig[mode];
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Handle year change with automatic temperature interpolation
  const handleYearChange = useCallback((year: number) => {
    onSelectedYearChange(year);
    const interpolatedTemp = calculateTempFromYear(year);
    onGlobalTempTargetChange(Math.round(interpolatedTemp * 10) / 10);
  }, [onSelectedYearChange, onGlobalTempTargetChange]);

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

  // Calculate estimated score (used as fallback before API call)
  const getEstimatedScore = () => {
    const base = 85;
    // Temperature impact: each degree above baseline (1.4) reduces score
    const tempDelta = globalTempTarget - 1.4;
    const tempReduction = tempDelta * 15;
    // Rain impact: negative rain change reduces score, positive slightly improves
    const rainImpact = rainChange < 0 ? Math.abs(rainChange) * 0.5 : rainChange * -0.2;
    return Math.max(0, Math.min(100, base - tempReduction + rainImpact));
  };

  // Use API result when available, otherwise show estimate
  const displayScore = yieldPotential !== null && yieldPotential !== undefined 
    ? yieldPotential 
    : getEstimatedScore();

  const getScoreColor = () => {
    if (displayScore >= 70) return 'bg-emerald-500';
    if (displayScore >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = () => {
    if (displayScore >= 70) return 'text-emerald-400';
    if (displayScore >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getGWLBadgeColor = () => {
    if (globalTempTarget <= 1.5) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
    if (globalTempTarget > 2.0) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  const getRainBadgeColor = () => {
    const projectedRain = BASELINE_RAINFALL_MM * (1 + rainChange / 100);
    // Waterlogging threshold
    if (projectedRain > 900) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    // Drought threshold
    if (projectedRain < 500) return 'bg-amber-600/20 text-amber-600 border-amber-600/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  const getProjectedRainfall = () => {
    return Math.round(BASELINE_RAINFALL_MM * (1 + rainChange / 100));
  };

  const buttonLabel =
    label ||
    (mode === 'agriculture'
      ? 'Simulate Resilience'
      : mode === 'coastal'
        ? 'Simulate Protection'
        : 'Simulate Flood Risk');

  return (
    <GlassCard className="w-full lg:w-80 p-2.5 sm:p-3 lg:p-4">
      <div className="space-y-3 lg:space-y-4">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs lg:text-sm font-medium text-white/70">
          <Thermometer className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-amber-400" />
          <span>Simulation Parameters</span>
          {isDebouncing && (
            <span className="ml-auto text-[10px] text-white/40 animate-pulse">Updating...</span>
          )}
        </div>

        {/* Year Slider (Scientific Timeline) */}
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
            className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:via-amber-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
          />
          <div className="flex justify-between text-[9px] lg:text-[10px] text-white/40">
            <span>2026</span>
            <span>2030</span>
            <span>2040</span>
            <span>2050</span>
          </div>
        </div>

        {/* Global Warming Level Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] lg:text-xs text-white/50">Global Warming</span>
            </div>
            <Badge className={cn('text-[10px] px-2 py-0.5 font-bold tabular-nums border', getGWLBadgeColor())}>
              +{globalTempTarget.toFixed(1)}°C
            </Badge>
          </div>
          <Slider
            value={[globalTempTarget]}
            onValueChange={(v) => onGlobalTempTargetChange(v[0])}
            min={1.4}
            max={4.0}
            step={0.1}
            className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:via-amber-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
          />
          <div className="flex justify-between text-[9px] lg:text-[10px] text-white/40">
            <span>1.4°C</span>
            <span>2.0°C</span>
            <span>4.0°C</span>
          </div>
        </div>

        {/* Rainfall Change Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CloudRain className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] lg:text-xs text-white/50">Rainfall Δ</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-white/40 hover:text-white/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[200px] bg-slate-900/95 backdrop-blur-xl border-white/10"
                  >
                    <p className="text-xs">
                      Projected: {getProjectedRainfall()}mm. Optimal range is 500-900mm for maize.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge className={cn('text-[10px] px-2 py-0.5 font-bold tabular-nums border', getRainBadgeColor())}>
              {rainChange > 0 ? '+' : ''}{rainChange}%
            </Badge>
          </div>
          <Slider
            value={[rainChange]}
            onValueChange={(v) => onRainChangeChange(v[0])}
            min={-30}
            max={30}
            step={5}
            className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-amber-500 [&_[data-radix-slider-range]]:to-blue-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
          />
          <div className="flex justify-between text-[9px] lg:text-[10px] text-white/40">
            <span>-30%</span>
            <span>0%</span>
            <span>+30%</span>
          </div>
        </div>

        {/* Projected Yield Potential */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] lg:text-xs text-white/50">Projected Yield Potential</span>
              {yieldPotential === null || yieldPotential === undefined ? (
                <span className="text-[8px] text-white/30">(est.)</span>
              ) : null}
            </div>
            <span className={cn('text-xs lg:text-sm font-semibold tabular-nums', getScoreTextColor())}>
              {Math.round(displayScore)}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500 rounded-full', getScoreColor())}
              style={{ width: `${displayScore}%` }}
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
            config.gradientClass,
            config.shadowClass,
            config.hoverShadowClass,
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
              {buttonLabel}
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
