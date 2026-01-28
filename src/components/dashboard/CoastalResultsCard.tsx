import { Shield, TrendingDown, Info, Waves, Mountain, CloudRain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CoastalResultsCardProps {
  visible: boolean;
  isLoading: boolean;
  avoidedLoss: number;
  slope: number | null;
  stormWave: number | null;
  mangroveWidth: number;
}

export const CoastalResultsCard = ({
  visible,
  isLoading,
  avoidedLoss,
  slope,
  stormWave,
  mangroveWidth,
}: CoastalResultsCardProps) => {
  if (!visible && !isLoading) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    // Show cents for sub-$1k values so small non-zero outputs don't display as $0
    return `$${value.toFixed(2)}`;
  };

  return (
    <Card className="glass-panel border-primary/30 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            Coastal Protection
          </CardTitle>
          <Badge 
            variant="secondary" 
            className="bg-primary/20 text-primary border-primary/30 text-xs"
          >
            {mangroveWidth}m mangrove
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Avoided Loss */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Avoided Loss</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="text-xs">
                    Estimated economic loss avoided due to the mangrove buffer protecting coastal assets from storm surge and flooding.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-32" />
              <p className="text-xs text-muted-foreground animate-pulse">
                Scanning Coastal Topography...
              </p>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="metric-big text-primary">
                {formatCurrency(avoidedLoss)}
              </span>
              <Shield className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>

        {/* Detected Data Badge - always show after loading completes */}
        {!isLoading && (
          <div className="pt-2">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm text-muted-foreground">Detected Parameters</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <p className="text-xs">
                      Environmental parameters detected at this location used to calculate coastal protection value.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className="bg-secondary/50 text-foreground border-secondary flex items-center gap-1.5 px-2.5 py-1"
              >
                <Mountain className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">Slope: {slope !== null ? `${slope.toFixed(1)}%` : 'N/A'}</span>
              </Badge>
              <Badge 
                variant="outline" 
                className="bg-secondary/50 text-foreground border-secondary flex items-center gap-1.5 px-2.5 py-1"
              >
                <CloudRain className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">Storm Wave: {stormWave !== null ? `${stormWave.toFixed(1)}m` : 'N/A'}</span>
              </Badge>
            </div>
          </div>
        )}

        {/* Visual indicator bar */}
        {!isLoading && (
          <div className="pt-2">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                style={{ width: `${Math.min((avoidedLoss / 1000000) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Low protection</span>
              <span>High protection</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
