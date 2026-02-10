import { useMemo, useState, useEffect } from 'react';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { AgricultureAnalytics, ApiChartData } from '@/components/analytics/AgricultureAnalytics';
import { CoastalAnalytics } from '@/components/analytics/CoastalAnalytics';
import { FloodAnalytics } from '@/components/analytics/FloodAnalytics';
import { CumulativeCashFlowChart } from '@/components/analytics/CumulativeCashFlowChart';
import { InvestmentAnalysisCard } from '@/components/analytics/InvestmentAnalysisCard';
import { ProjectParams } from '@/components/hud/InterventionWizardModal';
import { DefensiveProjectParams } from '@/components/hud/DefensiveInfrastructureModal';
import { MiniSoilMoistureChart } from '@/components/analytics/MiniSoilMoistureChart';
import { MiniStormSurgeChart } from '@/components/analytics/MiniStormSurgeChart';
import { MiniFloodCapacityChart } from '@/components/analytics/MiniFloodCapacityChart';
import {
  generateSoilMoistureData,
  generateAgricultureRiskFactors,
  generateCoastalRiskFactors,
  generateFloodRiskFactors,
  generateStormSurgeData,
  generateFloodCapacityData,
  calculateResilienceScore,
} from '@/utils/mockAnalyticsData';
import {
  generateAgricultureRecommendations,
  generateCoastalRecommendations,
  generateFloodRecommendations,
  Recommendation,
} from '@/utils/generateRecommendations';
import { Sprout, Waves, Droplets, ChevronDown, ChevronUp, X, AlertTriangle, Lightbulb, TrendingUp, FileText } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from '@/components/ui/button';
import { SocialImpactCard } from '@/components/analytics/SocialImpactCard';
import { NaturePositiveCard } from '@/components/analytics/NaturePositiveCard';
import { toast } from '@/hooks/use-toast';

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

interface AnalyticsHighlightsCardProps {
  visible: boolean;
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
  chartData?: ApiChartData | null;
  rainChange?: number;
  projectParams?: ProjectParams | null;
  portfolioVolatilityPct?: number | null;
  adaptationActive?: boolean;
  defensiveProjectParams?: DefensiveProjectParams | null;
  assetLifespan?: number;
  dailyRevenue?: number;
  propertyValue?: number;
}

const modeConfig = {
  agriculture: {
    icon: Sprout,
    label: 'Agriculture',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    gradientFrom: 'from-emerald-500/10',
  },
  coastal: {
    icon: Waves,
    label: 'Coastal',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
    gradientFrom: 'from-teal-500/10',
  },
  flood: {
    icon: Droplets,
    label: 'Flood',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    gradientFrom: 'from-blue-500/10',
  },
  portfolio: {
    icon: Sprout,
    label: 'Portfolio',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    gradientFrom: 'from-purple-500/10',
  },
};

const priorityConfig = {
  high: { color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' },
  medium: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/30' },
  low: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/30' },
};

export const AnalyticsHighlightsCard = ({
  visible,
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
  chartData = null,
  rainChange = 0,
  projectParams = null,
  portfolioVolatilityPct = null,
  adaptationActive = false,
  defensiveProjectParams = null,
  assetLifespan = 30,
  dailyRevenue = 20000,
  propertyValue = 5000000,
}: AnalyticsHighlightsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const config = modeConfig[mode];
  const Icon = config.icon;

  useEffect(() => {
    if (!visible) {
      setIsExpanded(false);
    }
  }, [visible]);

  const handleToggleExpand = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const { resilienceScore, miniChartData, topRecommendations } = useMemo(() => {
    if (!latitude) {
      return { resilienceScore: 0, miniChartData: null, topRecommendations: [] };
    }

    let riskFactors;
    let avoidedLoss = 0;
    let maxPotentialLoss = 100000;
    let chartData: unknown = null;
    let recommendations: Recommendation[] = [];

    if (mode === 'agriculture' && agricultureResults) {
      const soilMoistureData = generateSoilMoistureData(latitude, temperature);
      riskFactors = generateAgricultureRiskFactors(temperature, soilMoistureData);
      avoidedLoss = agricultureResults.avoidedLoss;
      maxPotentialLoss = 1000;
      chartData = soilMoistureData;
      recommendations = generateAgricultureRecommendations({
        temperatureIncrease: temperature,
        riskFactors,
        soilMoistureData,
        cropType,
      });
    } else if (mode === 'coastal' && coastalResults) {
      riskFactors = generateCoastalRiskFactors(
        coastalResults.slope,
        coastalResults.stormWave,
        mangroveWidth
      );
      avoidedLoss = coastalResults.avoidedLoss;
      maxPotentialLoss = 1000000;
      chartData = generateStormSurgeData(mangroveWidth);
      recommendations = generateCoastalRecommendations({
        mangroveWidth,
        slope: coastalResults.slope,
        stormWave: coastalResults.stormWave,
        riskFactors,
        avoidedLoss,
      });
    } else if (mode === 'flood' && floodResults) {
      riskFactors = generateFloodRiskFactors(greenRoofsEnabled, permeablePavementEnabled);
      avoidedLoss = floodResults.valueProtected;
      maxPotentialLoss = 500000;
      chartData = generateFloodCapacityData(greenRoofsEnabled, permeablePavementEnabled);
      recommendations = generateFloodRecommendations({
        greenRoofsEnabled,
        permeablePavementEnabled,
        riskFactors,
        floodDepthReduction: floodResults.floodDepthReduction,
      });
    } else {
      return { resilienceScore: 0, miniChartData: null, topRecommendations: [] };
    }

    const score = calculateResilienceScore(mode, riskFactors, avoidedLoss, maxPotentialLoss);

    return {
      resilienceScore: score,
      miniChartData: chartData,
      topRecommendations: recommendations.slice(0, 2),
    };
  }, [
    mode,
    latitude,
    temperature,
    cropType,
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

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500/20 border-emerald-500/30';
    if (score >= 40) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-amber-400';
    return 'bg-gradient-to-r from-red-500 to-red-400';
  };

  if (!visible) return null;

  return (
    <div
      className={`transition-all duration-400 ease-out ${
        isExpanded
          ? 'fixed inset-3 sm:inset-4 lg:top-16 lg:right-20 lg:bottom-32 lg:left-auto lg:w-80 z-50'
          : 'w-full lg:w-80'
      }`}
    >
      <GlassCard
        className={`relative overflow-hidden transition-all duration-400 ease-out ${
          isExpanded
            ? 'h-full'
            : 'p-3 sm:p-4'
        } ${config.borderColor}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradientFrom} to-transparent pointer-events-none rounded-2xl`} />

        {isExpanded ? (
          <div className="relative h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h3 className="text-white text-base font-semibold">Detailed Analytics</h3>
                  <p className="text-xs text-white/50">{config.label} Mode</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[10px] text-white/60 hover:text-white hover:bg-white/10 gap-1 px-2"
                  onClick={() => {
                    toast({
                      title: '📄 Generating Report',
                      description: 'Generating World Bank Standard Feasibility Report...',
                    });
                  }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export PDF</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={handleToggleExpand}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 border-b border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 mb-1">Resilience Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${getScoreColor(resilienceScore)}`}>
                        {resilienceScore}
                      </span>
                      <span className="text-sm text-white/40">/100</span>
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getScoreBgColor(resilienceScore)} ${getScoreColor(resilienceScore)}`}
                  >
                    {getScoreLabel(resilienceScore)}
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(resilienceScore)}`}
                    style={{ width: `${resilienceScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              <div className="p-4">
                {mode === 'agriculture' && latitude !== null && (
                  <>
                    <AgricultureAnalytics
                      latitude={latitude}
                      temperatureIncrease={temperature}
                      cropType={cropType}
                      embedded
                      chartData={chartData}
                      rainChange={rainChange}
                      portfolioVolatilityPct={portfolioVolatilityPct}
                      adaptationActive={adaptationActive}
                      adaptedVolatilityPct={adaptationActive && portfolioVolatilityPct !== null ? Math.round(portfolioVolatilityPct * 0.45) : null}
                    />
                    {projectParams && (
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-sm font-medium text-white">Cumulative Cash Flow</h3>
                        </div>
                        <p className="text-xs text-white/50">
                          10-year ROI projection for your adaptation project
                        </p>
                        <CumulativeCashFlowChart
                          capex={projectParams.capex}
                          opex={projectParams.opex}
                          yieldBenefit={projectParams.yieldBenefit}
                          cropPrice={projectParams.cropPrice}
                        />
                      </div>
                    )}
                  </>
                )}
                {mode === 'coastal' && coastalResults && (
                  <>
                    <div className="mb-6">
                      <SocialImpactCard
                        livesProtected={coastalResults.avoidedLoss > 0 ? Math.round(coastalResults.avoidedLoss / 50) : 0}
                        householdsSecured={coastalResults.avoidedLoss > 0 ? Math.round(coastalResults.avoidedLoss / 200) : 0}
                      />
                    </div>
                    {mangroveWidth > 0 && (
                      <div className="mb-6">
                        <NaturePositiveCard
                          carbonTons={Math.round(mangroveWidth * 3.67)}
                          carbonValueUsd={Math.round(mangroveWidth * 3.67 * 35)}
                          interventionType="mangroves"
                        />
                      </div>
                    )}
                    <CoastalAnalytics
                      mangroveWidth={mangroveWidth}
                      slope={coastalResults.slope}
                      stormWave={coastalResults.stormWave}
                      avoidedLoss={coastalResults.avoidedLoss}
                      embedded
                    />
                    <div className="mt-6">
                      <InvestmentAnalysisCard
                        avoidedLoss={coastalResults.avoidedLoss}
                        projectParams={defensiveProjectParams}
                        assetLifespan={assetLifespan}
                        discountRate={15}
                        propertyValue={propertyValue}
                        dailyRevenue={dailyRevenue}
                        includeBusinessInterruption={dailyRevenue > 0}
                      />
                    </div>
                  </>
                )}
                {mode === 'flood' && floodResults && (
                  <>
                    <div className="mb-6">
                      <SocialImpactCard
                        livesProtected={floodResults.valueProtected > 0 ? Math.round(floodResults.valueProtected / 30) : 0}
                        householdsSecured={floodResults.valueProtected > 0 ? Math.round(floodResults.valueProtected / 120) : 0}
                      />
                    </div>
                    {greenRoofsEnabled && (
                      <div className="mb-6">
                        <NaturePositiveCard
                          carbonTons={Math.round(45)}
                          carbonValueUsd={Math.round(45 * 35)}
                          interventionType="green_roofs"
                        />
                      </div>
                    )}
                    <FloodAnalytics
                      greenRoofsEnabled={greenRoofsEnabled}
                      permeablePavementEnabled={permeablePavementEnabled}
                      floodDepthReduction={floodResults.floodDepthReduction}
                      valueProtected={floodResults.valueProtected}
                      embedded
                    />
                    <div className="mt-6">
                      <InvestmentAnalysisCard
                        avoidedLoss={floodResults.valueProtected}
                        projectParams={defensiveProjectParams}
                        assetLifespan={assetLifespan}
                        discountRate={15}
                        propertyValue={propertyValue}
                        dailyRevenue={dailyRevenue}
                        includeBusinessInterruption={dailyRevenue > 0}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`relative space-y-3 cursor-pointer ${isAnimating ? 'pointer-events-none' : ''}`}
            onClick={handleToggleExpand}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <span className="text-sm font-medium text-white">Analytics Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getScoreBgColor(resilienceScore)} ${getScoreColor(resilienceScore)}`}
                >
                  {resilienceScore}/100
                </div>
              </div>
            </div>

            {miniChartData && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-2 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-white/40">
                    {mode === 'agriculture' && 'Soil Moisture Trend'}
                    {mode === 'coastal' && 'Storm Surge Projection'}
                    {mode === 'flood' && 'Infrastructure Capacity'}
                  </span>
                </div>
                {mode === 'agriculture' && (
                  <MiniSoilMoistureChart data={miniChartData as Parameters<typeof MiniSoilMoistureChart>[0]['data']} />
                )}
                {mode === 'coastal' && (
                  <MiniStormSurgeChart data={miniChartData as Parameters<typeof MiniStormSurgeChart>[0]['data']} />
                )}
                {mode === 'flood' && (
                  <MiniFloodCapacityChart data={miniChartData as Parameters<typeof MiniFloodCapacityChart>[0]['data']} />
                )}
              </div>
            )}

            {topRecommendations.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[10px] text-white/40">
                  <Lightbulb className="w-3 h-3" />
                  <span>Top Recommendations</span>
                </div>
                {topRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        rec.priority === 'high'
                          ? 'bg-red-400'
                          : rec.priority === 'medium'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                      }`}
                    />
                    <span className="text-[11px] text-white/70 truncate flex-1">{rec.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border ${priorityConfig[rec.priority].bgColor} ${priorityConfig[rec.priority].color} ${priorityConfig[rec.priority].borderColor}`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-1 pt-1 text-white/40 hover:text-white/60 transition-colors">
              <span className="text-[10px]">Expand for details</span>
              <ChevronDown className="w-3 h-3 animate-bounce" />
            </div>
          </div>
        )}
      </GlassCard>

      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10 lg:hidden"
          onClick={handleToggleExpand}
        />
      )}
    </div>
  );
};
