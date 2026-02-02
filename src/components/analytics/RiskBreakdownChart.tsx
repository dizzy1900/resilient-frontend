import { RiskFactor } from '@/utils/mockAnalyticsData';

interface RiskBreakdownChartProps {
  data: RiskFactor[];
}

export const RiskBreakdownChart = ({ data }: RiskBreakdownChartProps) => {
  return (
    <div className="space-y-3">
      {data.map((factor) => (
        <div key={factor.name} className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/70">{factor.name}</span>
            <span className="text-xs font-medium text-white/90">{factor.percentage}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${factor.percentage}%`,
                backgroundColor: factor.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
