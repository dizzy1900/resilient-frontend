import { Zap, Loader2, Thermometer } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SimulationPanelProps {
  mode: DashboardMode;
  onSimulate: () => void;
  isSimulating: boolean;
  canSimulate: boolean;
  label?: string;
}

const modeConfig = {
  agriculture: {
    color: 'emerald',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600',
    glowClass: 'shadow-emerald-500/20',
  },
  coastal: {
    color: 'teal',
    buttonClass: 'bg-teal-500 hover:bg-teal-600',
    glowClass: 'shadow-teal-500/20',
  },
  flood: {
    color: 'blue',
    buttonClass: 'bg-blue-500 hover:bg-blue-600',
    glowClass: 'shadow-blue-500/20',
  },
};

export const SimulationPanel = ({
  mode,
  onSimulate,
  isSimulating,
  canSimulate,
  label,
}: SimulationPanelProps) => {
  const [temperature, setTemperature] = useState(1.5);
  const config = modeConfig[mode];

  const getResilienceScore = () => {
    const base = 85;
    const reduction = temperature * 20;
    return Math.max(0, Math.min(100, base - reduction));
  };

  const resilienceScore = getResilienceScore();

  const getScoreColor = () => {
    if (resilienceScore >= 70) return 'bg-emerald-500';
    if (resilienceScore >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = () => {
    if (resilienceScore >= 70) return 'text-emerald-400';
    if (resilienceScore >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const buttonLabel =
    label ||
    (mode === 'agriculture'
      ? 'Simulate Resilience'
      : mode === 'coastal'
        ? 'Simulate Protection'
        : 'Simulate Flood Risk');

  return (
    <GlassCard className="w-80 p-5">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-medium text-white/70">
          <Thermometer className="w-4 h-4 text-amber-400" />
          <span>Simulation Parameters</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Temperature Increase</span>
            <span className="text-lg font-bold text-amber-400 tabular-nums">+{temperature.toFixed(1)}°C</span>
          </div>
          <Slider
            value={[temperature]}
            onValueChange={(v) => setTemperature(v[0])}
            min={0}
            max={3}
            step={0.1}
            className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:via-amber-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>0°C</span>
            <span>+1.5°C</span>
            <span>+3°C</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Resilience Score</span>
            <span className={cn('text-sm font-semibold tabular-nums', getScoreTextColor())}>
              {Math.round(resilienceScore)}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500 rounded-full', getScoreColor())}
              style={{ width: `${resilienceScore}%` }}
            />
          </div>
        </div>

        <Button
          onClick={onSimulate}
          disabled={!canSimulate || isSimulating}
          className={cn(
            'w-full h-12 text-sm font-semibold text-white transition-all duration-300 rounded-xl shadow-lg',
            config.buttonClass,
            config.glowClass,
            'disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl'
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
          <p className="text-xs text-white/40 text-center">Select a location on the map first</p>
        )}
      </div>
    </GlassCard>
  );
};
