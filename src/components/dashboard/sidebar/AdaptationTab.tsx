import { Star, Info, TrendingUp, DollarSign, Zap } from 'lucide-react';

interface PortfolioOption {
  tier: string;
  cost: number;
  roi: number;
  benefit: number;
}

interface AdaptationPortfolio {
  options: PortfolioOption[];
  recommended_strategy: string;
  stress_level?: number;
}

interface AdaptationTabProps {
  portfolio?: AdaptationPortfolio | null;
}

const formatCurrency = (val: number): string => {
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `${val < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${val < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  Genetics: <Zap className="w-3.5 h-3.5" />,
  Agronomic: <TrendingUp className="w-3.5 h-3.5" />,
  Infrastructure: <DollarSign className="w-3.5 h-3.5" />,
};

const getTierIcon = (tier: string): React.ReactNode => {
  for (const key of Object.keys(TIER_ICONS)) {
    if (tier.toLowerCase().includes(key.toLowerCase())) return TIER_ICONS[key];
  }
  return <TrendingUp className="w-3.5 h-3.5" />;
};

export const AdaptationTab = ({ portfolio }: AdaptationTabProps) => {
  if (!portfolio?.options?.length) {
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Adaptation Portfolio
        </h3>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a location on the map to explore nature-based and engineered adaptation solutions.
          </p>
        </div>
      </div>
    );
  }

  const { options, recommended_strategy } = portfolio;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Solutions Menu
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {options.length} strategies
        </span>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const isRecommended = option.tier === recommended_strategy;
          const roiPositive = option.roi >= 0;

          return (
            <div
              key={option.tier}
              className={[
                'rounded-xl border p-3.5 flex flex-col gap-3',
                'cursor-pointer select-none',
                'transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-md',
                isRecommended
                  ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]'
                  : 'border-border bg-muted/20 hover:border-border/80',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 ${isRecommended ? 'text-amber-400' : 'text-muted-foreground'}`}
                  >
                    {getTierIcon(option.tier)}
                  </span>
                  <span
                    className={`text-sm font-semibold truncate ${
                      isRecommended ? 'text-amber-300' : 'text-foreground'
                    }`}
                  >
                    {option.tier}
                  </span>
                  {isRecommended && (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300 leading-none">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      Best
                    </span>
                  )}
                </div>

                <span
                  className={[
                    'shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums leading-none',
                    roiPositive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-red-500/15 text-red-400 border border-red-500/25',
                  ].join(' ')}
                >
                  ROI: {option.roi.toFixed(0)}%
                </span>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-background/40 border border-border/60 px-2.5 py-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-1">
                    CapEx
                  </p>
                  <p className="text-xs font-semibold text-red-400 tabular-nums">
                    {formatCurrency(option.cost)}
                  </p>
                </div>

                <div className="flex-1 rounded-lg bg-background/40 border border-border/60 px-2.5 py-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-1">
                    Avoided Loss
                  </p>
                  <p className="text-xs font-semibold text-emerald-400 tabular-nums">
                    {formatCurrency(option.benefit)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
