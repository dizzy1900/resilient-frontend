import { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/clientSafe';
import { CBATimeSeriesChart, type CBATimeSeriesPoint } from '@/components/analytics/CBATimeSeriesChart';
import { CVaRSection, type CVaRDistributionPoint } from '@/components/analytics/CVaRChart';

interface FinancialAssumptions {
  capex_budget: number;
  opex_annual: number;
  insurance_premium_annual: number;
  discount_rate_pct: number;
  asset_lifespan_years: number;
}

export interface BondMetrics {
  green_rate?: number;
  total_greenium_savings?: number;
  [key: string]: unknown;
}

interface ScenarioSandboxProps {
  latitude: number | null;
  longitude: number | null;
  cropType: string;
  initialAssumptions?: Partial<FinancialAssumptions>;
  assetValue?: number;
  onRecalculated: (data: {
    financialData: any;
    monteCarloData: any;
    executiveSummary: string | null;
    sensitivityData: any;
    adaptationStrategy: any;
    adaptationPortfolio: any;
    satellitePreview: any;
    marketIntelligence: any;
    temporalAnalysis: any;
  }) => void;
  onCbaResult?: (result: { bond_metrics: BondMetrics | null; capex_budget: number }) => void;
}

const DEFAULTS: FinancialAssumptions = {
  capex_budget: 500000,
  opex_annual: 25000,
  insurance_premium_annual: 50000,
  discount_rate_pct: 8,
  asset_lifespan_years: 30,
};

function extractAssumptions(initial?: Partial<FinancialAssumptions>): FinancialAssumptions {
  return {
    capex_budget: initial?.capex_budget ?? DEFAULTS.capex_budget,
    opex_annual: initial?.opex_annual ?? DEFAULTS.opex_annual,
    insurance_premium_annual: initial?.insurance_premium_annual ?? DEFAULTS.insurance_premium_annual,
    discount_rate_pct: initial?.discount_rate_pct ?? DEFAULTS.discount_rate_pct,
    asset_lifespan_years: initial?.asset_lifespan_years ?? DEFAULTS.asset_lifespan_years,
  };
}

const INPUT_FIELDS: { key: keyof FinancialAssumptions; label: string; prefix?: string; suffix?: string; step: number; min: number; max: number }[] = [
  { key: 'capex_budget', label: 'CAPEX BUDGET', prefix: '$', step: 10000, min: 0, max: 100000000 },
  { key: 'opex_annual', label: 'OPEX / YEAR', prefix: '$', step: 1000, min: 0, max: 10000000 },
  { key: 'insurance_premium_annual', label: 'INSURANCE PREMIUM / YR', prefix: '$', step: 1000, min: 0, max: 10000000 },
  { key: 'discount_rate_pct', label: 'DISCOUNT RATE', suffix: '%', step: 0.5, min: 0, max: 50 },
  { key: 'asset_lifespan_years', label: 'ASSET LIFESPAN', suffix: 'yr', step: 1, min: 1, max: 100 },
];

const DEFAULT_ASSET_VALUE = 5_000_000;

export function ScenarioSandbox({
  latitude,
  longitude,
  cropType,
  initialAssumptions,
  assetValue = DEFAULT_ASSET_VALUE,
  onRecalculated,
  onCbaResult,
}: ScenarioSandboxProps) {
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(
    () => extractAssumptions(initialAssumptions)
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [cbaTimeSeries, setCbaTimeSeries] = useState<CBATimeSeriesPoint[]>([]);
  const [bondMetrics, setBondMetrics] = useState<BondMetrics | null>(null);
  const [cvarDistribution, setCvarDistribution] = useState<CVaRDistributionPoint[] | null>(null);
  const [cvarMetrics, setCvarMetrics] = useState<{
    expected_annual_loss?: number;
    cvar_95?: number;
    cvar_99?: number;
    [key: string]: unknown;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const cvarExpectedAnnualLoss = cvarMetrics?.expected_annual_loss ?? null;
  const cvar95 = cvarMetrics?.cvar_95 ?? null;
  const cvar99 = cvarMetrics?.cvar_99 ?? null;

  useEffect(() => {
    if (!latitude || !longitude) {
      setCbaTimeSeries([]);
      return;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/finance/cba-series`;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: latitude,
            lon: longitude,
            crop: cropType,
            capex_budget: assumptions.capex_budget,
            opex_annual: assumptions.opex_annual,
            base_insurance_premium: assumptions.insurance_premium_annual,
            discount_rate_pct: assumptions.discount_rate_pct,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          setCbaTimeSeries([]);
          return;
        }
        const json = await res.json();
        const series = json?.time_series ?? json?.data?.time_series ?? [];
        setCbaTimeSeries(Array.isArray(series) ? series : []);
      } catch {
        setCbaTimeSeries([]);
      }
    })();
    return () => controller.abort();
  }, [latitude, longitude, cropType, assumptions.capex_budget, assumptions.opex_annual, assumptions.insurance_premium_annual, assumptions.discount_rate_pct]);

  const handleChange = useCallback((key: keyof FinancialAssumptions, raw: string) => {
    const val = parseFloat(raw);
    if (!isNaN(val)) {
      setAssumptions(prev => ({ ...prev, [key]: val }));
    }
  }, []);

  const handleCalculateCBA = useCallback(async () => {
    console.log('1. ROI Button Clicked!');

    const payload = {
      capex: Number(assumptions.capex_budget) || 500000,
      annual_opex: Number(assumptions.opex_annual) || 25000,
      base_insurance_premium: Number(assumptions.insurance_premium_annual) ?? 50000,
      discount_rate: Number(assumptions.discount_rate_pct) / 100 || 0.08,
      lifespan_years: Number(assumptions.asset_lifespan_years) || 30,
    };

    console.log('2. Sending Payload:', payload);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://web-production-8ff9e.up.railway.app';
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/finance/cba-series`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('3. Fetch status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('4. Backend Data Received:', data);

      const series = data?.time_series;
      setCbaTimeSeries(Array.isArray(series) ? series : []);
      const metrics = data?.bond_metrics ?? null;
      setBondMetrics(metrics);
      onCbaResult?.({ bond_metrics: metrics, capex_budget: assumptions.capex_budget });
      if (!Array.isArray(series) || series.length === 0) {
        console.warn('CBA response missing or empty time_series:', data);
      }
    } catch (error) {
      console.error('5. Fetch Failed:', error);
    }
  }, [assumptions.capex_budget, assumptions.opex_annual, assumptions.insurance_premium_annual, assumptions.discount_rate_pct, assumptions.asset_lifespan_years, onCbaResult]);

  const handleRecalculate = useCallback(async () => {
    if (!latitude || !longitude) return;
    setIsCalculating(true);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('simulate-finance', {
        body: {
          lat: latitude,
          lon: longitude,
          crop: cropType,
          capex_budget: assumptions.capex_budget,
          opex_annual: assumptions.opex_annual,
          discount_rate_pct: assumptions.discount_rate_pct,
          asset_lifespan_years: assumptions.asset_lifespan_years,
        },
      });

      if (error) throw new Error(error.message || 'Re-calculation failed');

      const result = Array.isArray(responseData) ? responseData[0] : responseData;
      const financialAnalysis = result?.financial_analysis ?? result?.data?.financial_analysis ?? result;

      onRecalculated({
        financialData: financialAnalysis,
        monteCarloData: result?.monte_carlo_analysis ?? null,
        executiveSummary: result?.executive_summary ?? null,
        sensitivityData: result?.sensitivity_analysis ?? null,
        adaptationStrategy: result?.adaptation_strategy ?? null,
        adaptationPortfolio: result?.adaptation_portfolio ?? null,
        satellitePreview: result?.satellite_preview ?? null,
        marketIntelligence: result?.market_intelligence ?? null,
        temporalAnalysis: result?.temporal_analysis ?? null,
      });
    } catch (err) {
      console.error('Scenario re-calculation failed:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [latitude, longitude, cropType, assumptions, onRecalculated]);

  const handleRunMonteCarlo = useCallback(async () => {
    console.log('1. Monte Carlo Button Clicked!');
    setIsSimulating(true);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://web-production-8ff9e.up.railway.app';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/finance/cvar-simulation`;
    const capexBudget = assumptions.capex_budget;
    const payload = {
      asset_value: Number(capexBudget) || 5_000_000,
      mean_damage_pct: 0.02,
      volatility_pct: 0.05,
      num_simulations: 10_000,
    };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`CVaR simulation failed: ${res.status}`);
      }
      const data = await res.json();
      const dist = data?.distribution ?? data?.data?.distribution ?? [];
      const metricsObj = data?.metrics ?? data?.data?.metrics ?? data;
      const metrics =
        metricsObj && typeof metricsObj === 'object'
          ? {
              expected_annual_loss:
                metricsObj.expected_annual_loss ?? data?.expected_annual_loss ?? data?.data?.expected_annual_loss,
              cvar_95: metricsObj.cvar_95 ?? metricsObj.cvar_95th ?? data?.cvar_95 ?? data?.cvar_95th ?? data?.data?.cvar_95,
              cvar_99: metricsObj.cvar_99 ?? metricsObj.cvar_99th ?? data?.cvar_99 ?? data?.cvar_99th ?? data?.data?.cvar_99,
            }
          : null;
      setCvarDistribution(Array.isArray(dist) ? dist : null);
      setCvarMetrics(metrics);
      console.log('2. CVaR Data Received:', data);
    } catch (err) {
      console.error('Monte Carlo simulation error:', err);
      setCvarDistribution(null);
      setCvarMetrics(null);
    } finally {
      setIsSimulating(false);
    }
  }, [assumptions.capex_budget]);

  return (
    <div
      className="border-t pt-6 mt-6 px-4"
      style={{ borderColor: 'var(--cb-border)' }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--cb-secondary)',
          display: 'block',
          marginBottom: 16,
        }}
      >
        SCENARIO ASSUMPTIONS
      </span>

      <div className="grid grid-cols-2 gap-4">
        {INPUT_FIELDS.map(({ key, label, prefix, suffix, step, min, max }) => (
          <div key={key}>
            <label
              style={{
                fontFamily: 'monospace',
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--cb-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {label}
            </label>
            <div className="relative">
              {prefix && (
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--cb-secondary)' }}
                >
                  {prefix}
                </span>
              )}
              <input
                type="number"
                value={assumptions[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                step={step}
                min={min}
                max={max}
                className="w-full rounded-none"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--cb-border)',
                  color: 'var(--cb-text)',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  padding: '8px',
                  paddingLeft: prefix ? 18 : 8,
                  paddingRight: suffix ? 28 : 8,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--cb-border)';
                }}
              />
              {suffix && (
                <span
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--cb-secondary)' }}
                >
                  {suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleCalculateCBA}
        disabled={isCalculating || !latitude || !longitude}
        className="w-full mt-4 flex items-center justify-center gap-2"
        style={{
          border: '1px solid var(--cb-border)',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isCalculating ? 'var(--cb-secondary)' : 'var(--cb-text)',
          backgroundColor: 'transparent',
          cursor: isCalculating ? 'wait' : 'pointer',
          transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
          opacity: (!latitude || !longitude) ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isCalculating) {
            e.currentTarget.style.backgroundColor = 'var(--cb-text)';
            e.currentTarget.style.color = 'var(--cb-bg)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = isCalculating ? 'var(--cb-secondary)' : 'var(--cb-text)';
        }}
      >
        {isCalculating ? (
          <>
            <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" />
            CALCULATING...
          </>
        ) : (
          'RE-CALCULATE ROI'
        )}
      </button>

      <div className="mt-6">
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--cb-secondary)',
            display: 'block',
            marginBottom: 8,
          }}
        >
          CBA Time Series
        </span>
        <CBATimeSeriesChart time_series={cbaTimeSeries} />
      </div>

      <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--cb-border)' }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--cb-secondary)',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Climate Value at Risk (CVaR)
        </span>
        <button
          type="button"
          onClick={handleRunMonteCarlo}
          disabled={isSimulating}
          className="w-full flex items-center justify-center gap-2"
          style={{
            border: '1px solid var(--cb-border)',
            padding: '8px 12px',
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isSimulating ? 'var(--cb-secondary)' : 'var(--cb-text)',
            backgroundColor: 'transparent',
            cursor: isSimulating ? 'wait' : 'pointer',
            transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isSimulating) {
              e.currentTarget.style.backgroundColor = 'var(--cb-text)';
              e.currentTarget.style.color = 'var(--cb-bg)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = isSimulating ? 'var(--cb-secondary)' : 'var(--cb-text)';
          }}
        >
          {isSimulating ? (
            <>
              <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" />
              SIMULATING...
            </>
          ) : (
            'RUN MONTE CARLO (10,000 SIMS)'
          )}
        </button>
        <div className="mt-4">
          <CVaRSection
            distribution={cvarDistribution ?? []}
            expectedAnnualLoss={cvarExpectedAnnualLoss}
            cvar95={cvar95}
            cvar99={cvar99}
          />
        </div>
      </div>
    </div>
  );
}
