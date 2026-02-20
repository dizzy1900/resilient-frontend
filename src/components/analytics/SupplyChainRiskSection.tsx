import { useMemo } from 'react';
import { ArrowDown, Info, TrendingDown, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SupplyChainRiskSectionProps {
  portfolioVolatilityPct: number;
  adaptationActive: boolean;
  adaptedVolatilityPct?: number;
}

const GAUGE_MAX = 40;

const getZoneColor = (pct: number) => {
  if (pct <= 10) return { label: 'Stable', color: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (pct <= 30) return { label: 'Caution', color: 'text-amber-400', border: 'border-amber-500/30' };
  return { label: 'Unstable', color: 'text-red-400', border: 'border-red-500/30' };
};

const YieldVolatilityGauge = ({ value }: { value: number }) => {
  const clampedValue = Math.min(Math.max(value, 0), GAUGE_MAX);
  const angle = (clampedValue / GAUGE_MAX) * 180;
  const zone = getZoneColor(value);

  const cx = 100, cy = 90, r = 70;

  const zoneArcs = [
    { start: 0, end: (10 / GAUGE_MAX) * 180, color: '#10b981' },
    { start: (10 / GAUGE_MAX) * 180, end: (30 / GAUGE_MAX) * 180, color: '#f59e0b' },
    { start: (30 / GAUGE_MAX) * 180, end: 180, color: '#ef4444' },
  ];

  const describeArc = (startAngle: number, endAngle: number) => {
    const startRad = ((180 - startAngle) * Math.PI) / 180;
    const endRad = ((180 - endAngle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy - r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy - r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`;
  };

  const needleRad = ((180 - angle) * Math.PI) / 180;
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy - needleLen * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 10 200 100" className="w-full max-w-[220px]">
        <path d={describeArc(0, 180)} fill="none" stroke="white" strokeOpacity={0.08} strokeWidth={14} strokeLinecap="round" />
        {zoneArcs.map((z, i) => (
          <path key={i} d={describeArc(z.start, z.end)} fill="none" stroke={z.color} strokeOpacity={0.35} strokeWidth={14} strokeLinecap="butt" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="white" fillOpacity={0.9} />
        <text x={cx - r - 4} y={cy + 14} fill="white" fillOpacity={0.4} fontSize={9} textAnchor="middle">0%</text>
        <text x={cx} y={cy - r + 4} fill="white" fillOpacity={0.4} fontSize={9} textAnchor="middle">20%</text>
        <text x={cx + r + 4} y={cy + 14} fill="white" fillOpacity={0.4} fontSize={9} textAnchor="middle">40%</text>
      </svg>
      <div className="flex items-center gap-2 -mt-1">
        <span className={`text-xl font-bold ${zone.color}`}>{value.toFixed(0)}%</span>
        <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border ${zone.border} ${zone.color}`}>
          {zone.label}
        </span>
      </div>
    </div>
  );
};

export const SupplyChainRiskSection = ({
  portfolioVolatilityPct,
  adaptationActive,
  adaptedVolatilityPct,
}: SupplyChainRiskSectionProps) => {
  const bauZone = getZoneColor(portfolioVolatilityPct);
  const adaptedZone = adaptedVolatilityPct !== undefined ? getZoneColor(adaptedVolatilityPct) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Supply Chain Risk</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-white/40 hover:text-white/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] border-white/10">
              <p className="text-xs">
                Lower volatility means predictable supply. Adaptation moves your supply chain from 'High Risk' to 'Stable Contract Grade'.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="text-[10px] text-white/40">
        Yield coefficient of variation across projected scenarios
      </p>

      <div className="border border-white/10 p-3">
        <div className="font-mono text-[9px] uppercase tracking-widest text-white/40 text-center mb-1">Yield Volatility (CV%)</div>
        <YieldVolatilityGauge value={portfolioVolatilityPct} />
      </div>

      {adaptationActive && adaptedVolatilityPct !== undefined && (
        <div className="border border-white/10 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Volatility Reduction</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex-1 p-2 border ${bauZone.border}`}>
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Business as Usual</p>
              <p className={`text-base font-bold ${bauZone.color}`}>{portfolioVolatilityPct.toFixed(0)}%</p>
              <p className={`text-[10px] font-medium ${bauZone.color}`}>{bauZone.label}</p>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <ArrowDown className="w-5 h-5 text-emerald-400 rotate-[-90deg]" />
              <span className="text-[9px] text-emerald-400 font-medium">
                –{(portfolioVolatilityPct - adaptedVolatilityPct).toFixed(0)}%
              </span>
            </div>

            <div className={`flex-1 p-2 border ${adaptedZone?.border}`}>
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-0.5">With Adaptation</p>
              <p className={`text-base font-bold ${adaptedZone?.color}`}>{adaptedVolatilityPct.toFixed(0)}%</p>
              <p className={`text-[10px] font-medium ${adaptedZone?.color}`}>{adaptedZone?.label}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
