import { useState, useCallback, useMemo } from 'react';
import { Layers, Percent, Zap, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CapitalStack {
  commercial: number;
  concessional: number;
  equity: number;
}

interface BlendedFinanceCardProps {
  totalCapex: number | null;
  resilienceScore: number | null;
  onCalculate?: (stack: CapitalStack) => void;
  isCalculating?: boolean;
}

function formatCurrency(value: number) {
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

export const BlendedFinanceCard = ({
  totalCapex,
  resilienceScore,
  onCalculate,
  isCalculating,
}: BlendedFinanceCardProps) => {
  const [stack, setStack] = useState<CapitalStack>({
    commercial: 50,
    concessional: 30,
    equity: 20,
  });

  /** Adjust the other two tranches proportionally so the sum stays at 100. */
  const handleSliderChange = useCallback(
    (field: keyof CapitalStack, newVal: number) => {
      setStack((prev) => {
        const clamped = Math.min(Math.max(Math.round(newVal), 0), 100);
        const remaining = 100 - clamped;

        const otherKeys = (Object.keys(prev) as (keyof CapitalStack)[]).filter(
          (k) => k !== field,
        );
        const otherSum = otherKeys.reduce((s, k) => s + prev[k], 0);

        if (otherSum === 0) {
          // Edge: others are both 0, split remaining equally
          const half = Math.round(remaining / 2);
          return {
            ...prev,
            [field]: clamped,
            [otherKeys[0]]: half,
            [otherKeys[1]]: remaining - half,
          } as CapitalStack;
        }

        // Proportional redistribution
        const next = { ...prev, [field]: clamped } as CapitalStack;
        let allocated = 0;
        for (let i = 0; i < otherKeys.length; i++) {
          const k = otherKeys[i];
          if (i === otherKeys.length - 1) {
            // Last one gets the remainder to avoid rounding drift
            next[k] = remaining - allocated;
          } else {
            next[k] = Math.round((prev[k] / otherSum) * remaining);
            allocated += next[k];
          }
        }

        return next;
      });
    },
    [],
  );

  const showGreenium = (resilienceScore ?? 0) >= 80;
  const capexDisplay = totalCapex != null && totalCapex > 0 ? formatCurrency(totalCapex) : '—';
  const resDisplay =
    resilienceScore != null ? `${Math.round(resilienceScore)}` : '—';

  const trancheColors: Record<keyof CapitalStack, string> = {
    commercial: '#3b82f6',
    concessional: '#f59e0b',
    equity: '#10b981',
  };

  const stackBar = useMemo(
    () => (
      <div className="flex w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--cb-surface)' }}>
        <div style={{ width: `${stack.commercial}%`, backgroundColor: trancheColors.commercial, transition: 'width 0.2s' }} />
        <div style={{ width: `${stack.concessional}%`, backgroundColor: trancheColors.concessional, transition: 'width 0.2s' }} />
        <div style={{ width: `${stack.equity}%`, backgroundColor: trancheColors.equity, transition: 'width 0.2s' }} />
      </div>
    ),
    [stack],
  );

  return (
    <div>
      <div
        className="px-4 pt-3 pb-2 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--cb-border)' }}
      >
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
        <span
          className="cb-section-heading"
          style={{ fontSize: 9, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}
        >
          CAPITAL STACK
        </span>
        {stackBar}
      </div>

      {/* Sliders */}
      <div className="px-4 space-y-4 py-3">
        {(
          [
            { key: 'commercial' as const, label: 'Commercial Debt' },
            { key: 'concessional' as const, label: 'Concessional / DFI' },
            { key: 'equity' as const, label: 'Equity / Grant' },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: trancheColors[key] }}
                />
                <span className="cb-label">{label}</span>
                {key === 'commercial' && showGreenium && (
                  <Badge
                    variant="outline"
                    className="text-[8px] px-1.5 py-0 border-emerald-500/50 text-emerald-400"
                  >
                    50bps Greenium
                  </Badge>
                )}
              </div>
              <span
                className="cb-value"
                style={{ fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}
              >
                {stack[key]}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[stack[key]]}
              onValueChange={([v]) => handleSliderChange(key, v)}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Tranche amounts */}
      {totalCapex != null && totalCapex > 0 && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {(['commercial', 'concessional', 'equity'] as const).map((k) => (
              <div
                key={k}
                className="text-center rounded-lg py-2"
                style={{ backgroundColor: 'var(--cb-surface)', border: '1px solid var(--cb-border)' }}
              >
                <div style={{ fontSize: 9, color: trancheColors[k], fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                  {formatCurrency((totalCapex * stack[k]) / 100)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--cb-border)' }}>
        <Button
          onClick={() => onCalculate?.(stack)}
          disabled={isCalculating}
          className="w-full"
          style={{
            backgroundColor: '#f59e0b',
            color: '#000',
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: '0.06em',
          }}
        >
          {isCalculating ? (
            <>
              <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} />
              CALCULATING...
            </>
          ) : (
            <>
              <Zap style={{ width: 12, height: 12 }} />
              CALCULATE BLENDED STRUCTURE
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
