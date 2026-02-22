import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ReferenceDot,
  TooltipProps,
} from 'recharts';

export interface CBATimeSeriesPoint {
  year: number;
  baseline_cost: number;
  intervention_cost: number;
}

interface CBATimeSeriesChartProps {
  time_series: CBATimeSeriesPoint[];
}

function formatMillions(value: number): string {
  const m = value / 1_000_000;
  if (m >= 1) return `$${m.toFixed(1)}M`;
  if (m >= 0.01) return `$${(m * 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function CBAChartTooltip({ active, payload, label }: TooltipProps<number, number>) {
  if (!active || !payload?.length || label == null) return null;
  const baseline = payload.find((p) => p.dataKey === 'baseline_cost')?.value as number | undefined;
  const intervention = payload.find((p) => p.dataKey === 'intervention_cost')?.value as number | undefined;
  return (
    <div
      className="rounded-none border px-2 py-1.5 text-xs font-mono"
      style={{
        backgroundColor: 'black',
        borderColor: 'rgba(255,255,255,0.2)',
        color: 'var(--cb-text)',
      }}
    >
      <div style={{ color: 'var(--cb-secondary)', marginBottom: 2 }}>Year {label}</div>
      {baseline != null && (
        <div style={{ color: '#ef4444' }}>Baseline: {formatMillions(baseline)}</div>
      )}
      {intervention != null && (
        <div style={{ color: '#0ea5e9' }}>Intervention: {formatMillions(intervention)}</div>
      )}
    </div>
  );
}

const AXIS_STYLE = {
  fontSize: 10,
  fontFamily: 'ui-monospace, monospace',
  fill: 'var(--cb-secondary)',
  stroke: 'var(--cb-secondary)',
};

export function CBATimeSeriesChart({ time_series }: CBATimeSeriesChartProps) {
  if (!time_series || time_series.length === 0) {
    return (
      <div className="w-full h-64 mt-6 border border-white/20 flex items-center justify-center text-xs text-gray-500">
        No CBA Data Loaded
      </div>
    );
  }

  const chartData = time_series.map((p) => ({
    year: p.year,
    baseline_cost: p.baseline_cost,
    intervention_cost: p.intervention_cost,
  }));

  const allValues = chartData.flatMap((d) => [d.baseline_cost, d.intervention_cost]).filter(Number.isFinite);
  const yMin = allValues.length ? Math.min(...allValues) : 0;
  const yMax = allValues.length ? Math.max(...allValues) : 1;
  const padding = (yMax - yMin) * 0.05 || 1;
  const domainMin = Math.max(0, yMin - padding);
  const domainMax = domainMin === yMax ? domainMin + 1 : yMax + padding;

  return (
    <div className="w-full h-64 mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <XAxis
            dataKey="year"
            tick={AXIS_STYLE}
            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickFormatter={(v) => String(v)}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickFormatter={formatMillions}
            domain={[domainMin, domainMax]}
            width={48}
          />
          <Tooltip content={<CBAChartTooltip />} />
          <Line
            type="monotone"
            dataKey="baseline_cost"
            name="Baseline Cost"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="intervention_cost"
            name="Intervention Cost"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <ReferenceDot
            x={chartData[chartData.length - 1]?.year}
            y={chartData[chartData.length - 1]?.baseline_cost}
            r={3}
            fill="#ef4444"
            stroke="none"
          />
          <ReferenceDot
            x={chartData[chartData.length - 1]?.year}
            y={chartData[chartData.length - 1]?.intervention_cost}
            r={3}
            fill="#0ea5e9"
            stroke="none"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
