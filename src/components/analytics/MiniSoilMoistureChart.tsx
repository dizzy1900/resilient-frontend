import { SoilMoistureData } from '@/utils/mockAnalyticsData';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface MiniSoilMoistureChartProps {
  data: SoilMoistureData[];
}

export const MiniSoilMoistureChart = ({ data }: MiniSoilMoistureChartProps) => {
  const stressThreshold = data[0]?.stressThreshold ?? 30;

  return (
    <div className="w-full h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="miniMoistureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <ReferenceLine
            y={stressThreshold}
            stroke="#ef4444"
            strokeDasharray="2 2"
            strokeOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="moisture"
            stroke="#10b981"
            strokeWidth={1.5}
            fill="url(#miniMoistureGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
