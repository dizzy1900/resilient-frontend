import { useState, useCallback, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ComparativeDiffView } from './ComparativeDiffView';
import { X, MapPin, Landmark, Download, Loader2, Sparkles } from 'lucide-react';
import { fetchWithRetry } from '@/utils/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { TCFDReportTemplate } from '@/components/report/TCFDReportTemplate';
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
import { BlendedFinanceCard, type BlendedFinanceData } from '@/components/hud/BlendedFinanceCard';
import { DefensiveProjectParams } from '@/components/hud/DefensiveInfrastructureModal';
import { PortfolioAnalysisResult, PortfolioSummary } from '@/types/portfolio';

interface AgricultureResults {
  avoidedLoss: number;
  riskReduction: number;
  yieldPotential?: number | null;
  transitionCapex?: number | null;
  avoidedRevenueLoss?: number | null;
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
  avoidedBusinessInterruption?: number | null;
  adjusted_lifespan?: number | null;
  lifespan_penalty?: number | null;
  adjusted_opex?: number | null;
  opex_climate_penalty?: number | null;
  /** CamelCase from Index state (fetch maps to these) */
  adjustedLifespan?: number | null;
  adjustedOpex?: number | null;
  opexClimatePenalty?: number | null;
}

interface FloodResults {
  floodDepthReduction: number;
  valueProtected: number;
  riskIncreasePct?: number | null;
  futureFloodAreaKm2?: number | null;
  rainChartData?: RainfallChartData[] | null;
  future100yr?: number | null;
  baseline100yr?: number | null;
  avoidedBusinessInterruption?: number | null;
  adjusted_lifespan?: number | null;
  lifespan_penalty?: number | null;
  adjusted_opex?: number | null;
  opex_climate_penalty?: number | null;
  /** CamelCase form from Index.tsx state */
  adjustedOpex?: number | null;
  opexClimatePenalty?: number | null;
  adjustedLifespan?: number | null;
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
  ndviData?: { month: string; value: number }[];
  isNdviLoading?: boolean;
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
  polygonTotalArea?: number | null;
  polygonExposedArea?: number | null;
  polygonTotalAssetValue?: number | null;
  polygonExposedValue?: number | null;
  polygonValueAtRisk?: number | null;
  polygonProtectedValue?: number | null;
  portfolioResults?: PortfolioAnalysisResult | null;
  priceShockData?: any;
  isSplitMode?: boolean;
  scenarioAgriResults?: AgricultureResults;
  scenarioCoastalResults?: CoastalResults;
  scenarioFloodResults?: FloodResults;
  scenarioHealthResults?: HealthResults | null;
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

/** Format as currency without cents (e.g. $120,000). Safe for NaN/undefined. */
function formatCurrencyNoCents(value: number | undefined | null): string {
  const n = Number(value);
  if (n !== n) return '$0';
  return `$${Math.round(n).toLocaleString('en-US', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
}

/** Format as percentage with at most 1 decimal place. Safe for NaN/undefined. */
function formatPercent(value: number | undefined | null): string {
  const n = Number(value);
  if (n !== n) return '0%';
  const rounded = Math.round(n * 10) / 10;
  return `${rounded.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`;
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
  ndviData,
  isNdviLoading,
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
  polygonTotalArea,
  polygonExposedArea,
  polygonTotalAssetValue,
  polygonExposedValue,
  polygonValueAtRisk,
  polygonProtectedValue,
  portfolioResults,
  priceShockData,
  isSplitMode,
  scenarioAgriResults,
  scenarioCoastalResults,
  scenarioFloodResults,
  scenarioHealthResults,
}: RightPanelProps) {
  const [blendedData, setBlendedData] = useState<BlendedFinanceData | null>(null);

  if (!visible) return null;

  const accent = MODE_ACCENT[mode];
  const displayName = portfolioResults && mode === 'portfolio'
    ? 'Aggregate Portfolio'
    : (locationName ?? (latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'Selected Location'));

  const showComparative = isSplitMode && showResults && (
    (mode === 'agriculture' && agricultureResults && scenarioAgriResults) ||
    (mode === 'coastal' && coastalResults && scenarioCoastalResults) ||
    (mode === 'flood' && floodResults && scenarioFloodResults) ||
    (mode === 'health' && healthResults && scenarioHealthResults)
  );

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
          {isSplitMode && (
            <span
              className="cb-label px-1.5 py-0.5"
              style={{ border: '1px solid #f59e0b', color: '#f59e0b', fontSize: 8 }}
            >
              TWIN
            </span>
          )}
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
        <div id="report-content">
          {showComparative ? (
            <ComparativeDiffView
              mode={mode}
              locationName={locationName}
              baselineAgriculture={agricultureResults}
              scenarioAgriculture={scenarioAgriResults}
              baselineCoastal={coastalResults}
              scenarioCoastal={scenarioCoastalResults}
              baselineFlood={floodResults}
              scenarioFlood={scenarioFloodResults}
              baselineHealth={healthResults}
              scenarioHealth={scenarioHealthResults}
            />
          ) : (
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
              ndviData={ndviData}
              isNdviLoading={isNdviLoading}
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
              polygonTotalArea={polygonTotalArea}
              polygonExposedArea={polygonExposedArea}
              polygonTotalAssetValue={polygonTotalAssetValue}
              polygonExposedValue={polygonExposedValue}
              polygonValueAtRisk={polygonValueAtRisk}
              polygonProtectedValue={polygonProtectedValue}
              portfolioResults={portfolioResults}
              priceShockData={priceShockData}
              latitude={latitude}
              longitude={longitude}
              isSplitMode={isSplitMode}
              scenarioAgriResults={scenarioAgriResults}
              scenarioFloodResults={scenarioFloodResults}
              onBlendedResultChange={setBlendedData}
            />
          )}
        </div>

        {showResults && (
          <ExportPDFButton
            locationName={locationName || (latitude && longitude ? `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}` : 'Unknown Location')}
            mode={mode}
            isDigitalTwin={!!isSplitMode}
            executiveSummary={atlasExecutiveSummary}
            agricultureResults={agricultureResults}
            coastalResults={coastalResults}
            floodResults={floodResults}
            healthResults={healthResults}
            scenarioAgriResults={scenarioAgriResults}
            scenarioCoastalResults={scenarioCoastalResults}
            scenarioFloodResults={scenarioFloodResults}
            scenarioHealthResults={scenarioHealthResults}
            blendedData={blendedData}
          />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── helpers for metric extraction ──────────────────────────── */

function buildBaselineMetrics(
  mode: DashboardMode,
  agri?: any,
  coastal?: any,
  flood?: any,
  health?: any,
): Record<string, string | number> {
  const m: Record<string, string | number> = {};
  if (mode === 'agriculture' && agri) {
    m['Yield Potential'] = `${agri.yieldPotential ?? 0}%`;
    m['Transition Capex'] = `$${(agri.transitionCapex ?? 0).toLocaleString()}`;
    m['Avoided Revenue Loss'] = `$${(agri.avoidedRevenueLoss ?? agri.avoidedLoss ?? 0).toLocaleString()}`;
    m['Risk Reduction'] = `${agri.riskReduction ?? 0}%`;
  } else if (mode === 'coastal' && coastal) {
    m['Avoided Loss'] = `$${(coastal.avoidedLoss ?? 0).toLocaleString()}`;
    m['Climate-Adjusted Lifespan'] = `${coastal.adjustedLifespan ?? coastal.adjusted_lifespan ?? 0} yrs`;
    m['Climate-Adjusted Opex'] = `$${(coastal.adjustedOpex ?? coastal.adjusted_opex ?? 0).toLocaleString()}/yr`;
    if (coastal.stormWave != null) m['Storm Wave Height'] = `${coastal.stormWave}m`;
  } else if (mode === 'flood' && flood) {
    m['Flood Depth Reduction'] = `${flood.floodDepthReduction ?? 0} cm`;
    m['Value Protected'] = `$${(flood.valueProtected ?? 0).toLocaleString()}`;
    m['Risk Increase'] = `${flood.riskIncreasePct ?? 0}%`;
    m['Climate-Adjusted Lifespan'] = `${flood.adjustedLifespan ?? flood.adjusted_lifespan ?? 0} yrs`;
    m['Climate-Adjusted Opex'] = `$${(flood.adjustedOpex ?? flood.adjusted_opex ?? 0).toLocaleString()}/yr`;
  } else if (mode === 'health' && health) {
    m['DALY Burden'] = `${health.daly_per_100k ?? 0} / 100k`;
    m['Annual Mortality'] = `${health.annual_mortality ?? 0}`;
    m['Economic Cost'] = `$${(health.economic_cost_usd ?? 0).toLocaleString()}`;
    m['Vulnerable Pop.'] = `${health.vulnerable_population_pct ?? 0}%`;
  }
  return m;
}

function buildDeltaMetrics(
  _mode: DashboardMode,
  baseline: Record<string, string | number>,
  scenario: Record<string, string | number>,
): Record<string, string> {
  const d: Record<string, string> = {};
  for (const key of Object.keys(baseline)) {
    const bStr = String(baseline[key]).replace(/[^0-9.\-]/g, '');
    const sStr = String(scenario[key]).replace(/[^0-9.\-]/g, '');
    const bVal = parseFloat(bStr);
    const sVal = parseFloat(sStr);
    if (!isNaN(bVal) && !isNaN(sVal) && bVal !== 0) {
      const pct = ((sVal - bVal) / Math.abs(bVal) * 100).toFixed(1);
      d[key] = `${Number(pct) >= 0 ? '+' : ''}${pct}%`;
    }
  }
  return d;
}

/* ──────────────────────────── ExportPDFButton ──────────────────────────── */

interface ExportPDFButtonProps {
  locationName: string;
  mode: DashboardMode;
  isDigitalTwin: boolean;
  executiveSummary?: string | null;
  agricultureResults?: any;
  coastalResults?: any;
  floodResults?: any;
  healthResults?: any;
  scenarioAgriResults?: any;
  scenarioCoastalResults?: any;
  scenarioFloodResults?: any;
  scenarioHealthResults?: any;
  blendedData?: BlendedFinanceData | null;
}

function ExportPDFButton({
  locationName,
  mode,
  isDigitalTwin,
  executiveSummary,
  agricultureResults,
  coastalResults,
  floodResults,
  healthResults,
  scenarioAgriResults,
  scenarioCoastalResults,
  scenarioFloodResults,
  scenarioHealthResults,
  blendedData,
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const baselineMetrics = useMemo(
    () => buildBaselineMetrics(mode, agricultureResults, coastalResults, floodResults, healthResults),
    [mode, agricultureResults, coastalResults, floodResults, healthResults],
  );

  const scenarioMetrics = useMemo(() => {
    if (!isDigitalTwin) return null;
    return buildBaselineMetrics(mode, scenarioAgriResults, scenarioCoastalResults, scenarioFloodResults, scenarioHealthResults);
  }, [mode, isDigitalTwin, scenarioAgriResults, scenarioCoastalResults, scenarioFloodResults, scenarioHealthResults]);

  const deltaMetrics = useMemo(() => {
    if (!scenarioMetrics) return null;
    return buildDeltaMetrics(mode, baselineMetrics, scenarioMetrics);
  }, [mode, baselineMetrics, scenarioMetrics]);

  const dateStr = new Date().toISOString().split('T')[0];

  const [liveSummary, setLiveSummary] = useState<string | null>(null);

  // Track externally-provided summary
  useEffect(() => { setLiveSummary(executiveSummary ?? null); }, [executiveSummary]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Auto-generate briefing if missing
      let summary = liveSummary;
      if (!summary) {
        try {
          const activeData =
            mode === 'health' ? healthResults :
            mode === 'agriculture' ? agricultureResults :
            mode === 'coastal' ? coastalResults :
            mode === 'flood' ? floodResults : null;
          const payloadModuleName = (mode === 'health' && activeData?.public_health_analysis) ? 'health_public' : mode;
          const res = await fetchWithRetry(
            'https://web-production-8ff9e.up.railway.app/api/v1/ai/executive-summary',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ module_name: payloadModuleName, location_name: locationName, simulation_data: activeData }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            summary = data.summary_text ?? data.summary ?? null;
            if (summary) setLiveSummary(summary);
          }
        } catch (aiErr) {
          console.warn('[PDF] Auto-briefing failed, proceeding without:', aiErr);
        }
      }

      await new Promise(r => setTimeout(r, 200));
      const el = document.getElementById('tcfd-report-template');
      if (!el) { console.warn('[PDF] TCFD template not found'); return; }

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png');
      const pxToMm = 25.4 / 96;
      let imgW = canvas.width * pxToMm;
      let imgH = canvas.height * pxToMm;
      const scale = Math.min(pageW / imgW, pageH / imgH, 1) * 0.95;
      imgW *= scale;
      imgH *= scale;
      pdf.addImage(imgData, 'PNG', (pageW - imgW) / 2, (pageH - imgH) / 2, imgW, imgH);
      pdf.save('Resilient_TCFD_Prospectus.pdf');
    } catch (err) {
      console.error('[PDF] Export failed', err);
    } finally {
      setIsExporting(false);
    }
  }, [liveSummary, mode, locationName, healthResults, agricultureResults, coastalResults, floodResults]);

  return (
    <>
      <TCFDReportTemplate
        mode={mode}
        locationName={locationName}
        date={dateStr}
        executiveSummary={liveSummary}
        baselineMetrics={baselineMetrics}
        scenarioMetrics={scenarioMetrics}
        deltaMetrics={deltaMetrics}
        isDigitalTwin={isDigitalTwin}
        baselineResults={mode === 'agriculture' ? agricultureResults : mode === 'coastal' ? coastalResults : mode === 'flood' ? floodResults : mode === 'health' ? healthResults : null}
        scenarioResults={mode === 'agriculture' ? scenarioAgriResults : mode === 'coastal' ? scenarioCoastalResults : mode === 'flood' ? scenarioFloodResults : mode === 'health' ? scenarioHealthResults : null}
      />
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--cb-border)' }} data-html2canvas-ignore="true">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 w-full"
          style={{
            border: '1px solid var(--cb-border)',
            padding: '8px 16px',
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: isExporting ? 'var(--cb-secondary)' : 'var(--cb-text)',
            backgroundColor: 'transparent',
            cursor: isExporting ? 'wait' : 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
            opacity: isExporting ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!isExporting) (e.currentTarget.style.borderColor = 'var(--cb-text)'); }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cb-border)'; }}
        >
          {isExporting ? (
            <><Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> GENERATING PROSPECTUS...</>
          ) : (
            <><Download style={{ width: 12, height: 12 }} /> DOWNLOAD TCFD PROSPECTUS</>
          )}
        </button>
      </div>
    </>
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
  ndviData?: { month: string; value: number }[];
  isNdviLoading?: boolean;
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
  polygonTotalArea?: number | null;
  polygonExposedArea?: number | null;
  polygonTotalAssetValue?: number | null;
  polygonExposedValue?: number | null;
  polygonValueAtRisk?: number | null;
  polygonProtectedValue?: number | null;
  portfolioResults?: PortfolioAnalysisResult | null;
  priceShockData?: any;
  isSplitMode?: boolean;
  scenarioAgriResults?: AgricultureResults;
  scenarioFloodResults?: FloodResults;
  onBlendedResultChange?: (data: BlendedFinanceData | null) => void;
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
  ndviData,
  isNdviLoading,
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
  polygonTotalArea,
  polygonExposedArea,
  polygonTotalAssetValue,
  polygonExposedValue,
  polygonValueAtRisk,
  polygonProtectedValue,
  portfolioResults,
  priceShockData,
  isSplitMode,
  scenarioAgriResults,
  scenarioFloodResults,
}: RightPanelContentProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    setAiSummary(null);
  }, [mode, locationName, healthResults, agricultureResults, coastalResults, floodResults]);

  const generateExecutiveSummary = useCallback(async () => {
    setIsGeneratingAi(true);
    try {
      const activeData =
        mode === 'health' ? healthResults :
        mode === 'agriculture' ? agricultureResults :
        mode === 'coastal' ? coastalResults :
        mode === 'flood' ? floodResults :
        mode === 'finance' ? atlasFinancialData : null;

      const payloadModuleName = (mode === 'health' && activeData?.public_health_analysis) ? 'health_public' : mode;

      const res = await fetchWithRetry(
        'https://web-production-8ff9e.up.railway.app/api/v1/ai/executive-summary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_name: payloadModuleName,
            location_name: locationName || 'Unknown Location',
            simulation_data: activeData,
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiSummary(data.summary_text ?? data.summary ?? null);
    } catch (err) {
      console.error('[Executive Summary]', err);
      setAiSummary(null);
    } finally {
      setIsGeneratingAi(false);
    }
  }, [mode, locationName, healthResults, agricultureResults, coastalResults, floodResults, atlasFinancialData]);

  if (isLoading) return <LoadingState />;

  // In portfolio mode: display assets from API (asset_results) or CSV (portfolioAssets).
  // Map backend snake_case (value, resilience_score, name, lat, lon) to UI shape (Value, score, Name, Lat, Lon).
  const portfolioDisplayAssets: (PortfolioAsset & { score?: number })[] =
    mode === 'portfolio' && portfolioResults?.asset_results?.length
      ? portfolioResults.asset_results.map((a) => {
          const rec = a as unknown as Record<string, unknown>;
          return {
            Name: String(rec.name ?? a.name ?? 'Asset'),
            Lat: a.lat,
            Lon: a.lon,
            Value: Number(rec.value ?? a.value ?? 0),
            crop_type: String(rec.crop_type ?? 'maize'),
            score: Number(rec.resilience_score ?? a.resilience_score ?? undefined),
          };
        })
      : portfolioAssets ?? [];

  return (
    <>
      {/* Executive Insight */}
      {showResults && mode !== 'portfolio' && (
        <div className="px-4 pt-4 pb-2">
          <span className="cb-section-heading">✨ EXECUTIVE INSIGHT</span>
          {aiSummary ? (
            <div
              className="mt-2 rounded-md px-3 py-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cb-bg) 80%, var(--cb-text) 5%)',
                border: '1px solid var(--cb-border)',
              }}
            >
              <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--cb-text)' }}>
                {aiSummary}
              </p>
            </div>
          ) : isGeneratingAi ? (
            <div className="mt-2 flex items-center gap-2" style={{ color: 'var(--cb-secondary)', fontSize: 10 }}>
              <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
              Synthesizing data…
            </div>
          ) : (
            <button
              type="button"
              onClick={generateExecutiveSummary}
              className="mt-2 flex items-center gap-1.5"
              style={{
                fontSize: 10,
                letterSpacing: '0.06em',
                color: 'var(--cb-secondary)',
                background: 'none',
                border: '1px solid var(--cb-border)',
                padding: '5px 10px',
                cursor: 'pointer',
                transition: 'color 0.15s',
                fontFamily: 'monospace',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--cb-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--cb-secondary)')}
            >
              <Sparkles style={{ width: 10, height: 10 }} /> GENERATE BRIEFING
            </button>
          )}
        </div>
      )}

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
          propertyValue={propertyValue}
        />
      )}

      {mode === 'health' && (
        <HealthContent results={healthResults ?? null} visible={showResults} />
      )}

      {mode === 'agriculture' && showResults && agricultureResults && (
        isSplitMode && scenarioAgriResults ? (
          <AgriComparativeInline baseline={agricultureResults} scenario={scenarioAgriResults} />
        ) : (
          <AgricultureContent
            results={agricultureResults}
            tempIncrease={tempIncrease}
            baselineZone={baselineZone}
            currentZone={currentZone}
            globalTempTarget={globalTempTarget}
            spatialAnalysis={spatialAnalysis}
            isSpatialLoading={isSpatialLoading}
            ndviData={ndviData}
            isNdviLoading={isNdviLoading}
            mode={mode}
            latitude={latitude}
            longitude={longitude}
            cropType={cropType}
            chartData={chartData}
            projectParams={projectParams}
            assetLifespan={assetLifespan}
            dailyRevenue={dailyRevenue}
            propertyValue={propertyValue}
            priceShockData={priceShockData}
          />
        )
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
        <PolygonDigitalTwinBlock
          exposurePct={polygonExposurePct}
          totalArea={polygonTotalArea}
          exposedArea={polygonExposedArea}
          totalAssetValue={polygonTotalAssetValue}
          exposedValue={polygonExposedValue}
          valueAtRisk={polygonValueAtRisk}
          protectedValue={polygonProtectedValue}
        />
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

/** Format area for Digital Twin panel (e.g. "1.25 sq km"). */
function formatAreaSqKm(value: number | undefined | null): string {
  const n = Number(value);
  if (n !== n) return '0 sq km';
  return `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 })} sq km`;
}

function PolygonDigitalTwinBlock({
  exposurePct,
  totalArea,
  exposedArea,
  totalAssetValue,
  exposedValue,
  valueAtRisk,
  protectedValue,
}: {
  exposurePct: number;
  totalArea?: number | null;
  exposedArea?: number | null;
  totalAssetValue?: number | null;
  exposedValue?: number | null;
  valueAtRisk?: number | null;
  protectedValue?: number | null;
}) {
  const color = exposurePct >= 50 ? '#f43f5e' : exposurePct >= 25 ? '#f59e0b' : '#10b981';
  return (
    <div>
      <SectionDivider title="Zone Analysis" />
      <div className="px-4">
        <div className="flex items-center justify-between py-3 cb-divider">
          <span className="cb-label">Asset Exposure</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color }}>
            {formatPercent(exposurePct)} of Asset Footprint Affected
          </span>
        </div>
        <div className="py-2">
          <div className="h-1.5 relative overflow-hidden" style={{ backgroundColor: 'var(--cb-border)' }}>
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(exposurePct, 100)}%`, backgroundColor: color }}
            />
          </div>
        </div>
        {(totalArea != null || exposedArea != null) && (
          <>
            <MetricRow label="Total Area" value={formatAreaSqKm(totalArea)} />
            <MetricRow label="Exposed Area" value={formatAreaSqKm(exposedArea)} />
          </>
        )}
        {(totalAssetValue != null || exposedValue != null || valueAtRisk != null || protectedValue != null) && (
          <>
            <MetricRow label="Total Asset Value" value={formatCurrencyNoCents(totalAssetValue)} />
            <MetricRow label="Exposed Value" value={formatCurrencyNoCents(exposedValue)} accent="#f59e0b" />
            <MetricRow label="Value at Risk" value={formatCurrencyNoCents(valueAtRisk)} accent="#f43f5e" />
            <MetricRow label="Protected Value" value={formatCurrencyNoCents(protectedValue)} accent="#10b981" />
          </>
        )}
      </div>
    </div>
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

function AgriComparativeInline({ baseline, scenario }: { baseline: AgricultureResults; scenario: AgricultureResults }) {
  const bYield = baseline.yieldPotential ?? 0;
  const sYield = scenario.yieldPotential ?? 0;
  const bCapex = baseline.transitionCapex ?? 0;
  const sCapex = scenario.transitionCapex ?? 0;
  const bLoss = baseline.avoidedLoss ?? 0;
  const sLoss = scenario.avoidedLoss ?? 0;
  const bRisk = baseline.riskReduction ?? 0;
  const sRisk = scenario.riskReduction ?? 0;

  function delta(b: number, s: number): number | null {
    if (b === 0 && s === 0) return null;
    if (b === 0) return s > 0 ? 100 : -100;
    return ((s - b) / Math.abs(b)) * 100;
  }

  function DeltaTag({ d, invert = false }: { d: number | null; invert?: boolean }) {
    if (d == null) return null;
    const color = invert ? (d >= 0 ? '#f43f5e' : '#10b981') : (d >= 0 ? '#10b981' : '#f43f5e');
    return (
      <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 600, color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, padding: '2px 6px', letterSpacing: '0.04em' }}>
        Δ {d >= 0 ? '+' : ''}{Math.round(d)}%
      </span>
    );
  }

  function Row({ label, bVal, sVal, bDisp, sDisp, invert = false }: { label: string; bVal: number; sVal: number; bDisp: string; sDisp: string; invert?: boolean }) {
    const d = delta(bVal, sVal);
    const sColor = d != null ? (invert ? (d >= 0 ? '#f43f5e' : '#10b981') : (d >= 0 ? '#10b981' : '#f43f5e')) : 'var(--cb-text)';
    return (
      <div style={{ borderBottom: '1px solid var(--cb-border)', paddingTop: 8, paddingBottom: 8 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', color: 'var(--cb-secondary)', textTransform: 'uppercase' as const }}>{label}</span>
          <DeltaTag d={d} invert={invert} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center py-1.5 rounded" style={{ backgroundColor: 'var(--cb-surface)' }}>
            <p style={{ fontSize: 8, color: 'var(--cb-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 2 }}>Baseline</p>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--cb-text)' }}>{bDisp}</span>
          </div>
          <div className="text-center py-1.5 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--cb-surface) 80%, transparent)', border: `1px solid color-mix(in srgb, ${sColor} 30%, transparent)` }}>
            <p style={{ fontSize: 8, color: 'var(--cb-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 2 }}>Scenario</p>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: sColor }}>{sDisp}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-t pt-6 mt-6 px-4" style={{ borderColor: 'var(--cb-border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px flex-1" style={{ backgroundColor: '#10b981' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: '#10b981', fontWeight: 600 }}>COMPARATIVE ANALYSIS</span>
          <div className="h-px flex-1" style={{ backgroundColor: '#10b981' }} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center py-1" style={{ borderBottom: '2px solid var(--cb-border)' }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em', color: 'var(--cb-secondary)' }}>BASELINE</span>
          </div>
          <div className="text-center py-1" style={{ borderBottom: '2px solid #10b981' }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em', color: '#10b981' }}>SCENARIO</span>
          </div>
        </div>
      </div>
      <div className="px-4 pt-2">
        <Row label="Yield Potential" bVal={bYield} sVal={sYield} bDisp={`${bYield.toFixed(0)}%`} sDisp={`${sYield.toFixed(0)}%`} />
        <Row label="Transition Capex" bVal={bCapex} sVal={sCapex} bDisp={formatCurrencyNoCents(bCapex)} sDisp={formatCurrencyNoCents(sCapex)} invert />
        <Row label="Avoided Loss" bVal={bLoss} sVal={sLoss} bDisp={formatCurrencyNoCents(bLoss)} sDisp={formatCurrencyNoCents(sLoss)} />
        <Row label="Risk Reduction" bVal={bRisk} sVal={sRisk} bDisp={formatPercent(bRisk)} sDisp={formatPercent(sRisk)} />
      </div>
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
  ndviData,
  isNdviLoading,
  mode,
  latitude,
  longitude,
  cropType,
  chartData,
  projectParams,
  assetLifespan,
  dailyRevenue,
  propertyValue,
  priceShockData,
}: {
  results: AgricultureResults;
  tempIncrease?: number;
  baselineZone: Polygon | null;
  currentZone: Polygon | null;
  globalTempTarget: number;
  spatialAnalysis?: { baseline_sq_km: number; future_sq_km: number; loss_pct: number } | null;
  isSpatialLoading?: boolean;
  ndviData?: { month: string; value: number }[];
  isNdviLoading?: boolean;
  mode: DashboardMode;
  latitude: number | null;
  longitude: number | null;
  cropType: string;
  chartData?: any;
  projectParams?: ProjectParams | null;
  assetLifespan?: number;
  dailyRevenue?: number;
  propertyValue?: number;
  priceShockData?: any;
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
          label="Transition Capex"
          value={formatCurrencyNoCents(results.transitionCapex)}
          accent="#f59e0b"
        />
        <MetricRow
          label="Avoided Loss"
          value={formatCurrencyNoCents(results.avoidedLoss)}
          accent="#10b981"
        />
        <MetricRow
          label="Risk Reduction"
          value={formatPercent(results.riskReduction)}
          accent="#10b981"
        />
        {results.avoidedRevenueLoss != null && results.avoidedRevenueLoss > 0 && (
          <MetricRow
            label="Avoided Revenue Loss"
            value={formatCurrency(results.avoidedRevenueLoss)}
            accent="#10b981"
          />
        )}
        {tempIncrease !== undefined && (
          <MetricRow
            label="Temp. Increase"
            value={`+${tempIncrease.toFixed(1)}°C`}
            accent="#f59e0b"
          />
        )}
      </div>

      {priceShockData && (
        <>
          <SectionDivider title="Commodity Price Shock (Local Spot)" />
          <div className="px-4 pt-3 pb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p style={{ fontSize: 9, color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Baseline</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--cb-text)', fontVariantNumeric: 'tabular-nums' }}>
                  ${Number(priceShockData.baseline_price ?? 0).toFixed(0)}
                </p>
                <p style={{ fontSize: 9, color: 'var(--cb-text-muted)' }}>/ ton</p>
              </div>
              <div className="text-center">
                <p style={{ fontSize: 9, color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shocked</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                  ${Number(priceShockData.shocked_price ?? 0).toFixed(0)}
                </p>
                <p style={{ fontSize: 9, color: 'var(--cb-text-muted)' }}>/ ton</p>
              </div>
              <div className="text-center">
                <p style={{ fontSize: 9, color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Spike</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: (Number(priceShockData.price_increase_pct ?? 0)) >= 20 ? '#f43f5e' : '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                  +{Number(priceShockData.price_increase_pct ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
            {priceShockData.forward_contract_recommendation && (
              <div
                className="mt-3 p-2.5 rounded"
                style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 8%, transparent)', border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)' }}
              >
                <p style={{ fontSize: 9, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>
                  Forward Contract Recommendation
                </p>
                <p style={{ fontSize: 11, color: 'var(--cb-text)', lineHeight: 1.5 }}>
                  {priceShockData.forward_contract_recommendation}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <SectionDivider title="Satellite Ground-Truth (GEE NDVI)" />
      <div className="px-4 pt-3 pb-4">
        {isNdviLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" style={{ backgroundColor: 'var(--cb-surface)' }} />
            <Skeleton className="h-32 w-full animate-pulse" style={{ backgroundColor: 'var(--cb-surface)' }} />
            <p style={{ fontSize: 10, color: 'var(--cb-text-muted)', textAlign: 'center', marginTop: 4 }}>
              Querying Earth Engine…
            </p>
          </div>
        ) : ndviData && ndviData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ndviData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fill: 'var(--cb-text-muted)' }}
                axisLine={{ stroke: 'var(--cb-border)' }}
                tickLine={false}
              />
              <YAxis
                domain={[-1, 1]}
                tick={{ fontSize: 9, fill: 'var(--cb-text-muted)' }}
                axisLine={{ stroke: 'var(--cb-border)' }}
                tickLine={false}
                tickCount={5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--cb-bg)',
                  border: '1px solid var(--cb-border)',
                  borderRadius: 6,
                  fontSize: 11,
                }}
                labelStyle={{ color: 'var(--cb-text)', fontWeight: 600 }}
                itemStyle={{ color: '#10b981' }}
                formatter={(v: number) => [v.toFixed(3), 'NDVI']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: 10, color: 'var(--cb-text-muted)', textAlign: 'center' }}>
            No NDVI data available. Run a simulation to fetch satellite ground-truth.
          </p>
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
          label="AVOIDED LOSS"
          value={formatCurrency(results.avoidedLoss)}
          accent="#10b981"
        />
        <MetricRow
          label="CLIMATE-ADJUSTED LIFESPAN"
          value={
            (() => {
              const yrs = results.adjusted_lifespan ?? results.adjustedLifespan ?? assetLifespan ?? 0;
              const penalty = results.lifespan_penalty ?? null;
              return (
                <>
                  {`${Number(yrs)} yrs`}
                  {penalty != null && penalty > 0 && (
                    <span className="text-red-500 ml-2">(-{penalty} yrs)</span>
                  )}
                </>
              );
            })()
          }
        />
        <MetricRow
          label="CLIMATE-ADJUSTED OPEX"
          value={
            (() => {
              const opex = results.adjusted_opex ?? results.adjustedOpex ?? 0;
              const penalty = results.opex_climate_penalty ?? results.opexClimatePenalty ?? null;
              return (
                <>
                  ${(Number(opex)).toLocaleString()}
                  {penalty != null && penalty > 0 && (
                    <span className="text-red-500 ml-2">(+${Number(penalty).toLocaleString()} penalty)</span>
                  )}
                </>
              );
            })()
          }
        />
        {results.avoidedBusinessInterruption != null && results.avoidedBusinessInterruption > 0 && (
          <MetricRow
            label="Avoided Downtime Cost"
            value={formatCurrency(results.avoidedBusinessInterruption)}
            accent="#14b8a6"
          />
        )}
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
        <MetricRow
          label="CLIMATE-ADJUSTED LIFESPAN"
          value={
            <>
              {`${results.adjusted_lifespan ?? results.adjustedLifespan ?? assetLifespan ?? 0} yrs`}
              {(results.lifespan_penalty != null && results.lifespan_penalty > 0) && (
                <span className="text-red-500 ml-2">(-{results.lifespan_penalty} yrs)</span>
              )}
            </>
          }
        />
        <MetricRow
          label="CLIMATE-ADJUSTED OPEX"
          value={
            <>
              ${(results.adjusted_opex ?? results.adjustedOpex ?? 0).toLocaleString()}
              {(results.opex_climate_penalty ?? results.opexClimatePenalty) != null &&
                (results.opex_climate_penalty ?? results.opexClimatePenalty)! > 0 && (
                <span className="text-red-500 ml-2">
                  (+${(results.opex_climate_penalty ?? results.opexClimatePenalty)!.toLocaleString()} penalty)
                </span>
              )}
            </>
          }
        />
        {results.avoidedBusinessInterruption != null && results.avoidedBusinessInterruption > 0 && (
          <MetricRow
            label="Avoided Downtime Cost"
            value={formatCurrency(results.avoidedBusinessInterruption)}
            accent="#3b82f6"
          />
        )}
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

  const { productivity_loss_pct, economic_loss_daily, wbgt, projected_temp, malaria_risk, dengue_risk, intervention_analysis } = results;
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

      {intervention_analysis && (
        <>
          <SectionDivider title="Cooling ROI Analysis" />
          <div className="px-4">
            <MetricRow
              label="Adjusted WBGT"
              value={`${(intervention_analysis?.wbgt_adjustment?.adjusted_wbgt ?? 0).toFixed(1)}°C`}
              accent="#10b981"
            />
            <MetricRow
              label="Avoided Annual Loss"
              value={formatCurrency(intervention_analysis?.economic_impact?.avoided_annual_economic_loss_usd ?? 0)}
              accent="#10b981"
            />
            <MetricRow
              label="Payback Period"
              value={intervention_analysis?.financial_analysis?.payback_period_years != null ? `${intervention_analysis.financial_analysis.payback_period_years.toFixed(1)} Years` : 'N/A'}
              accent={intervention_analysis?.financial_analysis?.payback_period_years != null && intervention_analysis.financial_analysis.payback_period_years <= 5 ? '#10b981' : '#f59e0b'}
            />
            <MetricRow
              label="10-Year NPV"
              value={formatCurrency(intervention_analysis?.financial_analysis?.npv_10yr_at_10pct_discount ?? 0)}
              accent={(intervention_analysis?.financial_analysis?.npv_10yr_at_10pct_discount ?? 0) >= 0 ? '#10b981' : '#f43f5e'}
            />
          </div>
        </>
      )}

      {results?.public_health_analysis && (
        <>
          <SectionDivider title="Public Sector ROI (DALYs)" />
          <div className="px-4">
            <MetricRow
              label="DALYs Averted"
              value={(results.public_health_analysis?.dalys_averted ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              accent="#8b5cf6"
            />
            <MetricRow
              label="Economic Value Preserved"
              value={formatCurrency(results.public_health_analysis?.economic_value_preserved_usd ?? 0)}
              accent="#10b981"
            />
            <MetricRow
              label="Value per DALY"
              value={formatCurrency(results.public_health_analysis?.monetization?.value_per_daly_usd ?? 0)}
              accent="#3b82f6"
            />
          </div>
        </>
      )}

      {results?.infrastructure_stress_test && (
        <InfrastructureStressTestSection data={results.infrastructure_stress_test} />
      )}
    </div>
  );
}

function InfrastructureStressTestSection({ data }: { data: NonNullable<HealthResults['infrastructure_stress_test']> }) {
  const surgeAdmissions = data.surge_admissions ?? 0;
  const availableBeds = Math.max(data.available_beds ?? 1, 1);
  const usagePct = (surgeAdmissions / availableBeds) * 100;
  const isBreach = data.capacity_breach === true || usagePct > 100;
  const barWidth = Math.min(usagePct, 100);
  const bedDeficit = data.bed_deficit ?? 0;
  const bondCapex = data.infrastructure_bond_capex ?? 0;

  const barColor = isBreach ? '#f43f5e' : '#3b82f6';
  const deficitColor = bedDeficit > 0 ? '#f43f5e' : '#10b981';

  return (
    <>
      <SectionDivider title="Infrastructure Stress Test" />
      <div className="px-4 space-y-3 pb-2">
        {/* Surge Capacity Gauge */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="cb-label">Surge Capacity Status</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                fontWeight: 600,
                color: barColor,
              }}
            >
              {Math.round(usagePct)}%
            </span>
          </div>
          <div className="h-2 relative overflow-hidden" style={{ backgroundColor: 'var(--cb-border)' }}>
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ width: `${barWidth}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: 9, color: 'var(--cb-secondary)' }}>
            <span>0%</span>
            <span>100% capacity</span>
          </div>
          {isBreach && (
            <div
              className="mt-1.5 px-2 py-1"
              style={{
                fontSize: 9,
                fontFamily: 'monospace',
                letterSpacing: '0.06em',
                color: '#f43f5e',
                border: '1px solid rgba(244,63,94,0.3)',
                backgroundColor: 'rgba(244,63,94,0.08)',
              }}
            >
              ⚠ CAPACITY BREACH — SYSTEM FAILURE
            </div>
          )}
        </div>

        {/* Mini data cards */}
        <div className="flex gap-2">
          <div
            className="flex-1 p-2.5"
            style={{ border: '1px solid var(--cb-border)', backgroundColor: 'var(--cb-surface)' }}
          >
            <div className="cb-label mb-1">BED DEFICIT</div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 700,
                color: deficitColor,
              }}
            >
              {bedDeficit > 0 ? `+${bedDeficit.toLocaleString()}` : bedDeficit.toLocaleString()}
            </span>
          </div>
          <div
            className="flex-1 p-2.5"
            style={{ border: '1px solid var(--cb-border)', backgroundColor: 'var(--cb-surface)' }}
          >
            <div className="cb-label mb-1">REQUIRED BOND</div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--cb-text)',
              }}
            >
              {formatCurrency(bondCapex)}
            </span>
          </div>
        </div>
      </div>
    </>
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
  propertyValue,
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
  propertyValue?: number;
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
  const [annualCarbonRevenue, setAnnualCarbonRevenue] = useState<number>(0);

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

  const handleCarbonRevenue = useCallback((revenue: number) => {
    setAnnualCarbonRevenue(revenue);
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
      <div id="finance-prospectus-printable">
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
          annualCarbonRevenue={annualCarbonRevenue}
        />
      </div>

      <div className="border-t" style={{ borderColor: 'var(--cb-border)' }}>
        <RiskStressTestCard monteCarloData={activeMonteCarloData} sensitivityData={activeSensitivityData} />
      </div>

      <div className="border-t" style={{ borderColor: 'var(--cb-border)' }}>
        <SolutionEngineCard strategy={activeAdaptationStrategy} portfolio={activeAdaptationPortfolio} />
      </div>

      <div className="border-t" style={{ borderColor: 'var(--cb-border)' }}>
        <BlendedFinanceCard
          totalCapex={cbaCapexBudget ?? activeFinancialData?.assumptions?.capex ?? null}
          resilienceScore={
            activeFinancialData?.resilience_score ??
            activeFinancialData?.metrics?.resilience_score ??
            null
          }
        />
      </div>

      <ScenarioSandbox
        latitude={latitude ?? null}
        longitude={longitude ?? null}
        cropType={cropType ?? ''}
        initialAssumptions={initialAssumptions}
        assetValue={propertyValue ?? 5_000_000}
        onRecalculated={handleRecalculated}
        onCbaResult={handleCbaResult}
        onCarbonRevenue={handleCarbonRevenue}
      />

      <div style={{ height: 24 }} />
      </div>
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
  const exposurePct = Number(
    summary.risk_exposure_pct ?? s?.risk_exposure_pct ?? 0
  );
  const totalAssets = Number(
    summary.total_assets ?? s?.total_assets ?? 0
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
        {totalAssets > 0 && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--cb-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              Total Assets
            </p>
            <p style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--cb-text)', fontFamily: 'monospace' }}>
              {totalAssets}
            </p>
          </div>
        )}
        {exposurePct > 0 && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--cb-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              Risk Exposure
            </p>
            <p style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--cb-text)', fontFamily: 'monospace' }}>
              {exposurePct.toFixed(1)}%
            </p>
          </div>
        )}
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
