import { useState, useCallback, useEffect, useRef } from 'react';
import { Zap, Loader2, Thermometer, Calendar, HeartPulse } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HealthSimulationPanelProps {
  onSimulate: () => void;
  isSimulating: boolean;
  canSimulate: boolean;
  globalTempTarget: number;
  onGlobalTempTargetChange: (value: number) => void;
  selectedYear: number;
  onSelectedYearChange: (value: number) => void;
}

const CLIMATE_ANCHORS = [
  { year: 2026, temp: 1.4 },
  { year: 2030, temp: 1.5 },
  { year: 2050, temp: 2.1 },
];

const calculateTempFromYear = (year: number): number => {
  for (let i = 0; i < CLIMATE_ANCHORS.length - 1; i++) {
    const current = CLIMATE_ANCHORS[i];
    const next = CLIMATE_ANCHORS[i + 1];
    if (year >= current.year && year <= next.year) {
      const t = (year - current.year) / (next.year - current.year);
      return current.temp + t * (next.temp - current.temp);
    }
  }
  return CLIMATE_ANCHORS[CLIMATE_ANCHORS.length - 1].temp;
};

export const HealthSimulationPanel = ({
  onSimulate,
  isSimulating,
  canSimulate,
  globalTempTarget,
  onGlobalTempTargetChange,
  selectedYear,
  onSelectedYearChange,
}: HealthSimulationPanelProps) => {

  const handleYearChange = useCallback((year: number) => {
    onSelectedYearChange(year);
    const interpolatedTemp = calculateTempFromYear(year);
    onGlobalTempTargetChange(Math.round(interpolatedTemp * 10) / 10);
  }, [onSelectedYearChange, onGlobalTempTargetChange]);

  const getGWLBadgeColor = () => {
    if (globalTempTarget <= 1.5) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (globalTempTarget > 2.0) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  return (
    <GlassCard className="w-full lg:w-80 p-2.5 sm:p-3 lg:p-4">
      <div className="space-y-3 lg:space-y-4">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs lg:text-sm font-medium text-white/70">
          <HeartPulse className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-rose-400" />
          <span>Climate & Health Parameters</span>
        </div>

        {/* Year Slider */}
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

        {/* GWL Slider */}
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

        <Button
          variant="ghost"
          onClick={onSimulate}
          disabled={!canSimulate || isSimulating}
          className={cn(
            'w-full h-10 lg:h-11 text-xs lg:text-sm font-semibold text-white transition-all duration-200 rounded-xl',
            'hover:scale-[1.02] active:scale-[0.98]',
            'bg-gradient-to-r from-rose-600 to-rose-400',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_20px_rgba(244,63,94,0.4)]',
            'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_30px_rgba(244,63,94,0.6)]',
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
              Simulate Health Risk
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
