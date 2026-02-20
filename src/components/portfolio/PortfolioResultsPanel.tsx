import { Shield, TrendingUp, TrendingDown, BarChart3, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/hud/GlassCard';
import { Badge } from '@/components/ui/badge';
import { PortfolioAsset } from './PortfolioCSVUpload';

interface PortfolioResultsPanelProps {
  assets: (PortfolioAsset & { score?: number })[];
  visible: boolean;
}

const getRiskLevel = (score: number) => {
  if (score >= 70) return { label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' };
  if (score >= 40) return { label: 'Medium Risk', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' };
  return { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' };
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export const PortfolioResultsPanel = ({ assets, visible }: PortfolioResultsPanelProps) => {
  if (!visible || assets.length === 0) return null;

  const scoredAssets = assets.filter(a => a.score !== undefined);
  if (scoredAssets.length === 0) return null;

  const avgScore = Math.round(scoredAssets.reduce((sum, a) => sum + (a.score ?? 0), 0) / scoredAssets.length);
  const totalValue = scoredAssets.reduce((sum, a) => sum + a.Value, 0);
  const atRiskAssets = scoredAssets.filter(a => (a.score ?? 0) < 50);
  const atRiskValue = atRiskAssets.reduce((sum, a) => sum + a.Value, 0);
  const portfolioRisk = getRiskLevel(avgScore);

  return (
    <div className="flex flex-col gap-3">
      {/* Summary Card */}
      <GlassCard className="w-full lg:w-80 p-3 sm:p-4 lg:p-5 border-purple-500/20 animate-in slide-in-from-right duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none rounded-2xl" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold text-white">Portfolio Resilience</span>
            </div>
            <Badge className={`${portfolioRisk.bg} ${portfolioRisk.color} text-xs border`}>
              {portfolioRisk.label}
            </Badge>
          </div>

          {/* Average Score */}
          <div className="text-center py-2">
            <div className={`text-4xl font-bold ${portfolioRisk.color}`}>
              {avgScore}
              <span className="text-lg text-white/50">/100</span>
            </div>
            <p className="text-xs text-white/50 mt-1">Average Resilience Score</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <p className="text-[10px] text-white/50 mb-0.5">Total Portfolio</p>
              <p className="text-sm font-semibold text-white">{formatCurrency(totalValue)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <p className="text-[10px] text-white/50 mb-0.5">Value at Risk</p>
              <p className="text-sm font-semibold text-red-400">{formatCurrency(atRiskValue)}</p>
            </div>
          </div>

          {/* Score Distribution Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
              <BarChart3 className="w-3.5 h-3.5" />
              Asset Resilience Scores
            </div>
            <div className="flex items-end gap-1 h-16">
              {scoredAssets.map((asset, i) => {
                const height = ((asset.score ?? 0) / 100) * 100;
                const risk = getRiskLevel(asset.score ?? 0);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${asset.Name}: ${asset.score}`}>
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        (asset.score ?? 0) >= 70
                          ? 'bg-gradient-to-t from-emerald-500 to-emerald-500/40'
                          : (asset.score ?? 0) >= 40
                          ? 'bg-gradient-to-t from-amber-500 to-amber-500/40'
                          : 'bg-gradient-to-t from-red-500 to-red-500/40'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Per-Asset Breakdown */}
      <GlassCard className="w-full lg:w-80 p-3 sm:p-4 border-purple-500/10 animate-in slide-in-from-right duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Asset Breakdown
          </div>
          {scoredAssets.map((asset, i) => {
            const risk = getRiskLevel(asset.score ?? 0);
            return (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{asset.Name}</p>
                  <p className="text-[10px] text-white/40">{formatCurrency(asset.Value)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${risk.bg} ${risk.color}`}>
                    {(asset.score ?? 0) >= 50 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {asset.score}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};
