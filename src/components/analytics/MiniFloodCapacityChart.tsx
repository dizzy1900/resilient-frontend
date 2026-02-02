import { FloodCapacityData } from '@/utils/mockAnalyticsData';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface MiniFloodCapacityChartProps {
  data: FloodCapacityData[];
}

export const MiniFloodCapacityChart = ({ data }: MiniFloodCapacityChartProps) => {
  return (
    <div className="w-full h-16">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 4, left: 4, bottom: 2 }}
          barGap={1}
        >
          <Bar dataKey="capacity" radius={[0, 2, 2, 0]} barSize={8} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.capacity >= entry.demand ? '#10b981' : '#3b82f6'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
          <Bar
            dataKey="demand"
            fill="#ef4444"
            fillOpacity={0.4}
            radius={[0, 2, 2, 0]}
            barSize={8}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
