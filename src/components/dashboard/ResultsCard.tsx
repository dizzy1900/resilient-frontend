import { TrendingUp, TrendingDown, Shield, AlertTriangle, BarChart3, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ResultsCardProps {
  visible: boolean;
  isLoading?: boolean;
  avoidedLoss: number;
  riskReduction: number;
  monthlyData: { month: string; value: number }[];
}

export const ResultsCard = ({ visible, isLoading, avoidedLoss, riskReduction, monthlyData }: ResultsCardProps) => {
  if (!visible && !isLoading) return null;

  const maxValue = Math.max(...monthlyData.map(d => d.value));
  const isPositive = riskReduction > 0;

  // Skeleton loading state
  if (isLoading) {
    return (
      <Card className="glass-panel border-safe/30 animate-slide-up overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-safe/5 to-transparent pointer-events-none" />
        
        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-safe animate-pulse" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5 relative">
          {/* Avoided Loss Skeleton */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-muted-foreground" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          
          {/* Bar Chart Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <Skeleton 
                    className="w-full rounded-t" 
                    style={{ 
                      height: `${30 + Math.random() * 50}%`,
                      animationDelay: `${index * 50}ms`
                    }}
                  />
                  <Skeleton className="h-2 w-4" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-safe/30 animate-slide-up">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[220px]">
                  <p className="text-xs">
                    Estimated financial savings per hectare when using climate-resilient practices compared to baseline farming methods.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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