import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface StormChartDataItem {
  period: string;
  current_depth: number;
  future_depth: number;
}

interface FloodFrequencyChartProps {
  data: StormChartDataItem[];
}

const periodOrder = ['1yr', '10yr', '50yr', '100yr'];

export const FloodFrequencyChart = ({ data }: FloodFrequencyChartProps) => {
  const sortedData = [...data].sort((a, b) => {
    const indexA = periodOrder.indexOf(a.period);
    const indexB = periodOrder.indexOf(b.period);
    return indexA - indexB;
  });

  return (
    <div className="w-full h-36 lg:h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="period"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}m`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(13, 13, 13, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0px',
              fontSize: '10px',
              fontFamily: 'monospace',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}m`,
              name === 'current_depth' ? 'Current' : 'Future (+SLR)',
            ]}
          />
          <Bar
            dataKey="current_depth"
            fill="#8b8b8b"
            name="current_depth"
            radius={[0, 0, 0, 0]}
            animationDuration={500}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="future_depth"
            fill="#eb796f"
            name="future_depth"
            radius={[0, 0, 0, 0]}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
