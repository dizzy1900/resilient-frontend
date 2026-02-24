import { useState } from 'react';
import { ShieldAlert, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface MonteCarloData {
  mean_npv?: number;
  VaR_95?: number;
  default_probability?: number;
  simulation_count?: number;
  std_dev_npv?: number;
  min_npv?: number;
  max_npv?: number;
  metrics?: {
    npv_usd?: {
      mean?: number;
      std?: number;
      p5?: number;
      min?: number;
    };
  };
}

interface SensitivityRankItem {
  driver: string;
  shocked_npv: number;
  impact_pct: number;
}

interface SensitivityData {
  primary_driver: string;
  driver_impact_pct: number;
  baseline_npv?: number;
  sensitivity_ranking?: SensitivityRankItem[];
}

interface RiskStressTestCardProps {
  monteCarloData: MonteCarloData | null;
  sensitivityData?: SensitivityData | null;
}

const getVaR95 = (mc: MonteCarloData): number => {
  return mc.VaR_95 ?? mc.metrics?.npv_usd?.p5 ?? 0;
};

const getDefaultProbability = (mc: MonteCarloData): number => {
  if (mc.default_probability !== undefined) return mc.default_probability;
  const mean = mc.metrics?.npv_usd?.mean ?? 0;
  const std = mc.metrics?.npv_usd?.std ?? 1;
  if (std === 0) return mean < 0 ? 100 : 0;
  const z = -mean / std;
  const prob = 1 / (1 + Math.exp(-1.7 * z));
  return Math.max(0, Math.min(100, prob * 100));
};

const formatCurrency = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const getDefaultProbColor = (prob: number) => {
  if (prob < 5) return { bar: '#10b981', text: '#10b981', label: 'LOW RISK' };
  if (prob < 20) return { bar: '#f59e0b', text: '#f59e0b', label: 'MODERATE' };
  return { bar: '#f43f5e', text: '#f43f5e', label: 'HIGH RISK' };
};

const getImpactColor = (impact: number) => {
  if (Math.abs(impact) < 5) return 'var(--cb-secondary)';
  if (impact > 100) return '#f43f5e';
  if (impact > 0) return '#eb796f';
  return '#10b981';
};

function DataRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 cb-divider">
      <span className="cb-label">{label}</span>
      <span className="cb-value" style={valueColor ? { color: valueColor } : {}}>
        {value}
      </span>
    </div>
  );
}

export const RiskStressTestCard = ({ monteCarloData, sensitivityData }: RiskStressTestCardProps) => {
  const [rankingOpen, setRankingOpen] = useState(false);

  if (!monteCarloData) return null;

  const var95 = getVaR95(monteCarloData);
  const defaultProb = getDefaultProbability(monteCarloData);
  const isVarNegative = var95 < 0;
  const probStyle = getDefaultProbColor(defaultProb);

  const simCount = monteCarloData.simulation_count;
  const minNpv = monteCarloData.min_npv ?? monteCarloData.metrics?.npv_usd?.min;
  const maxNpv = monteCarloData.max_npv;
  const hasRange = minNpv !== undefined && maxNpv !== undefined;
  const hasRanking = (sensitivityData?.sensitivity_ranking?.length ?? 0) > 0;

  return (
    <div>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--cb-border)' }}>
        <ShieldAlert style={{ width: 10, height: 10, color: 'var(--cb-secondary)' }} />
        <span className="cb-section-heading">RISK STRESS TEST</span>
      </div>

      <div className="px-4">
        <DataRow
          label="VALUE AT RISK (95%)"
          value={
            <span className="flex items-center gap-1">
              {isVarNegative
                ? <TrendingDown style={{ width: 10, height: 10 }} />
                : <TrendingUp style={{ width: 10, height: 10 }} />
              }
              {formatCurrency(var95)}
            </span>
          }
          valueColor={isVarNegative ? '#f43f5e' : '#10b981'}
        />

        <div className="py-2.5 cb-divider">
          <div className="flex items-center justify-between mb-1.5">
            <span className="cb-label">DEFAULT PROBABILITY</span>
            <span className="cb-value" style={{ color: probStyle.text }}>
              {defaultProb.toFixed(1)}% · {probStyle.label}
            </span>
          </div>
          <div className="w-full h-px relative" style={{ backgroundColor: 'var(--cb-border)' }}>
            <div
              className="absolute top-0 left-0 h-full"
              style={{
                width: `${Math.min(defaultProb, 100)}%`,
                backgroundColor: probStyle.bar,
                height: 2,
                marginTop: -0.5,
              }}
            />
          </div>
        </div>

        {simCount !== undefined && (
          <DataRow
            label="SIMULATION RUNS"
            value={`${simCount.toLocaleString()} SCENARIOS`}
          />
        )}

        {hasRange && (
          <DataRow
            label="NPV RANGE"
            value={`${formatCurrency(minNpv!)} → ${formatCurrency(maxNpv!)}`}
          />
        )}

        {sensitivityData && (
          <DataRow
            label="PRIMARY RISK DRIVER"
            value={`${sensitivityData.primary_driver} · ${sensitivityData.driver_impact_pct.toFixed(1)}%`}
            valueColor="#f43f5e"
          />
        )}
      </div>

      {hasRanking && (
        <div style={{ borderTop: '1px solid var(--cb-border)' }}>
          <button
            className="w-full flex items-center justify-between px-4 py-2.5"
            style={{
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderBottom: rankingOpen ? '1px solid var(--cb-border)' : 'none',
            }}
            onClick={() => setRankingOpen(v => !v)}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', color: 'var(--cb-secondary)', textTransform: 'uppercase' }}>DRIVER BREAKDOWN</span>
            {rankingOpen
              ? <ChevronUp style={{ width: 10, height: 10, color: 'var(--cb-secondary)' }} />
              : <ChevronDown style={{ width: 10, height: 10, color: 'var(--cb-secondary)' }} />
            }
          </button>

          {rankingOpen && (
            <div className="px-4 pb-3">
              {sensitivityData!.sensitivity_ranking!.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 cb-divider">
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--cb-secondary)', letterSpacing: '0.03em', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.driver.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.05em', color: getImpactColor(item.impact_pct) }}>
                    {item.impact_pct > 0 ? '+' : ''}{item.impact_pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { getDefaultProbability };
