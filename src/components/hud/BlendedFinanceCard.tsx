import { useState, useCallback, useMemo } from 'react';
import { Layers, Zap, Loader2, TrendingDown, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchWithRetry } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

interface CapitalStack {
  commercial: number;
  concessional: number;
  equity: number;
}

export interface BlendedResult {
  blended_interest_rate: number;
  greenium_discount_bps: number;
  annual_debt_service: number;
  lifetime_interest_saved: number;
}

interface BlendedFinanceCardProps {
  totalCapex: number | null;
  resilienceScore: number | null;
}

const TRANCHE_COLORS: Record<keyof CapitalStack, string> = {
  commercial: '#3b82f6',
  concessional: '#f59e0b',
  equity: '#10b981',
};

function fmtCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

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

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-lg"
      style={{ backgroundColor: 'var(--cb-bg)', border: '1px solid var(--cb-border)' }}
    >
      <p style={{ fontSize: 10, color: 'var(--cb-secondary)', marginBottom: 2 }}>{name}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--cb-text)' }}>{fmtCurrency(value)}</p>
    </div>
  );
};

export const BlendedFinanceCard = ({
  totalCapex,
  resilienceScore,
}: BlendedFinanceCardProps) => {
  const [stack, setStack] = useState<CapitalStack>({ commercial: 50, concessional: 30, equity: 20 });
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<BlendedResult | null>(null);

  const handleSliderChange = useCallback((field: keyof CapitalStack, newVal: number) => {
    setStack((prev) => {
      const clamped = Math.min(Math.max(Math.round(newVal), 0), 100);
      const remaining = 100 - clamped;
      const otherKeys = (Object.keys(prev) as (keyof CapitalStack)[]).filter((k) => k !== field);
      const otherSum = otherKeys.reduce((s, k) => s + prev[k], 0);

      if (otherSum === 0) {
        const half = Math.round(remaining / 2);
        return { ...prev, [field]: clamped, [otherKeys[0]]: half, [otherKeys[1]]: remaining - half } as CapitalStack;
      }

      const next = { ...prev, [field]: clamped } as CapitalStack;
      let allocated = 0;
      for (let i = 0; i < otherKeys.length; i++) {
        const k = otherKeys[i];
        if (i === otherKeys.length - 1) {
          next[k] = remaining - allocated;
        } else {
          next[k] = Math.round((prev[k] / otherSum) * remaining);
          allocated += next[k];
        }
      }
      return next;
    });
  }, []);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      const payload = {
        total_capex: totalCapex ?? 0,
        resilience_score: resilienceScore ?? 0,
        commercial_pct: stack.commercial / 100,
        concessional_pct: stack.concessional / 100,
        equity_pct: stack.equity / 100,
      };

      const res = await fetchWithRetry(
        'https://api.resilient.digital/api/v1/finance/blended-structure',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const json = await res.json().catch(() => ({}));
      const inner = json?.data ?? json;

      setResult({
        blended_interest_rate: inner.blended_interest_rate ?? inner.blended_rate ?? 0,
        greenium_discount_bps: inner.greenium_discount_bps ?? inner.greenium_bps ?? 0,
        annual_debt_service: inner.annual_debt_service ?? 0,
        lifetime_interest_saved: inner.lifetime_interest_saved ?? inner.interest_saved ?? 0,
      });
    } catch (err: any) {
      console.error('[BlendedFinance] API error', err);
      // Fallback: compute locally
      const capex = totalCapex ?? 0;
      const commRate = 0.065;
      const concRate = 0.025;
      const greeniumBps = (resilienceScore ?? 0) >= 80 ? 50 : 0;
      const effectiveCommRate = commRate - greeniumBps / 10000;
      const blended =
        (stack.commercial / 100) * effectiveCommRate +
        (stack.concessional / 100) * concRate;
      const annualDebt = capex * (1 - stack.equity / 100) * blended;
      const baselineAnnual = capex * (1 - stack.equity / 100) * commRate;
      const saved = (baselineAnnual - annualDebt) * 20; // 20yr tenor

      setResult({
        blended_interest_rate: blended * 100,
        greenium_discount_bps: -greeniumBps,
        annual_debt_service: annualDebt,
        lifetime_interest_saved: saved,
      });

      toast({ title: 'Using local blended finance model', description: 'Backend unavailable — computed locally.' });
    } finally {
      setIsCalculating(false);
    }
  }, [stack, totalCapex, resilienceScore]);

  const showGreenium = (resilienceScore ?? 0) >= 80;
  const capexDisplay = totalCapex != null && totalCapex > 0 ? fmtCurrency(totalCapex) : '—';
  const resDisplay = resilienceScore != null ? `${Math.round(resilienceScore)}` : '—';

  const donutData = useMemo(() => {
    const cap = totalCapex ?? 0;
    return [
      { name: 'Commercial', value: Math.round((cap * stack.commercial) / 100), color: TRANCHE_COLORS.commercial },
      { name: 'Concessional', value: Math.round((cap * stack.concessional) / 100), color: TRANCHE_COLORS.concessional },
      { name: 'Equity', value: Math.round((cap * stack.equity) / 100), color: TRANCHE_COLORS.equity },
    ];
  }, [stack, totalCapex]);

  const stackBar = useMemo(
    () => (
      <div className="flex w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--cb-surface)' }}>
        {(['commercial', 'concessional', 'equity'] as const).map((k) => (
          <div key={k} style={{ width: `${stack[k]}%`, backgroundColor: TRANCHE_COLORS[k], transition: 'width 0.2s' }} />
        ))}
      </div>
    ),
    [stack],
  );

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--cb-border)' }}>
        <div className="flex items-center gap-2">
          <Layers style={{ width: 10, height: 10, color: 'var(--cb-secondary)' }} />
          <span className="cb-section-heading">CAPITAL STRUCTURING DESK</span>
        </div>
      </div>

      {/* Context variables */}
      <div className="px-4">
        <DataRow label="TOTAL CAPEX" value={capexDisplay} valueColor="#f59e0b" />
        <DataRow
          label="RESILIENCE SCORE"
          value={resDisplay}
          valueColor={(resilienceScore ?? 0) >= 80 ? '#10b981' : (resilienceScore ?? 0) >= 50 ? '#f59e0b' : '#f43f5e'}
        />
      </div>

      {/* Stacked bar */}
      <div className="px-4 pt-4 pb-2">
        <span className="cb-section-heading" style={{ fontSize: 9, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
          CAPITAL STACK
        </span>
        {stackBar}
      </div>

      {/* Sliders */}
      <div className="px-4 space-y-4 py-3">
        {([
          { key: 'commercial' as const, label: 'Commercial Debt' },
          { key: 'concessional' as const, label: 'Concessional / DFI' },
          { key: 'equity' as const, label: 'Equity / Grant' },
        ] as const).map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: TRANCHE_COLORS[key] }} />
                <span className="cb-label">{label}</span>
                {key === 'commercial' && showGreenium && (
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-emerald-500/50 text-emerald-400">
                    50bps Greenium
                  </Badge>
                )}
              </div>
              <span className="cb-value" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
                {stack[key]}%
              </span>
            </div>
            <Slider min={0} max={100} step={1} value={[stack[key]]} onValueChange={([v]) => handleSliderChange(key, v)} className="w-full" />
          </div>
        ))}
      </div>

      {/* Tranche amounts */}
      {totalCapex != null && totalCapex > 0 && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {(['commercial', 'concessional', 'equity'] as const).map((k) => (
              <div key={k} className="text-center rounded-lg py-2" style={{ backgroundColor: 'var(--cb-surface)', border: '1px solid var(--cb-border)' }}>
                <div style={{ fontSize: 9, color: TRANCHE_COLORS[k], fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                  {fmtCurrency((totalCapex * stack[k]) / 100)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--cb-border)' }}>
        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full"
          style={{ backgroundColor: '#f59e0b', color: '#000', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.06em' }}
        >
          {isCalculating ? (
            <><Loader2 className="animate-spin" style={{ width: 12, height: 12 }} /> CALCULATING...</>
          ) : (
            <><Zap style={{ width: 12, height: 12 }} /> CALCULATE BLENDED STRUCTURE</>
          )}
        </Button>
      </div>

      {/* ─── Results Dashboard ─── */}
      {result && (
        <div style={{ borderTop: '1px solid var(--cb-border)' }}>
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <CheckCircle2 style={{ width: 10, height: 10, color: '#10b981' }} />
            <span className="cb-section-heading">BLENDED STRUCTURE RESULTS</span>
          </div>

          <div className="px-4">
            <DataRow
              label="BLENDED RATE"
              value={`${result.blended_interest_rate.toFixed(2)}%`}
              valueColor="#3b82f6"
            />
            <DataRow
              label="GREENIUM DISCOUNT"
              value={`${result.greenium_discount_bps > 0 ? '+' : ''}${result.greenium_discount_bps} bps`}
              valueColor={result.greenium_discount_bps < 0 ? '#10b981' : 'var(--cb-text)'}
            />
            <DataRow
              label="ANNUAL DEBT SERVICE"
              value={fmtCurrency(result.annual_debt_service)}
            />
            <DataRow
              label="LIFETIME INTEREST SAVED"
              value={fmtCurrency(result.lifetime_interest_saved)}
              valueColor="#10b981"
            />
          </div>

          {/* Donut Chart */}
          {totalCapex != null && totalCapex > 0 && (
            <div className="px-4 pt-4 pb-4">
              <span className="cb-section-heading" style={{ fontSize: 9, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                CAPITAL STACK BREAKDOWN
              </span>
              <div className="flex items-center gap-4">
                <div style={{ width: 120, height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={52}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span style={{ fontSize: 10, color: 'var(--cb-secondary)', flex: 1 }}>{d.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--cb-text)', fontFamily: 'monospace' }}>{fmtCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
