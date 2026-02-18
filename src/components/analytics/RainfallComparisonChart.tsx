import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface RainfallChartData {
  month: string;
  historical: number;
  projected: number;
}

interface RainfallComparisonChartProps {
  data: RainfallChartData[];
  animateProjected?: boolean;
}

export const RainfallComparisonChart = ({
  data,
  animateProjected = false
}: RainfallComparisonChartProps) => {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (animateProjected) {
      setAnimationProgress(0);
      const timer = setTimeout(() => setAnimationProgress(1), 50);
      return () => clearTimeout(timer);
    }
  }, [animateProjected, data]);

  const animatedData = useMemo(() => {
    if (!animateProjected || animationProgress === 1) return data;
    return data.map(d => ({
      ...d,
      projected: d.projected * animationProgress,
    }));
  }, [data, animateProjected, animationProgress]);

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={animatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'mm',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace' }
            }}
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
            formatter={(value: number, name: string) => [
              `${Math.round(value)} mm`,
              name
            ]}
          />
          <Bar
            dataKey="historical"
            name="Historical"
            fill="#8b8b8b"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="projected"
            name="Projected"
            radius={[0, 0, 0, 0]}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {animatedData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill="#eb796f"
                style={{
                  transition: 'all 0.6s ease-out',
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
