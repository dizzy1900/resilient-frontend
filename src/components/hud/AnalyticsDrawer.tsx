import { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { AgricultureAnalytics } from '@/components/analytics/AgricultureAnalytics';
import { CoastalAnalytics } from '@/components/analytics/CoastalAnalytics';
import { FloodAnalytics } from '@/components/analytics/FloodAnalytics';
import {
  generateSoilMoistureData,
  generateAgricultureRiskFactors,
  generateCoastalRiskFactors,
  generateFloodRiskFactors,
  calculateResilienceScore,
} from '@/utils/mockAnalyticsData';
import { Sprout, Waves, Droplets, MapPin, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AgricultureResults {
  avoidedLoss: number;
  riskReduction: number;
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

interface AnalyticsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DashboardMode;
  latitude: number | null;
  longitude: number | null;
  temperature: number;
  cropType: string;
  mangroveWidth: number;
  greenRoofsEnabled: boolean;
  permeablePavementEnabled: boolean;
  agricultureResults?: AgricultureResults;
  coastalResults?: CoastalResults;
  floodResults?: FloodResults;
}

const modeConfig = {
  agriculture: {
    icon: Sprout,
    label: 'Agriculture',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
  },
  coastal: {
    icon: Waves,
    label: 'Coastal',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
  },
  flood: {
    icon: Droplets,
    label: 'Flood',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
};

export const AnalyticsDrawer = ({
  open,
  onOpenChange,
  mode,
  latitude,
  longitude,
  temperature,
  cropType,
  mangroveWidth,
  greenRoofsEnabled,
  permeablePavementEnabled,
  agricultureResults,
  coastalResults,
  floodResults,
}: AnalyticsDrawerProps) => {
  const config = modeConfig[mode];
  const Icon = config.icon;

  const resilienceScore = useMemo(() => {
    if (!latitude) return 0;

    let riskFactors;
    let avoidedLoss = 0;
    let maxPotentialLoss = 100000;

    if (mode === 'agriculture' && agricultureResults) {
      const soilMoistureData = generateSoilMoistureData(latitude, temperature);
      riskFactors = generateAgricultureRiskFactors(temperature, soilMoistureData);
      avoidedLoss = agricultureResults.avoidedLoss;
      maxPotentialLoss = 1000;
    } else if (mode === 'coastal' && coastalResults) {
      riskFactors = generateCoastalRiskFactors(
        coastalResults.slope,
        coastalResults.stormWave,
        mangroveWidth
      );
      avoidedLoss = coastalResults.avoidedLoss;
      maxPotentialLoss = 1000000;
    } else if (mode === 'flood' && floodResults) {
      riskFactors = generateFloodRiskFactors(greenRoofsEnabled, permeablePavementEnabled);
      avoidedLoss = floodResults.valueProtected;
      maxPotentialLoss = 500000;
    } else {
      return 0;
    }

    return calculateResilienceScore(mode, riskFactors, avoidedLoss, maxPotentialLoss);
  }, [
    mode,
    latitude,
    temperature,
    mangroveWidth,
    greenRoofsEnabled,
    permeablePavementEnabled,
    agricultureResults,
    coastalResults,
    floodResults,
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'At Risk';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] bg-slate-950/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-5 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <SheetTitle className="text-white text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-white/60" />
                    Detailed Analytics
                  </SheetTitle>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${config.bgColor} ${config.color} ${config.borderColor} text-[10px]`}
                  >
                    {config.label} Mode
                  </Badge>
                </div>
              </div>
            </div>

            {latitude !== null && longitude !== null && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-white/50">
                <MapPin className="w-3 h-3" />
                <span>
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>
            )}

            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 mb-1">Resilience Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${getScoreColor(resilienceScore)}`}>
                      {resilienceScore}
                    </span>
                    <span className="text-sm text-white/40">/100</span>
                  </div>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    resilienceScore >= 70
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : resilienceScore >= 40
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {getScoreLabel(resilienceScore)}
                </div>
              </div>
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    resilienceScore >= 70
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : resilienceScore >= 40
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ width: `${resilienceScore}%` }}
                />
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden p-5">
            {mode === 'agriculture' && latitude !== null && (
              <AgricultureAnalytics
                latitude={latitude}
                temperatureIncrease={temperature}
                cropType={cropType}
              />
            )}
            {mode === 'coastal' && coastalResults && (
              <CoastalAnalytics
                mangroveWidth={mangroveWidth}
                slope={coastalResults.slope}
                stormWave={coastalResults.stormWave}
                avoidedLoss={coastalResults.avoidedLoss}
              />
            )}
            {mode === 'flood' && floodResults && (
              <FloodAnalytics
                greenRoofsEnabled={greenRoofsEnabled}
                permeablePavementEnabled={permeablePavementEnabled}
                floodDepthReduction={floodResults.floodDepthReduction}
                valueProtected={floodResults.valueProtected}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
