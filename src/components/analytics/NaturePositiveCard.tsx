import { Leaf, DollarSign } from 'lucide-react';

interface NaturePositiveCardProps {
  carbonTons: number;
  carbonValueUsd: number;
  interventionType: 'mangroves' | 'green_roofs' | 'both';
}

export const NaturePositiveCard = ({ carbonTons, carbonValueUsd, interventionType }: NaturePositiveCardProps) => {
  const labelMap = {
    mangroves: 'Mangrove Restoration',
    green_roofs: 'Green Roof Installation',
    both: 'Mangroves + Green Roofs',
  };

  return (
    <div className="rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-medium text-white">Nature Positive</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium">
          Co-Benefits
        </span>
      </div>

      <p className="text-[10px] text-white/50 mb-3">{labelMap[interventionType]}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Leaf className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-white/50">Carbon Sequestered</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">{carbonTons.toLocaleString()}</span>
          <span className="text-[10px] text-white/40 ml-1">tCO₂e/yr</span>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-white/50">Economic Value</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">${carbonValueUsd.toLocaleString()}</span>
          <span className="text-[10px] text-white/40 ml-1">/yr</span>
        </div>
      </div>

      <p className="text-[10px] text-emerald-400/60 mt-2 italic">
        Co-Benefits Generated — eligible for carbon credit programmes
      </p>
    </div>
  );
};
