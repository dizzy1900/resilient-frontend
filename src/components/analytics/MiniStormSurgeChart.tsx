import { StormSurgeData } from '@/utils/mockAnalyticsData';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

interface MiniStormSurgeChartProps {
  data: StormSurgeData[];
}

export const MiniStormSurgeChart = ({ data }: MiniStormSurgeChartProps) => {
  return (
    <div className="w-full h-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="baseline"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="withMangroves"
            stroke="#14b8a6"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
