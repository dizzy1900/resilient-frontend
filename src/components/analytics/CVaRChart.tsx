import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  TooltipProps,
} from 'recharts';

export interface CVaRDistributionPoint {
  loss_amount: number;
  frequency: number;
}

export interface CVaRChartProps {
  distribution: CVaRDistributionPoint[];
  cvar95: number | null;
  cvar99?: number | null;
}

const AXIS_STYLE = {
  fontSize: 10,
  fontFamily: 'ui-monospace, monospace',
  fill: 'var(--cb-secondary)',
  stroke: 'var(--cb-secondary)',
};

function formatCurrencyAxis(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, number>) => {
  if (active && payload && payload.length) {
    const loss = typeof label === 'number' ? label : payload[0]?.payload?.loss_amount;
    const freq = payload.find((p) => p.dataKey === 'frequency')?.value as number | undefined;
    return (
      <div
        className="bg-black border p-3 shadow-xl"
        style={{ borderColor: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}
      >
        <p style={{ fontSize: 10, color: 'var(--cb-secondary)', marginBottom: 4 }}>
          Loss: {formatCurrencyAxis(Number(loss))}
        </p>
        {freq != null && (
          <p style={{ fontSize: 11, color: '#ea580c' }}>Count: {freq.toLocaleString()}</p>
        )}
      </div>
    );
  }
  return null;
};

export function CVaRChart({ distribution, cvar95, cvar99 = null }: CVaRChartProps) {
  if (!distribution?.length) {
    return (
      <div
        className="w-full h-64 mt-4 border flex items-center justify-center text-xs"
        style={{ borderColor: 'var(--cb-border)', color: 'var(--cb-secondary)' }}
      >
        No CVaR distribution. Run Monte Carlo (10,000 sims).
      </div>
    );
  }

  const chartData = distribution.map((d) => ({
    loss_amount: d.loss_amount,
    frequency: d.frequency,
    name: d.loss_amount,
  }));

  const maxFreq = Math.max(...chartData.map((d) => d.frequency), 1);
  const domainMax = maxFreq * 1.05 || 1;

  return (
    <div className="h-[260px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 28, right: 8, left: 4, bottom: 8 }}
        >
          <XAxis
            dataKey="loss_amount"
            type="number"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
            tickFormatter={(v) => formatCurrencyAxis(Number(v))}
            domain={['dataMin', 'dataMax']}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            dataKey="frequency"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
            domain={[0, domainMax]}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar
            dataKey="frequency"
            fill="#ea580c"
            radius={0}
            maxBarSize={24}
            isAnimationActive={false}
          />
          {cvar95 != null && Number.isFinite(cvar95) && (
            <ReferenceLine
              x={cvar95}
              stroke="#ef4444"
              strokeWidth={2}
              label={{
                value: '95% CVaR',
                position: 'top',
                fill: '#ef4444',
                fontSize: 9,
                fontFamily: 'ui-monospace, monospace',
              }}
            />
          )}
          {cvar99 != null && Number.isFinite(cvar99) && (
            <ReferenceLine
              x={cvar99}
              stroke="#ef4444"
              strokeWidth={2}
              label={{
                value: '99% CVaR',
                position: 'top',
                fill: '#ef4444',
                fontSize: 9,
                fontFamily: 'ui-monospace, monospace',
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCurrencyMetric(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export interface CVaRMetricsPanelProps {
  expectedAnnualLoss: number | null;
  cvar95: number | null;
  cvar99: number | null;
}

export function CVaRMetricsPanel({
  expectedAnnualLoss,
  cvar95,
  cvar99,
}: CVaRMetricsPanelProps) {
  const hasAny =
    (expectedAnnualLoss != null && Number.isFinite(expectedAnnualLoss)) ||
    (cvar95 != null && Number.isFinite(cvar95)) ||
    (cvar99 != null && Number.isFinite(cvar99));

  if (!hasAny) return null;

  return (
    <div
      className="grid grid-cols-3 gap-3 mb-4"
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {expectedAnnualLoss != null && Number.isFinite(expectedAnnualLoss) && (
        <div style={{ color: 'var(--cb-secondary)' }}>
          <div style={{ marginBottom: 2 }}>Expected Annual Loss</div>
          <div style={{ color: 'var(--cb-text)', fontSize: 12 }}>{formatCurrencyMetric(expectedAnnualLoss)}</div>
        </div>
      )}
      {cvar95 != null && Number.isFinite(cvar95) && (
        <div style={{ color: 'var(--cb-secondary)' }}>
          <div style={{ marginBottom: 2 }}>95% CVaR (Tail Risk)</div>
          <div style={{ color: 'var(--cb-text)', fontSize: 12 }}>{formatCurrencyMetric(cvar95)}</div>
        </div>
      )}
      {cvar99 != null && Number.isFinite(cvar99) && (
        <div style={{ color: 'var(--cb-secondary)' }}>
          <div style={{ marginBottom: 2 }}>99% CVaR (Extreme Tail)</div>
          <div style={{ color: '#ef4444', fontSize: 12 }}>{formatCurrencyMetric(cvar99)}</div>
        </div>
      )}
    </div>
  );
}

export interface CVaRSectionProps {
  distribution: CVaRDistributionPoint[];
  expectedAnnualLoss: number | null;
  cvar95: number | null;
  cvar99: number | null;
}

export function CVaRSection({
  distribution,
  expectedAnnualLoss,
  cvar95,
  cvar99,
}: CVaRSectionProps) {
  return (
    <>
      <CVaRMetricsPanel
        expectedAnnualLoss={expectedAnnualLoss}
        cvar95={cvar95}
        cvar99={cvar99}
      />
      <CVaRChart distribution={distribution} cvar95={cvar95} cvar99={cvar99} />
    </>
  );
}
