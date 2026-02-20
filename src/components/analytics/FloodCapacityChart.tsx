import { FloodCapacityData } from '@/utils/mockAnalyticsData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={80}
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
          />
          <Bar dataKey="capacity" name="Capacity" radius={[0, 0, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.capacity >= entry.demand ? '#8b8b8b' : '#eb796f'}
              />
            ))}
          </Bar>
          <Bar
            dataKey="demand"
            name="Demand"
            fill="#eb796f"
            fillOpacity={0.4}
            radius={[0, 0, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
