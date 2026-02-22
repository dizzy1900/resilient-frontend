import { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/clientSafe';
import { CBATimeSeriesChart, type CBATimeSeriesPoint } from '@/components/analytics/CBATimeSeriesChart';

interface FinancialAssumptions {
  capex_budget: number;
  opex_annual: number;
  discount_rate_pct: number;
  asset_lifespan_years: number;
}

interface ScenarioSandboxProps {
  latitude: number | null;
  longitude: number | null;
  cropType: string;
  initialAssumptions?: Partial<FinancialAssumptions>;
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
}

const DEFAULTS: FinancialAssumptions = {
  capex_budget: 500000,
  opex_annual: 25000,
  discount_rate_pct: 8,
  asset_lifespan_years: 30,
};

function extractAssumptions(initial?: Partial<FinancialAssumptions>): FinancialAssumptions {
  return {
    capex_budget: initial?.capex_budget ?? DEFAULTS.capex_budget,
    opex_annual: initial?.opex_annual ?? DEFAULTS.opex_annual,
    discount_rate_pct: initial?.discount_rate_pct ?? DEFAULTS.discount_rate_pct,
    asset_lifespan_years: initial?.asset_lifespan_years ?? DEFAULTS.asset_lifespan_years,
  };
}

const INPUT_FIELDS: { key: keyof FinancialAssumptions; label: string; prefix?: string; suffix?: string; step: number; min: number; max: number }[] = [
  { key: 'capex_budget', label: 'CAPEX BUDGET', prefix: '$', step: 10000, min: 0, max: 100000000 },
  { key: 'opex_annual', label: 'OPEX / YEAR', prefix: '$', step: 1000, min: 0, max: 10000000 },
  { key: 'discount_rate_pct', label: 'DISCOUNT RATE', suffix: '%', step: 0.5, min: 0, max: 50 },
  { key: 'asset_lifespan_years', label: 'ASSET LIFESPAN', suffix: 'yr', step: 1, min: 1, max: 100 },
];

export function ScenarioSandbox({
  latitude,
  longitude,
  cropType,
  initialAssumptions,
  onRecalculated,
}: ScenarioSandboxProps) {
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(
    () => extractAssumptions(initialAssumptions)
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [cbaTimeSeries, setCbaTimeSeries] = useState<CBATimeSeriesPoint[]>([]);

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
  }, [latitude, longitude, cropType, assumptions.capex_budget, assumptions.opex_annual, assumptions.discount_rate_pct]);

  const handleChange = useCallback((key: keyof FinancialAssumptions, raw: string) => {
    const val = parseFloat(raw);
    if (!isNaN(val)) {
      setAssumptions(prev => ({ ...prev, [key]: val }));
    }
  }, []);

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
        onClick={handleRecalculate}
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

      {cbaTimeSeries.length > 0 && (
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
      )}
    </div>
  );
}
