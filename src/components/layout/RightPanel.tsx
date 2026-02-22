import { useState, useCallback } from 'react';
import { X, MapPin, Landmark } from 'lucide-react';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { HealthResults } from '@/components/hud/HealthResultsPanel';
import { FloodFrequencyChart, StormChartDataItem } from '@/components/analytics/FloodFrequencyChart';
import { RainfallComparisonChart, RainfallChartData } from '@/components/analytics/RainfallComparisonChart';
import { DealTicketCard } from '@/components/hud/DealTicketCard';
import { RiskStressTestCard } from '@/components/hud/RiskStressTestCard';
import { SolutionEngineCard } from '@/components/hud/SolutionEngineCard';
import { LiveSiteViewCard } from '@/components/hud/LiveSiteViewCard';
import { ZoneLegend } from '@/components/dashboard/ZoneLegend';
import { UrbanInundationCard } from '@/components/dashboard/UrbanInundationCard';
import { InfrastructureRiskCard } from '@/components/dashboard/InfrastructureRiskCard';
import { PortfolioResultsPanel } from '@/components/portfolio/PortfolioResultsPanel';
import { ScenarioSandbox, type BondMetrics } from '@/components/hud/ScenarioSandbox';
import { PortfolioAsset } from '@/components/portfolio/PortfolioCSVUpload';
import { Polygon } from '@/utils/polygonMath';
import { ZoneMode } from '@/utils/zoneGeneration';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsHighlightsCard } from '@/components/hud/AnalyticsHighlightsCard';
import { ProjectParams } from '@/components/hud/InterventionWizardModal';
import { DefensiveProjectParams } from '@/components/hud/DefensiveInfrastructureModal';
import { PortfolioAnalysisResult, PortfolioSummary } from '@/types/portfolio';

interface AgricultureResults {
  avoidedLoss: number;
  riskReduction: number;
  yieldPotential?: number | null;
  monthlyData: { month: string; value: number }[];
}

interface CoastalResults {
  avoidedLoss: number;
  slope: number | null;
  stormWave: number | null;
  isUnderwater?: boolean;
  floodDepth?: number | null;
  seaLevelRise?: number;
  includeStormSurge?: boolean;
  stormChartData?: StormChartDataItem[];
  floodedUrbanKm2?: number | null;
  urbanImpactPct?: number | null;
}

interface FloodResults {
  floodDepthReduction: number;
  valueProtected: number;
  riskIncreasePct?: number | null;
  futureFloodAreaKm2?: number | null;
  rainChartData?: RainfallChartData[] | null;
  future100yr?: number | null;
  baseline100yr?: number | null;
}

interface SpatialAnalysis {
  baseline_sq_km: number;
  future_sq_km: number;
  loss_pct: number;
}

interface RightPanelProps {
  visible: boolean;
  onClose: () => void;
  mode: DashboardMode;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  showResults: boolean;
  agricultureResults?: AgricultureResults;
  coastalResults?: CoastalResults;
  floodResults?: FloodResults;
  healthResults?: HealthResults | null;
  mangroveWidth?: number;
  greenRoofsEnabled?: boolean;
  permeablePavementEnabled?: boolean;
  tempIncrease?: number;
  rainChange?: number;
  baselineZone: Polygon | null;
  currentZone: Polygon | null;
  globalTempTarget: number;
  spatialAnalysis?: SpatialAnalysis | null;
  isSpatialLoading?: boolean;
  cropType: string;
  portfolioAssets?: PortfolioAsset[];
  atlasFinancialData?: any;
  atlasMonteCarloData?: any;
  atlasExecutiveSummary?: string | null;
  atlasSensitivityData?: { primary_driver: string; driver_impact_pct: number; baseline_npv?: number; sensitivity_ranking?: { driver: string; shocked_npv: number; impact_pct: number }[] } | null;
  atlasAdaptationStrategy?: any;
  atlasSatellitePreview?: any;
  atlasMarketIntelligence?: any;
  atlasTemporalAnalysis?: any;
  atlasAdaptationPortfolio?: any;
  isFinanceSimulating?: boolean;
  chartData?: { rainfall: Array<{ month: string; historical: number; projected: number }>; soilMoisture: Array<{ month: string; moisture: number }> } | null;
  projectParams?: ProjectParams | null;
  defensiveProjectParams?: DefensiveProjectParams | null;
  assetLifespan?: number;
  dailyRevenue?: number;
  propertyValue?: number;
  polygonExposurePct?: number | null;
  portfolioResults?: PortfolioAnalysisResult | null;
}

const MODE_ACCENT: Record<DashboardMode, string> = {
  agriculture: '#10b981',
  coastal: '#14b8a6',
  flood: '#3b82f6',
  health: '#f43f5e',
  finance: '#f59e0b',
  portfolio: '#64748b',
};

function formatCurrency(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function MetricRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 cb-divider">
      <span className="cb-label">{label}</span>
      <span className="cb-value" style={accent ? { color: accent } : {}}>
        {value}
      </span>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div
      className="border-t pt-6 mt-6 px-4"
      style={{ borderColor: 'var(--cb-border)' }}
    >
      <span className="cb-section-heading">{title}</span>
    </div>
  );
}

export function RightPanel({
  visible,
  onClose,
  mode,
  locationName,
  latitude,
  longitude,
  isLoading,
  showResults,
  agricultureResults,
  coastalResults,
  floodResults,
  healthResults,
  mangroveWidth,
  greenRoofsEnabled,
  permeablePavementEnabled,
  tempIncrease,
  rainChange,
  baselineZone,
  currentZone,
  globalTempTarget,
  spatialAnalysis,
  isSpatialLoading,
  cropType,
  portfolioAssets,
  atlasFinancialData,
  atlasMonteCarloData,
  atlasExecutiveSummary,
  atlasSensitivityData,
  atlasAdaptationStrategy,
  atlasSatellitePreview,
  atlasMarketIntelligence,
  atlasTemporalAnalysis,
  atlasAdaptationPortfolio,
  isFinanceSimulating,
  chartData,
  projectParams,
  defensiveProjectParams,
  assetLifespan,
  dailyRevenue,
  propertyValue,
  polygonExposurePct,
  portfolioResults,
}: RightPanelProps) {
  if (!visible) return null;

  const accent = MODE_ACCENT[mode];
  const displayName = portfolioResults && mode === 'portfolio'
    ? 'Aggregate Portfolio'
    : (locationName ?? (latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'Selected Location'));

  return (
    <div
      className="hidden md:flex fixed top-0 right-0 h-full z-10 flex-col border-l"
      style={{
        width: 400,
        backgroundColor: 'color-mix(in srgb, var(--cb-bg) 95%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: 'var(--cb-border)',
      }}
    >
      <div
        className="shrink-0 flex items-center justify-between px-4 border-b"
        style={{ height: 48, borderColor: 'var(--cb-border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin style={{ width: 10, height: 10, color: accent, flexShrink: 0 }} />
          <span
            className="truncate"
            style={{ fontSize: 11, color: 'var(--cb-text)', letterSpacing: '0.02em' }}
          >
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="cb-label px-1.5 py-0.5"
            style={{ border: `1px solid ${accent}`, color: accent }}
          >
            {mode}
          </span>
          <button
            onClick={onClose}
            className="cb-icon-btn"
            style={{ width: 24, height: 24 }}
            title="Close"
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <RightPanelContent
          mode={mode}
          locationName={locationName}
          isLoading={isLoading}
          showResults={showResults}
          agricultureResults={agricultureResults}
          coastalResults={coastalResults}
          floodResults={floodResults}
          healthResults={healthResults}
          mangroveWidth={mangroveWidth}
          greenRoofsEnabled={greenRoofsEnabled}
          permeablePavementEnabled={permeablePavementEnabled}
          tempIncrease={tempIncrease}
          rainChange={rainChange}
          baselineZone={baselineZone}
          currentZone={currentZone}
          globalTempTarget={globalTempTarget}
          spatialAnalysis={spatialAnalysis}
          isSpatialLoading={isSpatialLoading}
          cropType={cropType}
          portfolioAssets={portfolioAssets}
          atlasFinancialData={atlasFinancialData}
          atlasMonteCarloData={atlasMonteCarloData}
          atlasExecutiveSummary={atlasExecutiveSummary}
          atlasSensitivityData={atlasSensitivityData}
          atlasAdaptationStrategy={atlasAdaptationStrategy}
          atlasSatellitePreview={atlasSatellitePreview}
          atlasMarketIntelligence={atlasMarketIntelligence}
          atlasTemporalAnalysis={atlasTemporalAnalysis}
          atlasAdaptationPortfolio={atlasAdaptationPortfolio}
          isFinanceSimulating={isFinanceSimulating}
          chartData={chartData}
          projectParams={projectParams}
          defensiveProjectParams={defensiveProjectParams}
          assetLifespan={assetLifespan}
          dailyRevenue={dailyRevenue}
          propertyValue={propertyValue}
          polygonExposurePct={polygonExposurePct}
          portfolioResults={portfolioResults}
          latitude={latitude}
          longitude={longitude}
        />
      </div>
    </div>
  );
}

export interface RightPanelContentProps {
  mode: DashboardMode;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isLoading: boolean;
  showResults: boolean;
  agricultureResults?: AgricultureResults;
  coastalResults?: CoastalResults;
  floodResults?: FloodResults;
  healthResults?: HealthResults | null;
  mangroveWidth?: number;
  greenRoofsEnabled?: boolean;
  permeablePavementEnabled?: boolean;
  tempIncrease?: number;
  rainChange?: number;
  baselineZone: Polygon | null;
  currentZone: Polygon | null;
  globalTempTarget: number;
  spatialAnalysis?: SpatialAnalysis | null;
  isSpatialLoading?: boolean;
  cropType: string;
  portfolioAssets?: PortfolioAsset[];
  atlasFinancialData?: any;
  atlasMonteCarloData?: any;
  atlasExecutiveSummary?: string | null;
  atlasSensitivityData?: { primary_driver: string; driver_impact_pct: number; baseline_npv?: number; sensitivity_ranking?: { driver: string; shocked_npv: number; impact_pct: number }[] } | null;
  atlasAdaptationStrategy?: any;
  atlasSatellitePreview?: any;
  atlasMarketIntelligence?: any;
  atlasTemporalAnalysis?: any;
  atlasAdaptationPortfolio?: any;
  isFinanceSimulating?: boolean;
  chartData?: { rainfall: Array<{ month: string; historical: number; projected: number }>; soilMoisture: Array<{ month: string; moisture: number }> } | null;
  projectParams?: ProjectParams | null;
  defensiveProjectParams?: DefensiveProjectParams | null;
  assetLifespan?: number;
  dailyRevenue?: number;
  propertyValue?: number;
  polygonExposurePct?: number | null;
  portfolioResults?: PortfolioAnalysisResult | null;
}

export function RightPanelContent({
  mode,
  locationName,
  latitude,
  longitude,
  isLoading,
  showResults,
  agricultureResults,
  coastalResults,
  floodResults,
  healthResults,
  mangroveWidth,
  greenRoofsEnabled,
  permeablePavementEnabled,
  tempIncrease,
  rainChange,
  baselineZone,
  currentZone,
  globalTempTarget,
  spatialAnalysis,
  isSpatialLoading,
  cropType,
  portfolioAssets,
  atlasFinancialData,
  atlasMonteCarloData,
  atlasExecutiveSummary,
  atlasSensitivityData,
  atlasAdaptationStrategy,
  atlasSatellitePreview,
  atlasMarketIntelligence,
  atlasTemporalAnalysis,
  atlasAdaptationPortfolio,
  isFinanceSimulating,
  chartData,
  projectParams,
  defensiveProjectParams,
  assetLifespan,
  dailyRevenue,
  propertyValue,
  polygonExposurePct,
  portfolioResults,
}: RightPanelContentProps) {
  if (isLoading) return <LoadingState />;

  // In portfolio mode: display assets from API (asset_results) or CSV (portfolioAssets).
  // Map backend snake_case (value, resilience_score, name, lat, lon) to UI shape (Value, score, Name, Lat, Lon).
  const portfolioDisplayAssets: (PortfolioAsset & { score?: number })[] =
    mode === 'portfolio' && portfolioResults?.asset_results?.length
      ? portfolioResults.asset_results.map((a) => ({
          Name: (a as Record<string, unknown>).name ?? a.name ?? 'Asset',
          Lat: a.lat,
          Lon: a.lon,
          Value: Number((a as Record<string, unknown>).value ?? a.value ?? 0),
          score: Number((a as Record<string, unknown>).resilience_score ?? a.resilience_score ?? undefined),
        }))
      : portfolioAssets ?? [];

  return (
    <>
      {mode === 'portfolio' && portfolioResults != null && portfolioResults.portfolio_summary != null && (
        <AggregatePortfolioSummary summary={portfolioResults.portfolio_summary} />
      )}
      {mode === 'portfolio' && (
        <PortfolioContent assets={portfolioDisplayAssets} />
      )}

      {mode === 'finance' && (
        <FinanceContent
          atlasFinancialData={atlasFinancialData}
          atlasMonteCarloData={atlasMonteCarloData}
          atlasExecutiveSummary={atlasExecutiveSummary}
          atlasSensitivityData={atlasSensitivityData}
          atlasAdaptationStrategy={atlasAdaptationStrategy}
          atlasAdaptationPortfolio={atlasAdaptationPortfolio}
          atlasSatellitePreview={atlasSatellitePreview}
          atlasMarketIntelligence={atlasMarketIntelligence}
          atlasTemporalAnalysis={atlasTemporalAnalysis}
          locationName={locationName}
          isLoading={isFinanceSimulating ?? false}
          latitude={latitude}
          longitude={longitude}
          cropType={cropType}
        />
      )}

      {mode === 'health' && (
        <HealthContent results={healthResults ?? null} visible={showResults} />
      )}

      {mode === 'agriculture' && showResults && agricultureResults && (
        <AgricultureContent
          results={agricultureResults}
          tempIncrease={tempIncrease}
          baselineZone={baselineZone}
          currentZone={currentZone}
          globalTempTarget={globalTempTarget}
          spatialAnalysis={spatialAnalysis}
          isSpatialLoading={isSpatialLoading}
          mode={mode}
          latitude={latitude}
          longitude={longitude}
          cropType={cropType}
          chartData={chartData}
          projectParams={projectParams}
          assetLifespan={assetLifespan}
          dailyRevenue={dailyRevenue}
          propertyValue={propertyValue}
        />
      )}

      {mode === 'coastal' && showResults && coastalResults && (
        <CoastalContent
          results={coastalResults}
          mangroveWidth={mangroveWidth ?? 100}
          baselineZone={baselineZone}
          currentZone={currentZone}
          globalTempTarget={globalTempTarget}
          mode={mode}
          latitude={latitude}
          longitude={longitude}
          defensiveProjectParams={defensiveProjectParams}
          assetLifespan={assetLifespan}
          dailyRevenue={dailyRevenue}
          propertyValue={propertyValue}
        />
      )}

      {mode === 'flood' && showResults && floodResults && (
        <FloodContent
          results={floodResults}
          greenRoofsEnabled={greenRoofsEnabled ?? false}
          permeablePavementEnabled={permeablePavementEnabled ?? false}
          rainChange={rainChange ?? 0}
          baselineZone={baselineZone}
          currentZone={currentZone}
          globalTempTarget={globalTempTarget}
          mode={mode}
          latitude={latitude}
          longitude={longitude}
          defensiveProjectParams={defensiveProjectParams}
          assetLifespan={assetLifespan}
          dailyRevenue={dailyRevenue}
          propertyValue={propertyValue}
        />
      )}

      {polygonExposurePct != null && showResults && (
        <AssetExposureRow exposurePct={polygonExposurePct} />
      )}

      {!showResults && mode !== 'finance' && mode !== 'portfolio' && (
        <div className="px-4 py-8 text-center">
          <p style={{ fontSize: 11, color: 'var(--cb-secondary)', lineHeight: 1.6 }}>
            Run a simulation to see results for this location.
          </p>
        </div>
      )}
    </>
  );
}

function AssetExposureRow({ exposurePct }: { exposurePct: number }) {
  const color = exposurePct >= 50 ? '#f43f5e' : exposurePct >= 25 ? '#f59e0b' : '#10b981';
  return (
    <div>
      <SectionDivider title="Zone Analysis" />
      <div className="px-4">
        <div className="flex items-center justify-between py-3 cb-divider">
          <span className="cb-label">Asset Exposure</span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 600,
              color,
            }}
          >
            {exposurePct}% of Asset Footprint Affected
          </span>
        </div>
        <div className="py-2">
          <div className="h-1.5 relative overflow-hidden" style={{ backgroundColor: 'var(--cb-border)' }}>
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(exposurePct, 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="px-4 py-4 space-y-3">
      <Skeleton className="h-3 w-24" style={{ backgroundColor: 'var(--cb-surface)' }} />
      <Skeleton className="h-8 w-32" style={{ backgroundColor: 'var(--cb-surface)' }} />
      <Skeleton className="h-3 w-full" style={{ backgroundColor: 'var(--cb-surface)' }} />
      <Skeleton className="h-3 w-4/5" style={{ backgroundColor: 'var(--cb-surface)' }} />
      <Skeleton className="h-24 w-full" style={{ backgroundColor: 'var(--cb-surface)' }} />
    </div>
  );
}

function AgricultureContent({
  results,
  tempIncrease,
  baselineZone,
  currentZone,
  globalTempTarget,
  spatialAnalysis,
  isSpatialLoading,
  mode,
  latitude,
  longitude,
  cropType,
  chartData,
  projectParams,
  assetLifespan,
  dailyRevenue,
  propertyValue,
}: {
  results: AgricultureResults;
  tempIncrease?: number;
  baselineZone: Polygon | null;
  currentZone: Polygon | null;
  globalTempTarget: number;
  spatialAnalysis?: { baseline_sq_km: number; future_sq_km: number; loss_pct: number } | null;
  isSpatialLoading?: boolean;
  mode: DashboardMode;
  latitude: number | null;
  longitude: number | null;
  cropType: string;
  chartData?: any;
  projectParams?: ProjectParams | null;
  assetLifespan?: number;
  dailyRevenue?: number;
  propertyValue?: number;
}) {
  const yp = results.yieldPotential ?? 0;
  const yieldColor = yp >= 70 ? '#10b981' : yp >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div>
      <SectionDivider title="Simulation Results" />
      <div className="px-4">
        <MetricRow
          label="Yield Potential"
          value={`${yp.toFixed(0)}%`}
          accent={yieldColor}
        />
        <MetricRow
          label="Avoided Loss"
          value={formatCurrency(results.avoidedLoss)}
          accent="#10b981"
        />
        <MetricRow
          label="Risk Reduction"
          value={`${results.riskReduction}%`}
          accent="#10b981"
        />
        {tempIncrease !== undefined && (
          <MetricRow
            label="Temp. Increase"
            value={`+${tempIncrease.toFixed(1)}°C`}
            accent="#f59e0b"
          />
        )}
      </div>

      {(baselineZone || currentZone) && (
        <>
          <SectionDivider title="Zone Analysis" />
          <div className="px-4 pt-3">
            <ZoneLegend
              baselineZone={baselineZone}
              currentZone={currentZone}
              mode={mode as ZoneMode}
              temperature={globalTempTarget - 1.4}
              visible={!!baselineZone && !!currentZone}
              spatialAnalysis={spatialAnalysis ?? null}
              isSpatialLoading={isSpatialLoading}
            />
          </div>
        </>
      )}

      <SectionDivider title="Detailed Analytics" />
      <div className="px-4 pt-3 pb-6">
        <AnalyticsHighlightsCard
          visible={true}
          mode={mode}
          latitude={latitude}
          longitude={longitude}
          temperature={globalTempTarget - 1.4}
          cropType={cropType}
          mangroveWidth={100}
          greenRoofsEnabled={false}
          permeablePavementEnabled={false}
          agricultureResults={{ avoidedLoss: results.avoidedLoss, riskReduction: results.riskReduction }}
          chartData={chartData ?? null}
          projectParams={projectParams ?? null}
          assetLifespan={assetLifespan}
          dailyRevenue={dailyRevenue}
          propertyValue={propertyValue}
        />
      </div>
    </div>
  );
}

function CoastalContent({
  results,
  mangroveWidth,
  baselineZone,
  currentZone,
  globalTempTarget,
  mode,
  latitude,
  longitude,
  defensiveProjectParams,
  assetLifespan,
  dailyRevenue,
  propertyValue,
}: {
  results: CoastalResults;
  mangroveWidth: number;
  baselineZone: Polygon | null;
  currentZone: Polygon | null;
  globalTempTarget: number;
  mode: DashboardMode;
  latitude: number | null;
  longitude: number | null;
  defensiveProjectParams?: DefensiveProjectParams | null;
  assetLifespan?: number;
  dailyRevenue?: number;
  propertyValue?: number;
}) {
  return (
    <div>
      <SectionDivider title="Simulation Results" />
      <div className="px-4">
        <MetricRow
          label="Status"
          value={results.isUnderwater ? 'Inundated' : 'Above Water'}
          accent={results.isUnderwater ? '#f43f5e' : '#10b981'}
        />
        {results.floodDepth != null && results.floodDepth > 0 && (
          <MetricRow label="Flood Depth" value={`${results.floodDepth.toFixed(2)} m`} accent="#f43f5e" />
        )}
        <MetricRow
          label="Sea Level Rise"
          value={`${(results.seaLevelRise ?? 0).toFixed(2)} m`}
          accent="#f59e0b"
        />
        {results.stormWave != null && (
          <MetricRow label="Storm Wave Height" value={`${results.stormWave.toFixed(1)} m`} />
        )}
        {results.slope != null && (
          <MetricRow label="Coastal Slope" value={`${results.slope.toFixed(1)}°`} />
        )}
        <MetricRow
          label="Avoided Loss"
          value={formatCurrency(results.avoidedLoss)}
          accent="#10b981"
        />
        <MetricRow label="Mangrove Belt" value={`${mangroveWidth} m`} />
      </div>

      {results.stormChartData && results.stormChartData.length > 0 && (
        <>
          <SectionDivider title="Storm Surge Frequency" />
          <div className="px-4 pt-3">
            <FloodFrequencyChart data={results.stormChartData} />
          </div>
        </>
      )}

      {results.floodedUrbanKm2 != null && (
        <>
          <SectionDivider title="Urban Inundation" />
          <div className="px-4 pt-3">
            <UrbanInundationCard
              visible={true}
              isLoading={false}
              floodedUrbanKm2={results.floodedUrbanKm2}
              urbanImpactPct={results.urbanImpactPct ?? null}
            />
          </div>
        </>
      )}

      <SectionDivider title="Detailed Analytics" />
      <div className="px-4 pt-3 pb-6">
        <AnalyticsHighlightsCard
          visible={true}
          mode={mode}
          latitude={latitude}
          longitude={longitude}
          temperature={globalTempTarget - 1.4}
          cropType=""
          mangroveWidth={mangroveWidth}
          greenRoofsEnabled={false}
          permeablePavementEnabled={false}
          coastalResults={results}
          defensiveProjectParams={defensiveProjectParams ?? null}
          assetLifespan={assetLifespan}
          dailyRevenue={dailyRevenue}
          propertyValue={propertyValue}
        />
      </div>
    </div>
  );
}

function FloodContent({
  results,
  greenRoofsEnabled,
  permeablePavementEnabled,
  rainChange,
  baselineZone,
  currentZone,
  globalTempTarget,
  mode,
  latitude,
  longitude,
  defensiveProjectParams,
  assetLifespan,
  dailyRevenue,
  propertyValue,
}: {
  results: FloodResults;
  greenRoofsEnabled: boolean;
  permeablePavementEnabled: boolean;
  rainChange: number;
  baselineZone: Polygon | null;
  currentZone: Polygon | null;
  globalTempTarget: number;
  mode: DashboardMode;
  latitude: number | null;
  longitude: number | null;
  defensiveProjectParams?: DefensiveProjectParams | null;
  assetLifespan?: number;
  dailyRevenue?: number;
  propertyValue?: number;
}) {
  return (
    <div>
      <SectionDivider title="Simulation Results" />
      <div className="px-4">
        {results.riskIncreasePct != null && (
          <MetricRow
            label="Climate Risk Increase"
            value={`+${results.riskIncreasePct.toFixed(1)}%`}
            accent={results.riskIncreasePct > 20 ? '#f43f5e' : '#f59e0b'}
          />
        )}
        <MetricRow
          label="Depth Reduction"
          value={`${results.floodDepthReduction.toFixed(1)} cm`}
          accent="#10b981"
        />
        <MetricRow
          label="Value Protected"
          value={formatCurrency(results.valueProtected)}
          accent="#10b981"
        />
        {results.futureFloodAreaKm2 != null && (
          <MetricRow label="Future Flood Area" value={`${results.futureFloodAreaKm2.toFixed(2)} km²`} accent="#3b82f6" />
        )}
        {results.baseline100yr != null && (
          <MetricRow label="Baseline 100yr Event" value={`${results.baseline100yr} mm`} />
        )}
        {results.future100yr != null && (
          <MetricRow label="Future 100yr Event" value={`${results.future100yr} mm`} accent="#f43f5e" />
        )}
      </div>

      {results.rainChartData && results.rainChartData.length > 0 && (
        <>
          <SectionDivider title="Rainfall Shift" />
          <div className="px-4 pt-3">
            <RainfallComparisonChart data={results.rainChartData} />
          </div>
        </>
      )}

      {(baselineZone || currentZone) && (
        <>
          <SectionDivider title="Zone Analysis" />
          <div className="px-4 pt-3">
            <ZoneLegend
              baselineZone={baselineZone}
              currentZone={currentZone}
              mode={mode as ZoneMode}
              temperature={globalTempTarget - 1.4}
              visible={!!baselineZone && !!currentZone}
            />
          </div>
        </>
      )}

      {results.futureFloodAreaKm2 != null && (
        <>
          <SectionDivider title="Infrastructure Risk" />
          <div className="px-4 pt-3">
            <InfrastructureRiskCard
              visible={true}
              isLoading={false}
              floodedKm2={results.futureFloodAreaKm2}
              riskPct={results.riskIncreasePct ?? null}
            />
          </div>
        </>
      )}

      <SectionDivider title="Detailed Analytics" />
      <div className="px-4 pt-3 pb-6">
        <AnalyticsHighlightsCard
          visible={true}
          mode={mode}
          latitude={latitude}
          longitude={longitude}
          temperature={globalTempTarget - 1.4}
          cropType=""
          mangroveWidth={100}
          greenRoofsEnabled={greenRoofsEnabled}
          permeablePavementEnabled={permeablePavementEnabled}
          floodResults={results}
          rainChange={rainChange}
          defensiveProjectParams={defensiveProjectParams ?? null}
          assetLifespan={assetLifespan}
          dailyRevenue={dailyRevenue}
          propertyValue={propertyValue}
        />
      </div>
    </div>
  );
}

function HealthContent({ results, visible }: { results: HealthResults | null; visible: boolean }) {
  if (!visible || !results) {
    return (
      <div className="px-4 py-6 text-center">
        <p style={{ fontSize: 11, color: 'var(--cb-secondary)' }}>Run simulation to see health results.</p>
      </div>
    );
  }

  const { productivity_loss_pct, economic_loss_daily, wbgt, projected_temp, malaria_risk, dengue_risk } = results;
  const lossColor = productivity_loss_pct >= 30 ? '#f43f5e' : productivity_loss_pct >= 15 ? '#f59e0b' : '#10b981';

  return (
    <div>
      <SectionDivider title="Heat Stress Results" />
      <div className="px-4">
        <MetricRow
          label="Productivity Loss"
          value={`${productivity_loss_pct.toFixed(1)}%`}
          accent={lossColor}
        />
        <MetricRow
          label="Daily Economic Loss"
          value={formatCurrency(economic_loss_daily)}
          accent={lossColor}
        />
        <MetricRow label="WBGT" value={`${wbgt.toFixed(1)}°C`} accent={wbgt >= 33 ? '#f43f5e' : '#f59e0b'} />
        <MetricRow label="Projected Temp" value={`${projected_temp.toFixed(1)}°C`} />
      </div>

      <SectionDivider title="Disease Risk" />
      <div className="px-4">
        <MetricRow
          label="Malaria Risk"
          value={malaria_risk}
          accent={malaria_risk === 'High' ? '#f43f5e' : malaria_risk === 'Medium' ? '#f59e0b' : '#10b981'}
        />
        <MetricRow
          label="Dengue Risk"
          value={dengue_risk}
          accent={dengue_risk === 'High' ? '#f43f5e' : dengue_risk === 'Medium' ? '#f59e0b' : '#10b981'}
        />
      </div>
    </div>
  );
}

function renderBoldSummary(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} style={{ color: 'var(--cb-text)', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function extractConfidence(text: string, fallback?: string): string | null {
  const m = text.match(/Model Confidence:\s*(\w+)/i);
  if (m) return m[1];
  return fallback ?? null;
}

function FinanceContent({
  atlasFinancialData,
  atlasMonteCarloData,
  atlasExecutiveSummary,
  atlasSensitivityData,
  atlasAdaptationStrategy,
  atlasAdaptationPortfolio,
  atlasSatellitePreview,
  atlasMarketIntelligence,
  atlasTemporalAnalysis,
  locationName,
  isLoading,
  latitude,
  longitude,
  cropType,
}: {
  atlasFinancialData: any;
  atlasMonteCarloData: any;
  atlasExecutiveSummary?: string | null;
  atlasSensitivityData?: { primary_driver: string; driver_impact_pct: number; baseline_npv?: number; sensitivity_ranking?: { driver: string; shocked_npv: number; impact_pct: number }[] } | null;
  atlasAdaptationStrategy?: any;
  atlasAdaptationPortfolio?: any;
  atlasSatellitePreview?: any;
  atlasMarketIntelligence?: any;
  atlasTemporalAnalysis?: any;
  locationName: string | null;
  isLoading: boolean;
  latitude?: number | null;
  longitude?: number | null;
  cropType?: string;
}) {
  const [localFinancialData, setLocalFinancialData] = useState<any>(null);
  const [localMonteCarloData, setLocalMonteCarloData] = useState<any>(null);
  const [localExecutiveSummary, setLocalExecutiveSummary] = useState<string | null>(null);
  const [localSensitivityData, setLocalSensitivityData] = useState<any>(null);
  const [localAdaptationStrategy, setLocalAdaptationStrategy] = useState<any>(null);
  const [localAdaptationPortfolio, setLocalAdaptationPortfolio] = useState<any>(null);
  const [localSatellitePreview, setLocalSatellitePreview] = useState<any>(null);
  const [localMarketIntelligence, setLocalMarketIntelligence] = useState<any>(null);
  const [localTemporalAnalysis, setLocalTemporalAnalysis] = useState<any>(null);
  const [cbaCapexBudget, setCbaCapexBudget] = useState<number | null>(null);
  const [cbaBondMetrics, setCbaBondMetrics] = useState<BondMetrics | null>(null);

  const activeFinancialData = localFinancialData ?? atlasFinancialData;
  const activeMonteCarloData = localMonteCarloData ?? atlasMonteCarloData;
  const activeExecutiveSummary = localExecutiveSummary ?? atlasExecutiveSummary;
  const activeSensitivityData = localSensitivityData ?? atlasSensitivityData;
  const activeAdaptationStrategy = localAdaptationStrategy ?? atlasAdaptationStrategy;
  const activeAdaptationPortfolio = localAdaptationPortfolio ?? atlasAdaptationPortfolio;
  const activeSatellitePreview = localSatellitePreview ?? atlasSatellitePreview;
  const activeMarketIntelligence = localMarketIntelligence ?? atlasMarketIntelligence;
  const activeTemporalAnalysis = localTemporalAnalysis ?? atlasTemporalAnalysis;

  const handleRecalculated = useCallback((data: {
    financialData: any;
    monteCarloData: any;
    executiveSummary: string | null;
    sensitivityData: any;
    adaptationStrategy: any;
    adaptationPortfolio: any;
    satellitePreview: any;
    marketIntelligence: any;
    temporalAnalysis: any;
  }) => {
    setLocalFinancialData(data.financialData);
    setLocalMonteCarloData(data.monteCarloData);
    setLocalExecutiveSummary(data.executiveSummary);
    setLocalSensitivityData(data.sensitivityData);
    setLocalAdaptationStrategy(data.adaptationStrategy);
    setLocalAdaptationPortfolio(data.adaptationPortfolio);
    setLocalSatellitePreview(data.satellitePreview);
    setLocalMarketIntelligence(data.marketIntelligence);
    setLocalTemporalAnalysis(data.temporalAnalysis);
  }, []);

  const handleCbaResult = useCallback((result: { bond_metrics: BondMetrics | null; capex_budget: number }) => {
    setCbaBondMetrics(result.bond_metrics);
    setCbaCapexBudget(result.capex_budget);
  }, []);

  const initialAssumptions = activeFinancialData?.assumptions ?? {};
  if (!activeFinancialData && !isLoading) {
    return (
      <div className="px-4 py-6 text-center">
        <Landmark style={{ width: 20, height: 20, color: 'var(--cb-secondary)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 11, color: 'var(--cb-secondary)', lineHeight: 1.6 }}>
          Select an atlas location or run a simulation to generate a Green Bond Term Sheet.
        </p>
      </div>
    );
  }

  const baselineNpv: number | null =
    activeSensitivityData?.baseline_npv ??
    activeFinancialData?.npv ??
    activeFinancialData?.metrics?.npv_usd?.mean ??
    null;

  const var95: number | null = activeMonteCarloData?.VaR_95 ?? activeMonteCarloData?.metrics?.npv_usd?.p5 ?? null;
  const primaryDriver: string | null = activeSensitivityData?.primary_driver ?? null;
  const sectorRank = activeMarketIntelligence?.sector_rank;

  return (
    <div>
      {activeSatellitePreview && (
        <div className="border-b" style={{ borderColor: 'var(--cb-border)' }}>
          <LiveSiteViewCard
            satellitePreview={activeSatellitePreview}
            marketIntelligence={activeMarketIntelligence}
            temporalAnalysis={activeTemporalAnalysis}
          />
        </div>
      )}

      {locationName && (
        <div className="px-4 pt-4 pb-4 border-b" style={{ borderColor: 'var(--cb-border)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--cb-text)', lineHeight: 1.2 }}>
            {locationName}
          </h2>
        </div>
      )}

      {(baselineNpv !== null || var95 !== null || primaryDriver || sectorRank) && (
        <>
          <SectionDivider title="Financial Overview" />
          <div className="px-4">
            {baselineNpv !== null && (
              <MetricRow
                label="Baseline NPV"
                value={formatCurrency(baselineNpv)}
                accent={baselineNpv >= 0 ? '#10b981' : '#f43f5e'}
              />
            )}
            {var95 !== null && (
              <MetricRow
                label="Value at Risk"
                value={formatCurrency(var95)}
                accent={var95 < 0 ? '#f43f5e' : '#10b981'}
              />
            )}
            {primaryDriver && (
              <MetricRow label="Primary Risk Driver" value={primaryDriver} accent="#f43f5e" />
            )}
            {sectorRank && (
              <MetricRow
                label="Sector Rank"
                value={`#${sectorRank.by_npv} / ${sectorRank.total_in_sector}`}
              />
            )}
          </div>
        </>
      )}

      {activeExecutiveSummary && (() => {
        const isCritical = activeExecutiveSummary.includes('CRITICAL WARNING');
        const confidence = extractConfidence(activeExecutiveSummary, activeMarketIntelligence?.confidence_score);
        const confidenceColor = confidence?.toLowerCase() === 'high' ? '#10b981'
          : confidence?.toLowerCase() === 'medium' ? '#f59e0b'
          : '#f43f5e';
        return (
          <>
            <div
              className="border-t pt-6 mt-6 px-4 flex items-center justify-between"
              style={{ borderColor: 'var(--cb-border)' }}
            >
              <span className="cb-section-heading">AI Analysis</span>
              {confidence && (
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 9,
                    letterSpacing: '0.06em',
                    border: `1px solid ${confidenceColor}`,
                    color: confidenceColor,
                    padding: '0px 5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {confidence.toUpperCase()} CONFIDENCE
                </span>
              )}
            </div>
            <div className="px-4 py-4">
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.7,
                  color: isCritical ? '#f43f5e' : 'var(--cb-secondary)',
                  borderLeft: `2px solid ${isCritical ? '#f43f5e' : '#f59e0b'}`,
                  paddingLeft: 12,
                  margin: 0,
                }}
              >
                {renderBoldSummary(activeExecutiveSummary)}
              </p>
            </div>
          </>
        );
      })()}

      <div className="border-t" style={{ borderColor: 'var(--cb-border)' }}>
        <DealTicketCard
          financialData={activeFinancialData}
          locationName={locationName}
          isLoading={isLoading}
          monteCarloData={activeMonteCarloData}
          capexBudget={cbaCapexBudget}
          bondMetrics={cbaBondMetrics}
        />
      </div>

      <div className="border-t" style={{ borderColor: 'var(--cb-border)' }}>
        <RiskStressTestCard monteCarloData={activeMonteCarloData} sensitivityData={activeSensitivityData} />
      </div>

      <div className="border-t" style={{ borderColor: 'var(--cb-border)' }}>
        <SolutionEngineCard strategy={activeAdaptationStrategy} portfolio={activeAdaptationPortfolio} />
      </div>

      <ScenarioSandbox
        latitude={latitude ?? null}
        longitude={longitude ?? null}
        cropType={cropType ?? ''}
        initialAssumptions={initialAssumptions}
        onRecalculated={handleRecalculated}
        onCbaResult={handleCbaResult}
      />

      <div style={{ height: 24 }} />
    </div>
  );
}

/** Aggregate Portfolio Analysis panel. Summary is guaranteed to have camelCase keys (totalPortfolioValue, etc.) from handleFileUpload mapping. */
function AggregatePortfolioSummary({ summary }: { summary: PortfolioSummary }) {
  const s = summary as Record<string, unknown>;
  const totalValue = Number(
    summary.totalPortfolioValue ?? s?.total_portfolio_value ?? summary.total_portfolio_value ?? 0
  );
  const totalVaR = Number(
    summary.totalValueAtRisk ?? s?.total_value_at_risk ?? summary.total_value_at_risk ?? 0
  );
  const avgScore =
    summary.averageResilienceScore ?? s?.average_resilience_score ?? summary.average_resilience_score ?? null;
  const avgScoreNum = avgScore != null ? Number(avgScore) : null;

  return (
    <div>
      <div
        className="border-b px-4 pt-6 pb-4"
        style={{ borderColor: 'var(--cb-border)' }}
      >
        <span
          className="cb-section-heading"
          style={{ fontSize: 9, letterSpacing: '0.12em' }}
        >
          AGGREGATE PORTFOLIO ANALYSIS
        </span>
      </div>
      <div className="px-4 py-6 space-y-6">
        <div>
          <p style={{ fontSize: 10, color: 'var(--cb-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Total Portfolio Value
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: 'var(--cb-text)',
              fontFamily: 'monospace',
            }}
          >
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 10, color: 'var(--cb-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Total Value at Risk
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: totalVaR > 0 ? '#f43f5e' : 'var(--cb-text)',
              fontFamily: 'monospace',
            }}
          >
            {formatCurrency(totalVaR)}
          </p>
        </div>
        {avgScoreNum != null && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--cb-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              Average Resilience Score
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 300,
                letterSpacing: '-0.02em',
                color: avgScoreNum >= 70 ? '#10b981' : avgScoreNum >= 40 ? '#f59e0b' : '#f43f5e',
                fontFamily: 'monospace',
              }}
            >
              {avgScoreNum.toFixed(0)}
              <span style={{ fontSize: 14, color: 'var(--cb-secondary)', fontWeight: 400 }}> / 100</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioContent({ assets }: { assets: PortfolioAsset[] }) {
  const hasScores = assets.some((a) => 'score' in a);
  if (!hasScores) {
    return (
      <div className="px-4 py-6 text-center">
        <p style={{ fontSize: 11, color: 'var(--cb-secondary)', lineHeight: 1.6 }}>
          Upload a portfolio CSV to view risk screening results.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PortfolioResultsPanel assets={assets} visible={hasScores} />
    </div>
  );
}
