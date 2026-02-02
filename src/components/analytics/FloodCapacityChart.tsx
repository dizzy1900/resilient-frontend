import { FloodCapacityData } from '@/utils/mockAnalyticsData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface FloodCapacityChartProps {
  data: FloodCapacityData[];
}

export const FloodCapacityChart = ({ data }: FloodCapacityChartProps) => {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
            formatter={(value) => (
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>
            )}
          />
          <Bar dataKey="capacity" name="Capacity" radius={[0, 2, 2, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.capacity >= entry.demand ? '#10b981' : '#3b82f6'}
              />
            ))}
          </Bar>
          <Bar
            dataKey="demand"
            name="Demand"
            fill="#ef4444"
            fillOpacity={0.6}
            radius={[0, 2, 2, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
