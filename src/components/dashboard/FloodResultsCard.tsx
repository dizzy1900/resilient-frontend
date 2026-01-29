import { Droplets, Shield, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FloodResultsCardProps {
  visible: boolean;
  isLoading: boolean;
  floodDepthReduction: number; // in cm
  valueProtected: number; // in dollars
  greenRoofsEnabled: boolean;
  permeablePavementEnabled: boolean;
}

export const FloodResultsCard = ({
  visible,
  isLoading,
  floodDepthReduction,
  valueProtected,
  greenRoofsEnabled,
  permeablePavementEnabled,
}: FloodResultsCardProps) => {
  if (!visible && !isLoading) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const activeInterventions = [
    greenRoofsEnabled && 'Green Roofs',
    permeablePavementEnabled && 'Permeable Pavement',
  ].filter(Boolean);

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          Flood Mitigation Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 bg-secondary/50 rounded animate-pulse" />
            <div className="h-12 bg-secondary/50 rounded animate-pulse" />
          </div>
        ) : (
          <>
            {/* Flood Depth Reduction */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Flood Depth Reduction</span>
              </div>
              <span className="text-lg font-bold text-blue-400">
                {floodDepthReduction > 0 ? `-${floodDepthReduction}` : floodDepthReduction}cm
              </span>
            </div>

            {/* Value Protected */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Value Protected</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">
                {formatCurrency(valueProtected)}
              </span>
            </div>

            {/* Active Interventions */}
            {activeInterventions.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Active Interventions:</p>
                <div className="flex flex-wrap gap-2">
                  {activeInterventions.map((intervention) => (
                    <span
                      key={intervention as string}
                      className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    >
                      {intervention}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
