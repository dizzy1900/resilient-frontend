import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface StormChartDataItem {
  period: string;
  current_depth: number;
  future_depth: number;
}

interface FloodFrequencyChartProps {
  data: StormChartDataItem[];
}

// Custom order for periods
const periodOrder = ['1yr', '10yr', '50yr', '100yr'];

export const FloodFrequencyChart = ({ data }: FloodFrequencyChartProps) => {
  // Sort data by period order
  const sortedData = [...data].sort((a, b) => {
    const indexA = periodOrder.indexOf(a.period);
    const indexB = periodOrder.indexOf(b.period);
    return indexA - indexB;
  });

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="period"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickLine={false}
            tickFormatter={(value) => `${value}m`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
            itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}m`,
              name === 'current_depth' ? 'Current Surge Risk' : 'Future Surge (+SLR)',
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) =>
              value === 'current_depth' ? 'Current Surge Risk' : 'Future Surge (+SLR)'
            }
          />
          <Bar
            dataKey="current_depth"
            fill="#3b82f6"
            name="current_depth"
            radius={[4, 4, 0, 0]}
            animationDuration={500}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="future_depth"
            fill="#f97316"
            name="future_depth"
            radius={[4, 4, 0, 0]}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
