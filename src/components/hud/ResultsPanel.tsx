import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Waves,
  Mountain,
  CloudRain,
  Droplets,
  Info,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DashboardMode } from '@/components/dashboard/ModeSelector';

interface AgricultureResults {
  avoidedLoss: number;
  riskReduction: number;
  monthlyData: { month: string; value: number }[];
  simulationDebug?: {
    final_simulated_temp?: number;
    final_simulated_rain?: number;
  };
}

interface CoastalResults {
  avoidedLoss: number;
  slope: number | null;
  stormWave: number | null;
}

interface FloodResults {
  floodDepthReduction: number;
  valueProtected: number;
}

interface ResultsPanelProps {
  mode: DashboardMode;
  visible: boolean;
  isLoading: boolean;
  agricultureResults?: AgricultureResults;
  coastalResults?: CoastalResults;
  floodResults?: FloodResults;
  mangroveWidth?: number;
  greenRoofsEnabled?: boolean;
  permeablePavementEnabled?: boolean;
  tempIncrease?: number;
  rainChange?: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(2)}`;
};
// Helper to determine yield penalty explanation
const getYieldExplanation = (
  simulationDebug?: { final_simulated_temp?: number; final_simulated_rain?: number },
  tempIncrease?: number,
  rainChange?: number
) => {
  // Use simulation debug if available, otherwise estimate from inputs
  const baseTemp = 28; // Baseline temp in °C
  const baseRain = 700; // Baseline rain in mm
  
  const finalTemp = simulationDebug?.final_simulated_temp ?? (baseTemp + (tempIncrease ?? 0));
  const finalRain = simulationDebug?.final_simulated_rain ?? (baseRain * (1 + (rainChange ?? 0) / 100));
  
  if (finalTemp > 32.0) {
    return {
      icon: '⚠️',
      text: 'Yield penalized due to High Heat Stress (>32°C)',
      colorClass: 'text-orange-400',
      bgClass: 'bg-orange-500/10 border-orange-500/20',
    };
  }
  
  if (finalRain > 900) {
    return {
      icon: '💧',
      text: 'Yield penalized due to Waterlogging (>900mm)',
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10 border-blue-500/20',
    };
  }
  
  if (finalRain < 500) {
    return {
      icon: '🍂',
      text: 'Yield penalized due to Drought (<500mm)',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-600/10 border-amber-600/20',
    };
  }
  
  return {
    icon: '✅',
    text: 'Climate conditions are optimal',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
  };
};

export const ResultsPanel = ({
  mode,
  visible,
  isLoading,
  agricultureResults,
  coastalResults,
  floodResults,
  mangroveWidth = 100,
  greenRoofsEnabled = false,
  permeablePavementEnabled = false,
  tempIncrease = 0,
  rainChange = 0,
}: ResultsPanelProps) => {
  if (!visible && !isLoading) return null;

  if (isLoading) {
    return (
      <GlassCard className="w-full lg:w-80 p-3 sm:p-4 lg:p-5 animate-in slide-in-from-bottom lg:slide-in-from-right duration-300">
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400 animate-pulse" />
            <Skeleton className="h-4 lg:h-5 w-32 bg-white/10" />
          </div>
          <Skeleton className="h-7 sm:h-8 lg:h-10 w-40 bg-white/10" />
          <Skeleton className="h-16 sm:h-20 lg:h-24 w-full bg-white/10" />
        </div>
      </GlassCard>
    );
  }

  if (mode === 'agriculture' && agricultureResults) {
    const { avoidedLoss, riskReduction, monthlyData, simulationDebug } = agricultureResults;
    const maxValue = Math.max(...monthlyData.map((d) => d.value));
    const isPositive = riskReduction > 0;
    const yieldExplanation = getYieldExplanation(simulationDebug, tempIncrease, rainChange);

    return (
      <GlassCard className="w-full lg:w-80 p-3 sm:p-4 lg:p-5 border-emerald-500/20 animate-in slide-in-from-bottom lg:slide-in-from-right duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none rounded-2xl" />

        <div className="relative space-y-4 lg:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />
              <span className="text-sm lg:text-base font-semibold text-white">Projected Yield Potential</span>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isPositive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}
              {riskReduction}%
            </div>
          </div>

          {/* Dynamic Root Cause Explanation */}
          <div className={`p-2.5 rounded-lg border ${yieldExplanation.bgClass}`}>
            <p className={`text-xs font-medium ${yieldExplanation.colorClass}`}>
              <span className="mr-1.5">{yieldExplanation.icon}</span>
              {yieldExplanation.text}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] lg:text-xs text-white/50 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Projected Avoided Loss
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-white/40 hover:text-white/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-[220px] bg-slate-900/95 backdrop-blur-xl border-white/10"
                  >
                    <p className="text-xs">
                      Estimated financial savings per hectare when using climate-resilient
                      practices.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-bold text-emerald-400">
                ${avoidedLoss.toLocaleString()}
              </span>
              <span className="text-xs lg:text-sm text-white/50">USD / hectare</span>
            </div>
          </div>

          <div className="space-y-2 lg:space-y-3">
            <div className="flex items-center gap-2 text-[10px] lg:text-xs text-white/50">
              <BarChart3 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              Monthly Risk Profile
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
                      Maize requires 500-900mm of rain. Too little causes drought; too much causes root rot.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-end gap-1 lg:gap-1.5 h-16 lg:h-20">
              {monthlyData.map((data) => {
                const height = (data.value / maxValue) * 100;
                const isHighRisk = data.value > maxValue * 0.7;
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-0.5 lg:gap-1">
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        isHighRisk
                          ? 'bg-gradient-to-t from-amber-500 to-amber-500/40'
                          : 'bg-gradient-to-t from-emerald-500 to-emerald-500/40'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[8px] lg:text-[9px] text-white/40">{data.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (mode === 'coastal' && coastalResults) {
    const { avoidedLoss, slope, stormWave } = coastalResults;

    return (
      <GlassCard className="w-full lg:w-80 p-3 sm:p-4 lg:p-5 border-teal-500/20 animate-in slide-in-from-bottom lg:slide-in-from-right duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none rounded-2xl" />

        <div className="relative space-y-4 lg:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 lg:w-5 lg:h-5 text-teal-400" />
              <span className="text-sm lg:text-base font-semibold text-white">Coastal Protection</span>
            </div>
            <Badge className="bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] lg:text-xs">
              {mangroveWidth}m mangrove
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-white/50">Avoided Loss</span>
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
                      Estimated economic loss avoided due to the mangrove buffer protecting coastal
                      assets.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-bold text-teal-400">{formatCurrency(avoidedLoss)}</span>
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-teal-400" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-white/50">Detected Parameters</span>
            </div>
            <div className="flex flex-wrap gap-1.5 lg:gap-2">
              <Badge className="bg-white/5 text-white/80 border-white/10 flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 py-1">
                <Mountain className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white/50" />
                <span className="text-[10px] lg:text-xs">Slope: {slope !== null ? `${slope.toFixed(1)}%` : 'N/A'}</span>
              </Badge>
              <Badge className="bg-white/5 text-white/80 border-white/10 flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 py-1">
                <CloudRain className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white/50" />
                <span className="text-[10px] lg:text-xs">
                  Storm Wave: {stormWave !== null ? `${stormWave.toFixed(1)}m` : 'N/A'}
                </span>
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min((avoidedLoss / 1000000) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>Low protection</span>
              <span>High protection</span>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (mode === 'flood' && floodResults) {
    const { floodDepthReduction, valueProtected } = floodResults;
    const activeInterventions = [
      greenRoofsEnabled && 'Green Roofs',
      permeablePavementEnabled && 'Permeable Pavement',
    ].filter(Boolean);

    return (
      <GlassCard className="w-full lg:w-80 p-3 sm:p-4 lg:p-5 border-blue-500/20 animate-in slide-in-from-bottom lg:slide-in-from-right duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none rounded-2xl" />

        <div className="relative space-y-3 lg:space-y-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
            <span className="text-sm lg:text-base font-semibold text-white">Flood Mitigation Results</span>
          </div>

          <div className="flex items-center justify-between p-2.5 lg:p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-400" />
              <span className="text-[10px] lg:text-xs text-white/60">Flood Depth Reduction</span>
            </div>
            <span className="text-sm lg:text-lg font-bold text-blue-400">
              {floodDepthReduction > 0 ? `-${floodDepthReduction}` : floodDepthReduction}cm
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 lg:p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
              <span className="text-[10px] lg:text-xs text-white/60">Value Protected</span>
            </div>
            <span className="text-sm lg:text-lg font-bold text-emerald-400">{formatCurrency(valueProtected)}</span>
          </div>

          {activeInterventions.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-[10px] lg:text-xs text-white/50 mb-2">Active Interventions:</p>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                {activeInterventions.map((intervention) => (
                  <span
                    key={intervention as string}
                    className="text-[10px] lg:text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  >
                    {intervention}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    );
  }

  return null;
};
