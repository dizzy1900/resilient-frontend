import { useMemo } from 'react';
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
import { Lightbulb, TrendingUp } from 'lucide-react';
import { SocialImpactCard } from '@/components/analytics/SocialImpactCard';
import { NaturePositiveCard } from '@/components/analytics/NaturePositiveCard';

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

const priorityConfig = {
  high: { color: 'var(--cb-text)', bg: 'var(--cb-surface)', border: '#f43f5e' },
  medium: { color: 'var(--cb-text)', bg: 'var(--cb-surface)', border: '#f59e0b' },
  low: { color: 'var(--cb-text)', bg: 'var(--cb-surface)', border: '#10b981' },
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
      topRecommendations: recommendations.slice(0, 3),
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
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#f43f5e';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'GOOD';
    if (score >= 40) return 'MODERATE';
    return 'AT RISK';
  };

  if (!visible) return null;

  const scoreColor = getScoreColor(resilienceScore);

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between py-2.5 cb-divider">
        <span className="cb-label">Resilience Score</span>
        <div className="flex items-center gap-2">
          <span
            className="cb-value"
            style={{ color: scoreColor }}
          >
            {resilienceScore}/100
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: `1px solid ${scoreColor}`,
              color: scoreColor,
              padding: '0px 5px',
            }}
          >
            {getScoreLabel(resilienceScore)}
          </span>
        </div>
      </div>

      <div className="py-2">
        <div
          style={{
            height: 2,
            backgroundColor: 'var(--cb-surface)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${resilienceScore}%`,
              backgroundColor: scoreColor,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {miniChartData && (
        <div className="py-3">
          <span className="cb-label mb-2 block">
            {mode === 'agriculture' && 'Soil Moisture Trend'}
            {mode === 'coastal' && 'Storm Surge Projection'}
            {mode === 'flood' && 'Infrastructure Capacity'}
          </span>
          <div
            style={{
              border: '1px solid var(--cb-border)',
              padding: 8,
            }}
          >
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
        </div>
      )}

      {topRecommendations.length > 0 && (
        <div className="py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb style={{ width: 10, height: 10, color: 'var(--cb-secondary)' }} />
            <span className="cb-label">Recommendations</span>
          </div>
          <div className="space-y-1.5">
            {topRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-2 py-1.5"
                style={{ borderLeft: `2px solid ${priorityConfig[rec.priority].border}`, paddingLeft: 8 }}
              >
                <span style={{ fontSize: 11, color: 'var(--cb-text)', flex: 1 }}>
                  {rec.title}
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 9,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    border: `1px solid ${priorityConfig[rec.priority].border}`,
                    color: priorityConfig[rec.priority].border,
                    padding: '0px 5px',
                  }}
                >
                  {rec.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'agriculture' && latitude !== null && (
        <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
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
            <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp style={{ width: 10, height: 10, color: '#10b981' }} />
                <span className="cb-label">Cumulative Cash Flow</span>
              </div>
              <CumulativeCashFlowChart
                capex={projectParams.capex}
                opex={projectParams.opex}
                yieldBenefit={projectParams.yieldBenefit}
                cropPrice={projectParams.cropPrice}
              />
            </div>
          )}
        </div>
      )}

      {mode === 'coastal' && coastalResults && (
        <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
          <SocialImpactCard
            livesProtected={coastalResults.avoidedLoss > 0 ? Math.round(coastalResults.avoidedLoss / 50) : 0}
            householdsSecured={coastalResults.avoidedLoss > 0 ? Math.round(coastalResults.avoidedLoss / 200) : 0}
          />
          {mangroveWidth > 0 && (
            <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
              <NaturePositiveCard
                carbonTons={Math.round(mangroveWidth * 3.67)}
                carbonValueUsd={Math.round(mangroveWidth * 3.67 * 35)}
                interventionType="mangroves"
              />
            </div>
          )}
          <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
            <CoastalAnalytics
              mangroveWidth={mangroveWidth}
              slope={coastalResults.slope}
              stormWave={coastalResults.stormWave}
              avoidedLoss={coastalResults.avoidedLoss}
              embedded
            />
          </div>
          <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
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
        </div>
      )}

      {mode === 'flood' && floodResults && (
        <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
          <SocialImpactCard
            livesProtected={floodResults.valueProtected > 0 ? Math.round(floodResults.valueProtected / 30) : 0}
            householdsSecured={floodResults.valueProtected > 0 ? Math.round(floodResults.valueProtected / 120) : 0}
          />
          {greenRoofsEnabled && (
            <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
              <NaturePositiveCard
                carbonTons={Math.round(45)}
                carbonValueUsd={Math.round(45 * 35)}
                interventionType="green_roofs"
              />
            </div>
          )}
          <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
            <FloodAnalytics
              greenRoofsEnabled={greenRoofsEnabled}
              permeablePavementEnabled={permeablePavementEnabled}
              floodDepthReduction={floodResults.floodDepthReduction}
              valueProtected={floodResults.valueProtected}
              embedded
            />
          </div>
          <div className="border-t border-[var(--cb-border)] pt-4 mt-4">
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
        </div>
      )}
    </div>
  );
};
