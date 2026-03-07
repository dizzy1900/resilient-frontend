import { DashboardMode } from '@/components/dashboard/ModeSelector';
import type { BlendedFinanceData, StressScenario } from '@/components/hud/BlendedFinanceCard';

interface TCFDReportTemplateProps {
  mode: DashboardMode;
  locationName: string;
  date: string;
  executiveSummary?: string | null;
  baselineMetrics: Record<string, string | number>;
  scenarioMetrics?: Record<string, string | number> | null;
  deltaMetrics?: Record<string, string> | null;
  isDigitalTwin?: boolean;
  baselineResults?: any;
  scenarioResults?: any;
  blendedData?: BlendedFinanceData | null;
}

const MODE_LABELS: Record<string, string> = {
  agriculture: 'Agriculture & Food Security',
  coastal: 'Coastal Infrastructure',
  flood: 'Pluvial Flood Risk',
  health: 'Climate & Health',
  finance: 'Climate Finance',
  portfolio: 'Portfolio Analysis',
};

const ADAPTATION_METRICS = new Set([
  'Transition Capex',
  'Avoided Revenue Loss',
  'Risk Reduction',
  'Value Protected',
  'Flood Depth Reduction',
]);

function splitMetrics(metrics: Record<string, string | number>) {
  const baseline: Record<string, string | number> = {};
  const adaptation: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(metrics)) {
    if (ADAPTATION_METRICS.has(key)) {
      adaptation[key] = val;
    } else {
      baseline[key] = val;
    }
  }
  return { baseline, adaptation };
}

export function TCFDReportTemplate({
  mode,
  locationName,
  date,
  executiveSummary,
  baselineMetrics,
  scenarioMetrics,
  deltaMetrics,
  isDigitalTwin,
  baselineResults,
  scenarioResults,
  blendedData,
}: TCFDReportTemplateProps) {
  const { baseline: physicalRiskMetrics, adaptation: adaptationMetrics } = splitMetrics(baselineMetrics);
  const hasAdaptation = Object.keys(adaptationMetrics).length > 0;
  const hasBlended = !!blendedData;

  // Dynamic section numbering based on whether Green Bond page is shown
  const sectionAfterPhysical = hasBlended ? 4 : 3;
  const sectionAnalytics = hasBlended ? 5 : 4;

  return (
    <div
      id="tcfd-report-template"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '816px',
        minHeight: '1056px',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        padding: '48px',
        boxSizing: 'border-box',
      }}
    >
      <Header mode={mode} locationName={locationName} date={date} isDigitalTwin={isDigitalTwin} />

      <Section number="1" title="Executive Summary">
        <SummaryBox text={executiveSummary} />
      </Section>

      <Section number="2" title="Physical Risk Assessment — Baseline">
        <MetricsTable metrics={physicalRiskMetrics} headerColor="#0f172a" />
      </Section>

      {/* === GREEN BOND TERM SHEET (conditional) === */}
      {hasBlended && (
        <GreenBondTermSheet blendedData={blendedData!} />
      )}

      {hasAdaptation && !isDigitalTwin && (
        <Section number={String(sectionAfterPhysical)} title="Adaptation Strategy & ROI">
          <MetricsTable metrics={adaptationMetrics} headerColor="#059669" />
        </Section>
      )}

      {isDigitalTwin && scenarioMetrics && (
        <Section number={String(sectionAfterPhysical)} title="Adaptation Strategy & ROI — Scenario Comparison">
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 8, letterSpacing: '0.08em' }}>BASELINE</p>
              <MetricsTable metrics={baselineMetrics} headerColor="#0f172a" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#059669', marginBottom: 8, letterSpacing: '0.08em' }}>SCENARIO</p>
              <MetricsTable metrics={scenarioMetrics} headerColor="#059669" />
            </div>
          </div>
          {deltaMetrics && Object.keys(deltaMetrics).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <DeltaTable deltas={deltaMetrics} />
            </div>
          )}
        </Section>
      )}

      {/* === KEY RISK FACTORS & ANALYTICS === */}
      <Section number={String(sectionAnalytics)} title="Key Risk Factors & Analytics">
        {mode === 'agriculture' && (
          <AgriCharts baseline={baselineResults} scenario={scenarioResults} isDT={!!isDigitalTwin} />
        )}
        {mode === 'health' && (
          <HealthCharts baseline={baselineResults} scenario={scenarioResults} isDT={!!isDigitalTwin} />
        )}
        {(mode === 'coastal' || mode === 'flood') && (
          <CoastalFloodCharts baseline={baselineResults} scenario={scenarioResults} isDT={!!isDigitalTwin} mode={mode} />
        )}
      </Section>

      {/* === FOOTER === */}
      <div
        style={{
          borderTop: '2px solid #e2e8f0',
          paddingTop: 16,
          marginTop: 40,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: '#94a3b8',
        }}
      >
        <span>Generated by Resilient Climate Platform — resilient.lovable.app</span>
        <span>Confidential — For Professional Use Only</span>
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */

function Header({ mode, locationName, date, isDigitalTwin }: { mode: string; locationName: string; date: string; isDigitalTwin?: boolean }) {
  return (
    <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: 20, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Resilient</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>Climate Risk &amp; ROI Prospectus</p>
        </div>
        <span style={{ display: 'inline-block', padding: '4px 12px', border: '1.5px solid #0f172a', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#0f172a' }}>
          TCFD / CSRD ALIGNED
        </span>
      </div>
      <div style={{ display: 'flex', gap: 32, marginTop: 16, fontSize: 11, color: '#475569' }}>
        <span><strong>Location:</strong> {locationName}</span>
        <span><strong>Module:</strong> {MODE_LABELS[mode] || mode}</span>
        <span><strong>Date:</strong> {date}</span>
        {isDigitalTwin && <span style={{ color: '#d97706', fontWeight: 700 }}>● DIGITAL TWIN ANALYSIS</span>}
      </div>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32, pageBreakInside: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', backgroundColor: '#0f172a', color: '#ffffff', fontSize: 11, fontWeight: 700 }}>{number}</span>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SummaryBox({ text }: { text?: string | null }) {
  return (
    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 20, fontSize: 12, lineHeight: 1.7, color: '#334155' }}>
      {text ? (
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</p>
      ) : (
        <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic' }}>
          No AI executive summary available. The system will auto-generate one when you export.
        </p>
      )}
    </div>
  );
}

function MetricsTable({ metrics, headerColor }: { metrics: Record<string, string | number>; headerColor: string }) {
  const entries = Object.entries(metrics);
  if (entries.length === 0) return null;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: headerColor, color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderTopLeftRadius: 4 }}>METRIC</th>
          <th style={{ textAlign: 'right', padding: '8px 12px', backgroundColor: headerColor, color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderTopRightRadius: 4 }}>VALUE</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, val], i) => (
          <tr key={key} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
            <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 500 }}>{key}</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DeltaTable({ deltas }: { deltas: Record<string, string> }) {
  const entries = Object.entries(deltas);
  if (entries.length === 0) return null;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: '#d97706', color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderTopLeftRadius: 4 }}>METRIC</th>
          <th style={{ textAlign: 'right', padding: '8px 12px', backgroundColor: '#d97706', color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderTopRightRadius: 4 }}>Δ CHANGE</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, val], i) => (
          <tr key={key} style={{ backgroundColor: i % 2 === 0 ? '#fffbeb' : '#ffffff' }}>
            <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 500 }}>{key}</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#92400e', fontWeight: 700 }}>{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── CSS-Only Chart Components (print-safe, no SVG/canvas) ── */

const BAR_STYLES = {
  container: { pageBreakInside: 'avoid' as const, marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 600 as const, color: '#334155', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  track: { height: 18, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' as const, position: 'relative' as const },
  barBase: { height: '100%', borderRadius: 3, transition: 'none' },
};

function CSSProgressBar({ label, pct, color, subLabel }: { label: string; pct: number; color: string; subLabel?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={BAR_STYLES.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={BAR_STYLES.label}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{clamped.toFixed(0)}%</span>
      </div>
      <div style={BAR_STYLES.track}>
        <div style={{ ...BAR_STYLES.barBase, width: `${clamped}%`, backgroundColor: color }} />
      </div>
      {subLabel && <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, display: 'block' }}>{subLabel}</span>}
    </div>
  );
}

function DualBar({ label, baselinePct, scenarioPct, baselineColor, scenarioColor }: { label: string; baselinePct: number; scenarioPct: number; baselineColor: string; scenarioColor: string }) {
  const bClamped = Math.max(0, Math.min(100, baselinePct));
  const sClamped = Math.max(0, Math.min(100, scenarioPct));
  return (
    <div style={BAR_STYLES.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={BAR_STYLES.label}>{label}</span>
        <span style={{ fontSize: 9, color: '#64748b' }}>
          <span style={{ color: baselineColor, fontWeight: 700 }}>■ {bClamped.toFixed(0)}%</span>
          {' vs '}
          <span style={{ color: scenarioColor, fontWeight: 700 }}>■ {sClamped.toFixed(0)}%</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={BAR_STYLES.track}>
          <div style={{ ...BAR_STYLES.barBase, width: `${bClamped}%`, backgroundColor: baselineColor }} />
        </div>
        <div style={BAR_STYLES.track}>
          <div style={{ ...BAR_STYLES.barBase, width: `${sClamped}%`, backgroundColor: scenarioColor }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
        <span>Baseline</span>
        <span>Scenario</span>
      </div>
    </div>
  );
}

/* ── Module-Specific Charts ── */

function AgriCharts({ baseline, scenario, isDT }: { baseline?: any; scenario?: any; isDT: boolean }) {
  const soilDeg = parseFloat(baseline?.soil_degradation_risk ?? baseline?.soil_moisture ?? '35');
  const heatStress = parseFloat(baseline?.heat_stress_index ?? baseline?.heat_stress ?? '45');
  const pestPressure = parseFloat(baseline?.pest_pressure ?? '28');

  const sSoilDeg = parseFloat(scenario?.soil_degradation_risk ?? scenario?.soil_moisture ?? '50');
  const sHeatStress = parseFloat(scenario?.heat_stress_index ?? scenario?.heat_stress ?? '60');
  const sPestPressure = parseFloat(scenario?.pest_pressure ?? '40');

  return (
    <div style={{ pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: 11, color: '#475569', marginBottom: 16 }}>
        Risk factor breakdown showing primary agricultural vulnerability drivers.
        {isDT && ' Baseline (dark) vs Scenario (green) comparison.'}
      </p>
      {isDT ? (
        <>
          <DualBar label="Soil Degradation Risk" baselinePct={soilDeg} scenarioPct={sSoilDeg} baselineColor="#334155" scenarioColor="#059669" />
          <DualBar label="Heat Stress Index" baselinePct={heatStress} scenarioPct={sHeatStress} baselineColor="#334155" scenarioColor="#059669" />
          <DualBar label="Pest & Disease Pressure" baselinePct={pestPressure} scenarioPct={sPestPressure} baselineColor="#334155" scenarioColor="#059669" />
        </>
      ) : (
        <>
          <CSSProgressBar label="Soil Degradation Risk" pct={soilDeg} color={soilDeg > 60 ? '#dc2626' : '#d97706'} />
          <CSSProgressBar label="Heat Stress Index" pct={heatStress} color={heatStress > 60 ? '#dc2626' : '#d97706'} />
          <CSSProgressBar label="Pest & Disease Pressure" pct={pestPressure} color={pestPressure > 50 ? '#dc2626' : '#059669'} />
        </>
      )}
    </div>
  );
}

function HealthCharts({ baseline, scenario, isDT }: { baseline?: any; scenario?: any; isDT: boolean }) {
  const publicHealth = baseline?.public_health_analysis;
  const capacity = parseFloat(publicHealth?.surge_capacity_pct ?? baseline?.surge_capacity_pct ?? '78');
  const breached = capacity > 100;

  const sCapacity = parseFloat(scenario?.public_health_analysis?.surge_capacity_pct ?? scenario?.surge_capacity_pct ?? '90');
  const sBreached = sCapacity > 100;

  return (
    <div style={{ pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: 11, color: '#475569', marginBottom: 16 }}>
        Hospital surge capacity utilisation — exceeding 100% indicates system breach.
        {isDT && ' Baseline vs Scenario comparison.'}
      </p>

      {/* Gauge-style capacity bar */}
      {isDT ? (
        <div style={{ marginBottom: 16 }}>
          <DualBar
            label="Surge Capacity Utilisation"
            baselinePct={Math.min(capacity, 140)}
            scenarioPct={Math.min(sCapacity, 140)}
            baselineColor={breached ? '#dc2626' : '#334155'}
            scenarioColor={sBreached ? '#dc2626' : '#059669'}
          />
          {(breached || sBreached) && (
            <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 4 }}>
              ⚠ CAPACITY BREACH {breached && sBreached ? '(BOTH)' : breached ? '(BASELINE)' : '(SCENARIO)'}
            </div>
          )}
        </div>
      ) : (
        <div style={{ pageBreakInside: 'avoid', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={BAR_STYLES.label}>Surge Capacity Utilisation</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: breached ? '#dc2626' : '#059669' }}>{capacity.toFixed(0)}%</span>
          </div>
          {/* Track with 100% threshold marker */}
          <div style={{ position: 'relative' }}>
            <div style={{ ...BAR_STYLES.track, height: 22 }}>
              <div style={{ ...BAR_STYLES.barBase, width: `${Math.min(capacity, 140) / 1.4}%`, backgroundColor: breached ? '#dc2626' : '#059669', height: '100%' }} />
            </div>
            {/* 100% threshold line */}
            <div style={{ position: 'absolute', left: `${100 / 1.4}%`, top: -4, bottom: -4, width: 2, backgroundColor: '#0f172a' }} />
            <div style={{ position: 'absolute', left: `${100 / 1.4}%`, top: -14, fontSize: 8, color: '#0f172a', fontWeight: 700, transform: 'translateX(-50%)' }}>100%</div>
          </div>
          {breached && (
            <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 8 }}>
              ⚠ CAPACITY BREACH — Hospital system overwhelmed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoastalFloodCharts({ baseline, scenario, isDT, mode }: { baseline?: any; scenario?: any; isDT: boolean; mode: string }) {
  const valueProtected = parseFloat(baseline?.value_protected?.toString().replace(/[^0-9.]/g, '') ?? '0');
  const capex = parseFloat(baseline?.transition_capex?.toString().replace(/[^0-9.]/g, '') ?? '0');

  const sValueProtected = parseFloat(scenario?.value_protected?.toString().replace(/[^0-9.]/g, '') ?? '0');
  const sCapex = parseFloat(scenario?.transition_capex?.toString().replace(/[^0-9.]/g, '') ?? '0');

  const maxVal = Math.max(valueProtected, capex, sValueProtected, sCapex, 1);
  const norm = (v: number) => (v / maxVal) * 100;

  const modeLabel = mode === 'coastal' ? 'Coastal' : 'Flood';

  return (
    <div style={{ pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: 11, color: '#475569', marginBottom: 16 }}>
        {modeLabel} investment efficiency — Asset Value Protected vs Intervention Capex.
        {isDT && ' Baseline vs Scenario comparison.'}
      </p>

      {isDT ? (
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginBottom: 8, letterSpacing: '0.08em' }}>BASELINE</p>
            <CapexValueBars valueProtected={norm(valueProtected)} capex={norm(capex)} vpLabel={fmtCurrency(valueProtected)} cxLabel={fmtCurrency(capex)} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#059669', marginBottom: 8, letterSpacing: '0.08em' }}>SCENARIO</p>
            <CapexValueBars valueProtected={norm(sValueProtected)} capex={norm(sCapex)} vpLabel={fmtCurrency(sValueProtected)} cxLabel={fmtCurrency(sCapex)} />
          </div>
        </div>
      ) : (
        <CapexValueBars valueProtected={norm(valueProtected)} capex={norm(capex)} vpLabel={fmtCurrency(valueProtected)} cxLabel={fmtCurrency(capex)} />
      )}
    </div>
  );
}

function CapexValueBars({ valueProtected, capex, vpLabel, cxLabel }: { valueProtected: number; capex: number; vpLabel: string; cxLabel: string }) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#334155' }}>Asset Value Protected</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>{vpLabel}</span>
        </div>
        <div style={BAR_STYLES.track}>
          <div style={{ ...BAR_STYLES.barBase, width: `${Math.max(valueProtected, 2)}%`, backgroundColor: '#059669', height: '100%' }} />
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#334155' }}>Intervention Capex</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706' }}>{cxLabel}</span>
        </div>
        <div style={BAR_STYLES.track}>
          <div style={{ ...BAR_STYLES.barBase, width: `${Math.max(capex, 2)}%`, backgroundColor: '#d97706', height: '100%' }} />
        </div>
      </div>
    </div>
  );
}

function fmtCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function fmtCurrencyFull(val: number): string {
  return `$${Math.round(val).toLocaleString('en-US')}`;
}

/* ── Green Bond Term Sheet ── */

const TRANCHE_COLORS: Record<string, string> = {
  commercial: '#3b82f6',
  concessional: '#d97706',
  equity: '#059669',
};

const TRANCHE_LABELS: Record<string, string> = {
  commercial: 'Commercial Debt',
  concessional: 'Concessional / DFI',
  equity: 'Equity / Grant',
};

function GreenBondTermSheet({ blendedData }: { blendedData: import('@/components/hud/BlendedFinanceCard').BlendedFinanceData }) {
  const { result, stack, totalCapex, resilienceScore } = blendedData;

  const tranches = [
    { key: 'commercial', pct: stack.commercial, amount: Math.round((totalCapex * stack.commercial) / 100) },
    { key: 'concessional', pct: stack.concessional, amount: Math.round((totalCapex * stack.concessional) / 100) },
    { key: 'equity', pct: stack.equity, amount: Math.round((totalCapex * stack.equity) / 100) },
  ];

  const hasGreenium = resilienceScore >= 80;

  return (
    <Section number="3" title="Green Bond Term Sheet — Capital Structure">
      <p style={{ fontSize: 11, color: '#475569', marginBottom: 16, lineHeight: 1.7 }}>
        Blended finance structure for a total project CAPEX of <strong>{fmtCurrencyFull(totalCapex)}</strong> with a resilience score of <strong>{Math.round(resilienceScore)}</strong>.
      </p>

      {/* Capital Stack Donut (CSS-only for print safety) */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 24, alignItems: 'center' }}>
        {/* CSS donut */}
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" width="120" height="120">
            {(() => {
              let offset = 0;
              const radius = 45;
              const circumference = 2 * Math.PI * radius;
              return tranches.map((t) => {
                const dashLen = (t.pct / 100) * circumference;
                const dashGap = circumference - dashLen;
                const el = (
                  <circle
                    key={t.key}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={TRANCHE_COLORS[t.key]}
                    strokeWidth="16"
                    strokeDasharray={`${dashLen} ${dashGap}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 60 60)"
                  />
                );
                offset += dashLen;
                return el;
              });
            })()}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(totalCapex)}</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1 }}>
          {tranches.map((t) => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: TRANCHE_COLORS[t.key] }} />
              <span style={{ fontSize: 11, color: '#475569', flex: 1 }}>{TRANCHE_LABELS[t.key]}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{t.pct}%</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: TRANCHE_COLORS[t.key], minWidth: 70, textAlign: 'right' }}>{fmtCurrencyFull(t.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tranche Summary Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: '#0f172a', color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderTopLeftRadius: 4 }}>TRANCHE</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', backgroundColor: '#0f172a', color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>ALLOCATION</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', backgroundColor: '#0f172a', color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderTopRightRadius: 4 }}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {tranches.map((t, i) => (
            <tr key={t.key} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
              <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 500 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: TRANCHE_COLORS[t.key], marginRight: 8 }} />
                {TRANCHE_LABELS[t.key]}
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{t.pct}%</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>{fmtCurrencyFull(t.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Blended Results Summary */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: '#d97706', color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderTopLeftRadius: 4 }}>METRIC</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', backgroundColor: '#d97706', color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderTopRightRadius: 4 }}>VALUE</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'Blended Interest Rate', value: `${result.blended_interest_rate.toFixed(2)}%` },
            { label: 'Greenium Discount', value: `${result.greenium_discount_bps > 0 ? '+' : ''}${result.greenium_discount_bps} bps` },
            { label: 'Annual Debt Service', value: fmtCurrencyFull(result.annual_debt_service) },
            { label: 'Lifetime Interest Saved', value: fmtCurrencyFull(result.lifetime_interest_saved) },
          ].map((row, i) => (
            <tr key={row.label} style={{ backgroundColor: i % 2 === 0 ? '#fffbeb' : '#ffffff' }}>
              <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 500 }}>{row.label}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', color: row.label === 'Lifetime Interest Saved' ? '#059669' : '#0f172a', fontWeight: 700 }}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Greenium Impact Highlight */}
      {hasGreenium && result.lifetime_interest_saved > 0 && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderLeft: '4px solid #059669',
          borderRadius: 6,
          padding: 16,
          fontSize: 12,
          lineHeight: 1.7,
          color: '#065f46',
        }}>
          <strong>🌿 Greenium Impact:</strong> This structure saves <strong style={{ color: '#059669' }}>{fmtCurrencyFull(result.lifetime_interest_saved)}</strong> in lifetime interest costs due to the project's high resilience score ({Math.round(resilienceScore)}/100), qualifying for a <strong>{Math.abs(result.greenium_discount_bps)} bps</strong> green bond discount.
        </div>
      )}
    </Section>
  );
}
