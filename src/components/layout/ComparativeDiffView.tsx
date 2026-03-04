import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { fetchWithRetry } from '@/utils/api';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { HealthResults } from '@/components/hud/HealthResultsPanel';

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
  avoidedBusinessInterruption?: number | null;
  adjustedLifespan?: number | null;
  adjustedOpex?: number | null;
  opexClimatePenalty?: number | null;
}

interface FloodResults {
  floodDepthReduction: number;
  valueProtected: number;
  riskIncreasePct?: number | null;
  futureFloodAreaKm2?: number | null;
  future100yr?: number | null;
  baseline100yr?: number | null;
  avoidedBusinessInterruption?: number | null;
  adjustedOpex?: number | null;
  opexClimatePenalty?: number | null;
  adjustedLifespan?: number | null;
}

export interface ComparativeDiffViewProps {
  mode: DashboardMode;
  locationName?: string | null;
  baselineAgriculture?: AgricultureResults;
  scenarioAgriculture?: AgricultureResults;
  baselineCoastal?: CoastalResults;
  scenarioCoastal?: CoastalResults;
  baselineFlood?: FloodResults;
  scenarioFlood?: FloodResults;
  baselineHealth?: HealthResults | null;
  scenarioHealth?: HealthResults | null;
}

const MODE_ACCENT: Record<string, string> = {
  agriculture: '#10b981',
  coastal: '#14b8a6',
  flood: '#3b82f6',
  health: '#f43f5e',
  finance: '#f59e0b',
  portfolio: '#64748b',
};

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number | null | undefined): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '0%';
  return `${Math.round(n * 10) / 10}%`;
}

/** Compute delta % between baseline and scenario. Positive = scenario is higher. */
function deltaPercent(baseline: number, scenario: number): number | null {
  if (baseline === 0 && scenario === 0) return null;
  if (baseline === 0) return scenario > 0 ? 100 : -100;
  return ((scenario - baseline) / Math.abs(baseline)) * 100;
}

function DeltaBadge({ delta, invertColor = false }: { delta: number | null; invertColor?: boolean }) {
  if (delta == null) return null;
  const isPositive = delta >= 0;
  // invertColor: for metrics where higher = worse (e.g. risk, loss), positive delta should be red
  const color = invertColor
    ? (isPositive ? '#f43f5e' : '#10b981')
    : (isPositive ? '#10b981' : '#f43f5e');
  const sign = isPositive ? '+' : '';
  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: 9,
        fontWeight: 600,
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        padding: '2px 6px',
        letterSpacing: '0.04em',
      }}
    >
      Δ {sign}{Math.round(delta)}%
    </span>
  );
}

function CompMetricRow({
  label,
  baselineValue,
  scenarioValue,
  baselineDisplay,
  scenarioDisplay,
  invertDelta = false,
}: {
  label: string;
  baselineValue: number;
  scenarioValue: number;
  baselineDisplay: string;
  scenarioDisplay: string;
  invertDelta?: boolean;
}) {
  const delta = deltaPercent(baselineValue, scenarioValue);
  const scenarioColor = delta != null
    ? (invertDelta
        ? (delta >= 0 ? '#f43f5e' : '#10b981')
        : (delta >= 0 ? '#10b981' : '#f43f5e'))
    : 'var(--cb-text)';

  return (
    <div className="py-2.5 cb-divider">
      <div className="flex items-center justify-between mb-1">
        <span className="cb-label" style={{ fontSize: 9 }}>{label}</span>
        <DeltaBadge delta={delta} invertColor={invertDelta} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center py-1.5 rounded" style={{ backgroundColor: 'var(--cb-surface)' }}>
          <p style={{ fontSize: 8, color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Baseline
          </p>
          <span className="cb-value" style={{ fontSize: 13 }}>{baselineDisplay}</span>
        </div>
        <div
          className="text-center py-1.5 rounded"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--cb-surface) 80%, transparent)',
            border: `1px solid color-mix(in srgb, ${scenarioColor} 30%, transparent)`,
          }}
        >
          <p style={{ fontSize: 8, color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Scenario
          </p>
          <span className="cb-value" style={{ fontSize: 13, color: scenarioColor }}>{scenarioDisplay}</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div
      className="border-t pt-4 mt-4 px-4"
      style={{ borderColor: 'var(--cb-border)' }}
    >
      <span className="cb-section-heading">{title}</span>
    </div>
  );
}

export function ComparativeDiffView({
  mode,
  locationName,
  baselineAgriculture,
  scenarioAgriculture,
  baselineCoastal,
  scenarioCoastal,
  baselineFlood,
  scenarioFlood,
  baselineHealth,
  scenarioHealth,
}: ComparativeDiffViewProps) {
  const accent = MODE_ACCENT[mode] ?? '#10b981';

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Clear stale briefing whenever mode, location, or scenario results change
  useEffect(() => {
    setAiSummary(null);
  }, [mode, locationName, scenarioHealth, scenarioAgriculture, scenarioCoastal, scenarioFlood,
      baselineHealth, baselineAgriculture, baselineCoastal, baselineFlood]);

  const generateExecutiveSummary = useCallback(async () => {
    setIsGeneratingAi(true);
    try {
      const scenarioData =
        mode === 'health' ? scenarioHealth :
        mode === 'agriculture' ? scenarioAgriculture :
        mode === 'coastal' ? scenarioCoastal :
        mode === 'flood' ? scenarioFlood : null;

      const payloadModuleName = (mode === 'health' && (scenarioData as HealthResults | null)?.public_health_analysis) ? 'health_public' : mode;

      const res = await fetchWithRetry(
        'https://web-production-8ff9e.up.railway.app/api/v1/ai/executive-summary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_name: payloadModuleName,
            location_name: locationName || 'Unknown Location',
            simulation_data: scenarioData,
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiSummary(data.summary_text ?? data.summary ?? null);
    } catch (err) {
      console.error('[Executive Summary DT]', err);
      setAiSummary(null);
    } finally {
      setIsGeneratingAi(false);
    }
  }, [mode, locationName, scenarioHealth, scenarioAgriculture, scenarioCoastal, scenarioFlood]);

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px flex-1" style={{ backgroundColor: accent }} />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: '0.1em',
              color: accent,
              fontWeight: 600,
            }}
          >
            COMPARATIVE ANALYSIS
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: accent }} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center py-1" style={{ borderBottom: `2px solid var(--cb-border)` }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em', color: 'var(--cb-secondary)' }}>
              BASELINE
            </span>
          </div>
          <div className="text-center py-1" style={{ borderBottom: `2px solid ${accent}` }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em', color: accent }}>
              SCENARIO
            </span>
          </div>
        </div>
      </div>

      {/* Executive Insight */}
      <div className="px-4 pt-3 pb-2">
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
            Synthesizing scenario data…
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

      {mode === 'agriculture' && baselineAgriculture && scenarioAgriculture && (
        <>
          <SectionHeading title="Yield & Loss" />
          <div className="px-4">
            <CompMetricRow
              label="YIELD POTENTIAL"
              baselineValue={baselineAgriculture.yieldPotential ?? 0}
              scenarioValue={scenarioAgriculture.yieldPotential ?? 0}
              baselineDisplay={`${(baselineAgriculture.yieldPotential ?? 0).toFixed(0)}%`}
              scenarioDisplay={`${(scenarioAgriculture.yieldPotential ?? 0).toFixed(0)}%`}
            />
            <CompMetricRow
              label="AVOIDED LOSS"
              baselineValue={baselineAgriculture.avoidedLoss}
              scenarioValue={scenarioAgriculture.avoidedLoss}
              baselineDisplay={formatCurrency(baselineAgriculture.avoidedLoss)}
              scenarioDisplay={formatCurrency(scenarioAgriculture.avoidedLoss)}
            />
            <CompMetricRow
              label="TRANSITION CAPEX"
              baselineValue={baselineAgriculture.transitionCapex ?? 0}
              scenarioValue={scenarioAgriculture.transitionCapex ?? 0}
              baselineDisplay={formatCurrency(baselineAgriculture.transitionCapex ?? 0)}
              scenarioDisplay={formatCurrency(scenarioAgriculture.transitionCapex ?? 0)}
              invertDelta
            />
            <CompMetricRow
              label="RISK REDUCTION"
              baselineValue={baselineAgriculture.riskReduction}
              scenarioValue={scenarioAgriculture.riskReduction}
              baselineDisplay={formatPercent(baselineAgriculture.riskReduction)}
              scenarioDisplay={formatPercent(scenarioAgriculture.riskReduction)}
            />
          </div>
        </>
      )}

      {/* Coastal */}
      {mode === 'coastal' && baselineCoastal && scenarioCoastal && (
        <>
          <SectionHeading title="Coastal Risk" />
          <div className="px-4">
            <CompMetricRow
              label="STATUS"
              baselineValue={baselineCoastal.isUnderwater ? 1 : 0}
              scenarioValue={scenarioCoastal.isUnderwater ? 1 : 0}
              baselineDisplay={baselineCoastal.isUnderwater ? 'Inundated' : 'Above Water'}
              scenarioDisplay={scenarioCoastal.isUnderwater ? 'Inundated' : 'Above Water'}
              invertDelta
            />
            <CompMetricRow
              label="SEA LEVEL RISE"
              baselineValue={baselineCoastal.seaLevelRise ?? 0}
              scenarioValue={scenarioCoastal.seaLevelRise ?? 0}
              baselineDisplay={`${(baselineCoastal.seaLevelRise ?? 0).toFixed(2)} m`}
              scenarioDisplay={`${(scenarioCoastal.seaLevelRise ?? 0).toFixed(2)} m`}
              invertDelta
            />
            <CompMetricRow
              label="AVOIDED LOSS"
              baselineValue={baselineCoastal.avoidedLoss}
              scenarioValue={scenarioCoastal.avoidedLoss}
              baselineDisplay={formatCurrency(baselineCoastal.avoidedLoss)}
              scenarioDisplay={formatCurrency(scenarioCoastal.avoidedLoss)}
            />
            {(baselineCoastal.adjustedLifespan != null || scenarioCoastal.adjustedLifespan != null) && (
              <CompMetricRow
                label="CLIMATE-ADJUSTED LIFESPAN"
                baselineValue={baselineCoastal.adjustedLifespan ?? 0}
                scenarioValue={scenarioCoastal.adjustedLifespan ?? 0}
                baselineDisplay={`${baselineCoastal.adjustedLifespan ?? 0} yrs`}
                scenarioDisplay={`${scenarioCoastal.adjustedLifespan ?? 0} yrs`}
              />
            )}
            {(baselineCoastal.adjustedOpex != null || scenarioCoastal.adjustedOpex != null) && (
              <CompMetricRow
                label="CLIMATE-ADJUSTED OPEX"
                baselineValue={baselineCoastal.adjustedOpex ?? 0}
                scenarioValue={scenarioCoastal.adjustedOpex ?? 0}
                baselineDisplay={formatCurrency(baselineCoastal.adjustedOpex ?? 0)}
                scenarioDisplay={formatCurrency(scenarioCoastal.adjustedOpex ?? 0)}
                invertDelta
              />
            )}
            {(baselineCoastal.opexClimatePenalty != null || scenarioCoastal.opexClimatePenalty != null) && (
              <CompMetricRow
                label="OPEX CLIMATE PENALTY"
                baselineValue={baselineCoastal.opexClimatePenalty ?? 0}
                scenarioValue={scenarioCoastal.opexClimatePenalty ?? 0}
                baselineDisplay={formatCurrency(baselineCoastal.opexClimatePenalty ?? 0)}
                scenarioDisplay={formatCurrency(scenarioCoastal.opexClimatePenalty ?? 0)}
                invertDelta
              />
            )}
          </div>
        </>
      )}

      {/* Flood */}
      {mode === 'flood' && baselineFlood && scenarioFlood && (
        <>
          <SectionHeading title="Flood Mitigation" />
          <div className="px-4">
            {(baselineFlood.riskIncreasePct != null || scenarioFlood.riskIncreasePct != null) && (
              <CompMetricRow
                label="CLIMATE RISK INCREASE"
                baselineValue={baselineFlood.riskIncreasePct ?? 0}
                scenarioValue={scenarioFlood.riskIncreasePct ?? 0}
                baselineDisplay={`+${(baselineFlood.riskIncreasePct ?? 0).toFixed(1)}%`}
                scenarioDisplay={`+${(scenarioFlood.riskIncreasePct ?? 0).toFixed(1)}%`}
                invertDelta
              />
            )}
            <CompMetricRow
              label="DEPTH REDUCTION"
              baselineValue={baselineFlood.floodDepthReduction}
              scenarioValue={scenarioFlood.floodDepthReduction}
              baselineDisplay={`${baselineFlood.floodDepthReduction.toFixed(1)} cm`}
              scenarioDisplay={`${scenarioFlood.floodDepthReduction.toFixed(1)} cm`}
            />
            <CompMetricRow
              label="VALUE PROTECTED"
              baselineValue={baselineFlood.valueProtected}
              scenarioValue={scenarioFlood.valueProtected}
              baselineDisplay={formatCurrency(baselineFlood.valueProtected)}
              scenarioDisplay={formatCurrency(scenarioFlood.valueProtected)}
            />
            {(baselineFlood.adjustedLifespan != null || scenarioFlood.adjustedLifespan != null) && (
              <CompMetricRow
                label="CLIMATE-ADJUSTED LIFESPAN"
                baselineValue={baselineFlood.adjustedLifespan ?? 0}
                scenarioValue={scenarioFlood.adjustedLifespan ?? 0}
                baselineDisplay={`${baselineFlood.adjustedLifespan ?? 0} yrs`}
                scenarioDisplay={`${scenarioFlood.adjustedLifespan ?? 0} yrs`}
              />
            )}
            {(baselineFlood.adjustedOpex != null || scenarioFlood.adjustedOpex != null) && (
              <CompMetricRow
                label="CLIMATE-ADJUSTED OPEX"
                baselineValue={baselineFlood.adjustedOpex ?? 0}
                scenarioValue={scenarioFlood.adjustedOpex ?? 0}
                baselineDisplay={formatCurrency(baselineFlood.adjustedOpex ?? 0)}
                scenarioDisplay={formatCurrency(scenarioFlood.adjustedOpex ?? 0)}
                invertDelta
              />
            )}
            {(baselineFlood.opexClimatePenalty != null || scenarioFlood.opexClimatePenalty != null) && (
              <CompMetricRow
                label="OPEX CLIMATE PENALTY"
                baselineValue={baselineFlood.opexClimatePenalty ?? 0}
                scenarioValue={scenarioFlood.opexClimatePenalty ?? 0}
                baselineDisplay={formatCurrency(baselineFlood.opexClimatePenalty ?? 0)}
                scenarioDisplay={formatCurrency(scenarioFlood.opexClimatePenalty ?? 0)}
                invertDelta
              />
            )}
          </div>
        </>
      )}

      {/* Health */}
      {mode === 'health' && baselineHealth && scenarioHealth && (
        <>
          <SectionHeading title="Heat Stress" />
          <div className="px-4">
            <CompMetricRow
              label="PRODUCTIVITY LOSS"
              baselineValue={baselineHealth.productivity_loss_pct}
              scenarioValue={scenarioHealth.productivity_loss_pct}
              baselineDisplay={`${baselineHealth.productivity_loss_pct.toFixed(1)}%`}
              scenarioDisplay={`${scenarioHealth.productivity_loss_pct.toFixed(1)}%`}
              invertDelta
            />
            <CompMetricRow
              label="DAILY ECONOMIC LOSS"
              baselineValue={baselineHealth.economic_loss_daily}
              scenarioValue={scenarioHealth.economic_loss_daily}
              baselineDisplay={formatCurrency(baselineHealth.economic_loss_daily)}
              scenarioDisplay={formatCurrency(scenarioHealth.economic_loss_daily)}
              invertDelta
            />
            <CompMetricRow
              label="WBGT"
              baselineValue={baselineHealth.wbgt}
              scenarioValue={scenarioHealth.wbgt}
              baselineDisplay={`${baselineHealth.wbgt.toFixed(1)}°C`}
              scenarioDisplay={`${scenarioHealth.wbgt.toFixed(1)}°C`}
              invertDelta
            />
          </div>

          {/* Intervention comparison */}
          {(baselineHealth.intervention_analysis || scenarioHealth.intervention_analysis) && (
            <>
              <SectionHeading title="Cooling ROI" />
              <div className="px-4">
                <CompMetricRow
                  label="AVOIDED ANNUAL LOSS"
                  baselineValue={baselineHealth.intervention_analysis?.economic_impact?.avoided_annual_economic_loss_usd ?? 0}
                  scenarioValue={scenarioHealth.intervention_analysis?.economic_impact?.avoided_annual_economic_loss_usd ?? 0}
                  baselineDisplay={formatCurrency(baselineHealth.intervention_analysis?.economic_impact?.avoided_annual_economic_loss_usd ?? 0)}
                  scenarioDisplay={formatCurrency(scenarioHealth.intervention_analysis?.economic_impact?.avoided_annual_economic_loss_usd ?? 0)}
                />
                <CompMetricRow
                  label="PAYBACK PERIOD"
                  baselineValue={baselineHealth.intervention_analysis?.financial_analysis?.payback_period_years ?? 0}
                  scenarioValue={scenarioHealth.intervention_analysis?.financial_analysis?.payback_period_years ?? 0}
                  baselineDisplay={`${(baselineHealth.intervention_analysis?.financial_analysis?.payback_period_years ?? 0).toFixed(1)} yrs`}
                  scenarioDisplay={`${(scenarioHealth.intervention_analysis?.financial_analysis?.payback_period_years ?? 0).toFixed(1)} yrs`}
                  invertDelta
                />
              </div>
            </>
          )}

          {/* Infrastructure stress test comparison */}
          {(baselineHealth.infrastructure_stress_test || scenarioHealth.infrastructure_stress_test) && (
            <>
              <SectionHeading title="Infrastructure Stress Test" />
              <div className="px-4">
                {(() => {
                  const bInfra = baselineHealth.infrastructure_stress_test;
                  const sInfra = scenarioHealth.infrastructure_stress_test;
                  const bPct = bInfra ? (bInfra.surge_admissions / Math.max(bInfra.available_beds, 1)) * 100 : 0;
                  const sPct = sInfra ? (sInfra.surge_admissions / Math.max(sInfra.available_beds, 1)) * 100 : 0;
                  const bBreach = bInfra?.capacity_breach || bPct > 100;
                  const sBreach = sInfra?.capacity_breach || sPct > 100;
                  return (
                    <>
                      {/* Dual gauge */}
                      <div className="py-2.5 cb-divider">
                        <div className="flex items-center justify-between mb-1">
                          <span className="cb-label" style={{ fontSize: 9 }}>SURGE CAPACITY</span>
                          <DeltaBadge delta={deltaPercent(bPct, sPct)} invertColor />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="h-2 relative overflow-hidden" style={{ backgroundColor: 'var(--cb-border)' }}>
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(bPct, 100)}%`,
                                  backgroundColor: bBreach ? '#f43f5e' : '#3b82f6',
                                }}
                              />
                            </div>
                            <p className="text-center mt-1" style={{ fontSize: 10, fontFamily: 'monospace', color: bBreach ? '#f43f5e' : '#3b82f6' }}>
                              {Math.round(bPct)}%
                            </p>
                          </div>
                          <div>
                            <div className="h-2 relative overflow-hidden" style={{ backgroundColor: 'var(--cb-border)' }}>
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(sPct, 100)}%`,
                                  backgroundColor: sBreach ? '#f43f5e' : '#3b82f6',
                                }}
                              />
                            </div>
                            <p className="text-center mt-1" style={{ fontSize: 10, fontFamily: 'monospace', color: sBreach ? '#f43f5e' : '#3b82f6' }}>
                              {Math.round(sPct)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <CompMetricRow
                        label="BED DEFICIT"
                        baselineValue={Math.ceil(bInfra?.bed_deficit ?? 0)}
                        scenarioValue={Math.ceil(sInfra?.bed_deficit ?? 0)}
                        baselineDisplay={`${Math.ceil(bInfra?.bed_deficit ?? 0)}`}
                        scenarioDisplay={`${Math.ceil(sInfra?.bed_deficit ?? 0)}`}
                        invertDelta
                      />
                      <CompMetricRow
                        label="REQUIRED BOND"
                        baselineValue={bInfra?.infrastructure_bond_capex ?? 0}
                        scenarioValue={sInfra?.infrastructure_bond_capex ?? 0}
                        baselineDisplay={formatCurrency(bInfra?.infrastructure_bond_capex ?? 0)}
                        scenarioDisplay={formatCurrency(sInfra?.infrastructure_bond_capex ?? 0)}
                        invertDelta
                      />
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </>
      )}

      {/* No data fallback */}
      {!baselineAgriculture && !baselineCoastal && !baselineFlood && !baselineHealth && (
        <div className="px-4 py-8 text-center">
          <p style={{ fontSize: 11, color: 'var(--cb-secondary)', lineHeight: 1.6 }}>
            Run a simulation to see comparative results.
          </p>
        </div>
      )}
    </div>
  );
}
