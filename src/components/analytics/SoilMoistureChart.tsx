import { SoilMoistureData } from '@/utils/mockAnalyticsData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SoilMoistureChartProps {
  data: SoilMoistureData[];
}

export const SoilMoistureChart = ({ data }: SoilMoistureChartProps) => {
  const stressThreshold = data[0]?.stressThreshold ?? 30;

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 80]}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
            formatter={(value: number) => [`${value}%`, 'Soil Moisture']}
          />
          <ReferenceLine
            y={stressThreshold}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: 'Stress Threshold',
              position: 'right',
              fill: '#ef4444',
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="moisture"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#moistureGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
