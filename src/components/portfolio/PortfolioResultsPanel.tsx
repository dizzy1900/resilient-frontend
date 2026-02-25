import { Shield, TrendingUp, TrendingDown, BarChart3, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/hud/GlassCard';
import { Badge } from '@/components/ui/badge';
import { PortfolioAsset } from './PortfolioCSVUpload';

/** Asset may be UI shape (Value, score, Name) or backend snake_case (value, resilience_score, name) */
type ScoredAsset = (PortfolioAsset & { score?: number }) | Record<string, unknown>;

interface PortfolioResultsPanelProps {
  assets: ScoredAsset[];
  visible: boolean;
}

const getRiskLevel = (score: number | undefined) => {
  if (score == null) return { label: 'N/A', color: 'text-white/40', bg: 'bg-white/10 border-white/20' };
  if (score >= 70) return { label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' };
  if (score >= 40) return { label: 'Medium Risk', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' };
  return { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' };
};

const formatCurrency = (value: number) => {
  if (!isFinite(value) || isNaN(value)) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

/** Read value from asset: backend snake_case or UI shape */
const getAssetValue = (a: ScoredAsset): number => {
  const r = a as Record<string, unknown>;
  const input = (r?.input ?? {}) as Record<string, unknown>;
  return Number(input?.asset_value ?? input?.value ?? r.value ?? (a as PortfolioAsset).Value ?? 0) || 0;
};

/** Read resilience score – may be undefined for agriculture runs */
const getAssetScore = (a: ScoredAsset): number | undefined => {
  const r = a as Record<string, unknown>;
  const s = r.resilience_score ?? (a as { score?: number }).score;
  return s != null && !isNaN(Number(s)) ? Number(s) : undefined;
};

/** Read display name: try crop_type from input first, then name */
const getAssetName = (a: ScoredAsset): string => {
  const r = a as Record<string, unknown>;
  const input = (r?.input ?? {}) as Record<string, unknown>;
  return String(input?.crop_type ?? input?.name ?? r.name ?? (a as PortfolioAsset).Name ?? 'Unknown Asset');
};

export const PortfolioResultsPanel = ({ assets, visible }: PortfolioResultsPanelProps) => {
  if (!visible || assets.length === 0) return null;

  // Allow rendering even without resilience scores (agriculture mode)
  const hasScores = assets.some((a) => getAssetScore(a) !== undefined);
  const avgScore = hasScores
    ? Math.round(
        assets.reduce((sum, a) => sum + (getAssetScore(a) ?? 0), 0) /
          (assets.filter((a) => getAssetScore(a) !== undefined).length || 1)
      )
    : undefined;
  const totalValue = assets.reduce((sum, a) => sum + getAssetValue(a), 0);
  const atRiskAssets = assets.filter((a) => {
    const s = getAssetScore(a);
    return s != null && s < 50;
  });
  const atRiskValue = atRiskAssets.reduce((sum, a) => sum + getAssetValue(a), 0);
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
              {avgScore != null ? avgScore : 'N/A'}
              {avgScore != null && <span className="text-lg text-white/50">/100</span>}
            </div>
            <p className="text-xs text-white/50 mt-1">
              {avgScore != null ? 'Average Resilience Score' : 'No resilience scores available'}
            </p>
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

          {/* Score Distribution Bar – only show if scores exist */}
          {hasScores && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                <BarChart3 className="w-3.5 h-3.5" />
                Asset Resilience Scores
              </div>
              <div className="flex items-end gap-1 h-16">
                {assets.map((asset, i) => {
                  const score = getAssetScore(asset) ?? 0;
                  const height = (score / 100) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${getAssetName(asset)}: ${score}`}>
                      <div
                        className={`w-full rounded-t transition-all duration-500 ${
                          score >= 70
                            ? 'bg-gradient-to-t from-emerald-500 to-emerald-500/40'
                            : score >= 40
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
          )}
        </div>
      </GlassCard>

      {/* Per-Asset Breakdown */}
      <GlassCard className="w-full lg:w-80 p-3 sm:p-4 border-purple-500/10 animate-in slide-in-from-right duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Asset Breakdown
          </div>
          {assets.map((asset, i) => {
            const score = getAssetScore(asset);
            const risk = getRiskLevel(score);
            return (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{getAssetName(asset)}</p>
                  <p className="text-[10px] text-white/40">{formatCurrency(getAssetValue(asset))}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${risk.bg} ${risk.color}`}>
                    {score != null ? (
                      <>
                        {score >= 50 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {score}
                      </>
                    ) : (
                      'N/A'
                    )}
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
