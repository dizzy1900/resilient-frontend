import { useMemo } from 'react';
import { TrendingUp, CheckCircle2, XCircle, DollarSign, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DefensiveProjectParams } from '@/components/hud/DefensiveInfrastructureModal';

interface InvestmentAnalysisCardProps {
  avoidedLoss: number;
  projectParams: DefensiveProjectParams | null;
  assetLifespan: number;
  discountRate: number;
  propertyValue: number;
  dailyRevenue: number;
  includeBusinessInterruption: boolean;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export const InvestmentAnalysisCard = ({
  avoidedLoss,
  projectParams,
  assetLifespan,
  discountRate,
  propertyValue,
  dailyRevenue,
  includeBusinessInterruption,
}: InvestmentAnalysisCardProps) => {
  const { bcr, npvAvoidedDamage } = useMemo(() => {
    if (!projectParams) {
      return { bcr: 0, npvAvoidedDamage: 0 };
    }

    const r = discountRate / 100;
    const n = assetLifespan;

    // Annual benefit: avoided loss from the simulation + optional business interruption savings
    // Assume 5 disruption days/year avoided on average
    const annualBenefit = avoidedLoss + (includeBusinessInterruption ? dailyRevenue * 5 : 0);

    // NPV of benefits over lifespan
    let pvBenefits = 0;
    for (let t = 1; t <= n; t++) {
      pvBenefits += annualBenefit / Math.pow(1 + r, t);
    }

    // NPV of costs
    let pvCosts = projectParams.capex;
    for (let t = 1; t <= n; t++) {
      pvCosts += projectParams.opex / Math.pow(1 + r, t);
    }

    const ratio = pvCosts > 0 ? pvBenefits / pvCosts : 0;

    return {
      bcr: Math.round(ratio * 100) / 100,
      npvAvoidedDamage: Math.round(pvBenefits),
    };
  }, [avoidedLoss, projectParams, assetLifespan, discountRate, dailyRevenue, includeBusinessInterruption]);

  if (!projectParams) return null;

  const isBankable = bcr >= 1.0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-medium text-white">Investment Analysis</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-white/40 hover:text-white/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[240px] bg-slate-900/95 backdrop-blur-xl border-white/10"
            >
              <p className="text-xs">
                Benefit-Cost Ratio (BCR) compares the NPV of avoided damage against the total project cost over {assetLifespan} years at {discountRate}% discount rate.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* BCR Primary Metric */}
      <div className={cn(
        'p-4 rounded-xl border',
        isBankable
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-red-500/10 border-red-500/30'
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60">Benefit-Cost Ratio</span>
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
            isBankable
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          )}>
            {isBankable ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Bankable
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                Unviable
              </>
            )}
          </div>
        </div>
        <span className={cn(
          'text-3xl font-bold tabular-nums',
          isBankable ? 'text-emerald-400' : 'text-red-400'
        )}>
          {bcr.toFixed(2)}x
        </span>
        <p className="text-[10px] text-white/40 mt-1">
          {isBankable
            ? `Every $1 invested returns $${bcr.toFixed(2)} in avoided damage`
            : 'Project costs exceed expected benefits at current parameters'}
        </p>
      </div>

      {/* Secondary: Avoided Damage NPV */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-white/50" />
            <span className="text-xs text-white/60">Avoided Damage ({assetLifespan}yr NPV)</span>
          </div>
          <span className="text-sm font-bold text-white">{formatCurrency(npvAvoidedDamage)}</span>
        </div>
      </div>

      {/* Project Cost Summary */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Project CAPEX</span>
          <span className="text-xs font-semibold text-white/80">{formatCurrency(projectParams.capex)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/60">Annual OPEX</span>
          <span className="text-xs font-semibold text-white/80">{formatCurrency(projectParams.opex)}/yr</span>
        </div>
        {projectParams.type === 'sea_wall' && projectParams.heightIncrease && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-white/60">Wall Height</span>
            <span className="text-xs font-semibold text-teal-400">+{projectParams.heightIncrease.toFixed(1)}m</span>
          </div>
        )}
        {projectParams.type === 'drainage' && projectParams.capacityUpgrade && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-white/60">Capacity Upgrade</span>
            <span className="text-xs font-semibold text-blue-400">+{projectParams.capacityUpgrade}cm</span>
          </div>
        )}
      </div>
    </div>
  );
};
