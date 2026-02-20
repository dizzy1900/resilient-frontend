import { StormSurgeData } from '@/utils/mockAnalyticsData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
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
            formatter={(value: number) => [`${value}m`, '']}
          />
          <Line
            type="monotone"
            dataKey="baseline"
            name="Without Protection"
            stroke="#eb796f"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#eb796f', stroke: '#eb796f', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="withMangroves"
            name="With Mangroves"
            stroke="#8b8b8b"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#8b8b8b', stroke: '#8b8b8b', strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
