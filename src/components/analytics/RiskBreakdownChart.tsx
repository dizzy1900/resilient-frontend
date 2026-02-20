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
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">{factor.name}</span>
            <span className="font-mono text-[9px] tracking-widest text-white/70">{factor.percentage}%</span>
          </div>
          <div className="h-1 bg-[#2d2d2d] overflow-hidden">
            <div
              className="h-full transition-all duration-500"
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
