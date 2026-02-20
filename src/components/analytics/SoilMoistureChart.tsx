import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

export interface SoilMoistureChartData {
  month: string;
  moisture: number;
}

interface SoilMoistureChartProps {
  data: SoilMoistureChartData[];
  wiltingPoint?: number;
}

const SUMMER_MONTHS = ['Jun', 'Jul', 'Aug'];

export const SoilMoistureChart = ({
  data,
  wiltingPoint = 0.20
}: SoilMoistureChartProps) => {
  const hasSummerDepletion = useMemo(() => {
    return data.some(d =>
      SUMMER_MONTHS.includes(d.month) && d.moisture < wiltingPoint
    );
  }, [data, wiltingPoint]);

  const normalizedData = useMemo(() => {
    const maxValue = Math.max(...data.map(d => d.moisture));
    const isPercentage = maxValue > 1;

    return data.map(d => ({
      ...d,
      moisture: isPercentage ? d.moisture / 100 : d.moisture,
    }));
  }, [data]);

  const yDomain = [0, Math.max(0.6, ...normalizedData.map(d => d.moisture) )];

  return (
    <div className="w-full">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={normalizedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
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
              formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Soil Moisture']}
            />
            <ReferenceLine
              y={wiltingPoint}
              stroke="#eb796f"
              strokeDasharray="4 2"
              strokeWidth={1}
              label={{
                value: 'Wilting Point',
                position: 'right',
                fill: '#eb796f',
                fontSize: 9,
                fontWeight: 400,
              }}
            />
            <Line
              type="monotone"
              dataKey="moisture"
              stroke="#ebebeb"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#ebebeb', stroke: '#ebebeb', strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {hasSummerDepletion && (
        <div className="mt-2 flex items-center gap-2 p-2 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-red-400">
            Critical moisture depletion in growing season
          </span>
        </div>
      )}
    </div>
  );
};
