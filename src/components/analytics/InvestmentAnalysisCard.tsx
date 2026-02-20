import { useMemo } from 'react';
import { CheckCircle2, XCircle, DollarSign, Info } from 'lucide-react';
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

    const annualBenefit = avoidedLoss + (includeBusinessInterruption ? dailyRevenue * 5 : 0);

    let pvBenefits = 0;
    for (let t = 1; t <= n; t++) {
      pvBenefits += annualBenefit / Math.pow(1 + r, t);
    }

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

  if (!projectParams) {
    return (
      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block">Investment Analysis</span>
        <div className="p-4 border border-white/10 text-center">
          <DollarSign className="w-6 h-6 text-white/30 mx-auto mb-2" />
          <p className="text-[10px] text-white/40">
            Enable <span className="text-teal-400 font-medium">Sea Wall</span> or{' '}
            <span className="text-blue-400 font-medium">Drainage Upgrade</span> in the sidebar to see BCR analysis.
          </p>
        </div>
      </div>
    );
  }

  const isBankable = bcr >= 1.0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Investment Analysis</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-white/40 hover:text-white/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[240px] border-white/10"
            >
              <p className="text-xs">
                Benefit-Cost Ratio (BCR) compares the NPV of avoided damage against the total project cost over {assetLifespan} years at {discountRate}% discount rate.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className={cn(
        'p-4 border',
        isBankable
          ? 'border-emerald-500/30'
          : 'border-red-500/30'
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Benefit-Cost Ratio</span>
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest border',
            isBankable
              ? 'text-emerald-400 border-emerald-500/30'
              : 'text-red-400 border-red-500/30'
          )}>
            {isBankable ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Bankable
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Unviable
              </>
            )}
          </div>
        </div>
        <span className={cn(
          'text-4xl font-light tracking-tighter tabular-nums',
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

      <div className="p-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-white/50" />
            <span className="text-[10px] text-white/50">Avoided Damage ({assetLifespan}yr NPV)</span>
          </div>
          <span className="text-sm font-bold text-white">{formatCurrency(npvAvoidedDamage)}</span>
        </div>
      </div>

      <div className="p-3 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/50">Project CAPEX</span>
          <span className="text-[10px] font-semibold text-white/80">{formatCurrency(projectParams.capex)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-white/50">Annual OPEX</span>
          <span className="text-[10px] font-semibold text-white/80">{formatCurrency(projectParams.opex)}/yr</span>
        </div>
        {projectParams.type === 'sea_wall' && projectParams.heightIncrease && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-white/50">Wall Height</span>
            <span className="text-[10px] font-semibold text-teal-400">+{projectParams.heightIncrease.toFixed(1)}m</span>
          </div>
        )}
        {projectParams.type === 'drainage' && projectParams.capacityUpgrade && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-white/50">Capacity Upgrade</span>
            <span className="text-[10px] font-semibold text-blue-400">+{projectParams.capacityUpgrade}cm</span>
          </div>
        )}
      </div>
    </div>
  );
};
