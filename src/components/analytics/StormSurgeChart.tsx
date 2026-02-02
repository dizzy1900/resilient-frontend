import { StormSurgeData } from '@/utils/mockAnalyticsData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StormSurgeChartProps {
  data: StormSurgeData[];
}

export const StormSurgeChart = ({ data }: StormSurgeChartProps) => {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="year"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
            formatter={(value: number) => [`${value}m`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
            formatter={(value) => (
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="baseline"
            name="Without Protection"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="withMangroves"
            name="With Mangroves"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ fill: '#14b8a6', strokeWidth: 0, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
