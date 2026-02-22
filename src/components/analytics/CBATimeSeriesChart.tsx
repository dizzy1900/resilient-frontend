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

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, number>) => {
  if (active && payload && payload.length) {
    const baseline = payload.find((p) => p.dataKey === 'baseline_cost')?.value as number | undefined;
    const intervention = payload.find((p) => p.dataKey === 'intervention_cost')?.value as number | undefined;
    return (
      <div className="bg-black border border-white/20 p-3 rounded-none text-xs font-mono shadow-xl">
        <p className="text-gray-400 mb-2">Year: {label}</p>
        {baseline != null && (
          <p className="text-red-500">Baseline: ${baseline.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        )}
        {intervention != null && (
          <p className="text-sky-500">Intervention: ${intervention.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        )}
      </div>
    );
  }
  return null;
};

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
    <div className="h-[300px] w-full mt-6">
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
            tickFormatter={(v) => {
              const n = Number(v);
              if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
              if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
              return `$${n.toLocaleString()}`;
            }}
            domain={[domainMin, domainMax]}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
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
