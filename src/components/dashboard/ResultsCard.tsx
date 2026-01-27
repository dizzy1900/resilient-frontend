import { TrendingUp, TrendingDown, Shield, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultsCardProps {
  visible: boolean;
  avoidedLoss: number;
  riskReduction: number;
  monthlyData: { month: string; value: number }[];
}

export const ResultsCard = ({ visible, avoidedLoss, riskReduction, monthlyData }: ResultsCardProps) => {
  if (!visible) return null;

  const maxValue = Math.max(...monthlyData.map(d => d.value));
  const isPositive = riskReduction > 0;

  return (
    <Card className="glass-panel border-safe/30 animate-slide-up overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-safe/5 to-transparent pointer-events-none" />
      
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-safe" />
            Resilience Results
          </CardTitle>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isPositive ? 'bg-safe/20 text-safe' : 'bg-risk/20 text-risk'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{riskReduction}%
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5 relative">
        {/* Avoided Loss Metric */}
        <div className="space-y-1">
          <span className="metric-label flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Projected Avoided Loss
          </span>
          <div className="flex items-baseline gap-2">
            <span className="metric-big text-safe">${avoidedLoss.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">USD / hectare</span>
          </div>
        </div>
        
        {/* Bar Chart */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
            Monthly Risk Profile
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {monthlyData.map((data, index) => {
              const height = (data.value / maxValue) * 100;
              const isHighRisk = data.value > maxValue * 0.7;
              return (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full rounded-t transition-all duration-500 ${
                      isHighRisk ? 'bg-gradient-to-t from-risk to-risk/60' : 'bg-gradient-to-t from-safe to-safe/60'
                    }`}
                    style={{ 
                      height: `${height}%`,
                      animationDelay: `${index * 50}ms`
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
