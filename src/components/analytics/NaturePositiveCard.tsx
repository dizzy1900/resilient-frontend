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
    <div className="p-4 border border-emerald-500/30">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Nature Positive</span>
        <span className="font-mono text-[10px] uppercase tracking-widest border border-emerald-500/30 text-emerald-400 px-2 py-0.5">
          Co-Benefits
        </span>
      </div>

      <p className="text-[10px] text-white/40 mb-3">{labelMap[interventionType]}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-white/10 p-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-1">Carbon Sequestered</span>
          <span className="text-4xl font-light tracking-tighter text-emerald-400">{carbonTons.toLocaleString()}</span>
          <span className="text-[10px] text-white/40 ml-1">tCO2e/yr</span>
        </div>

        <div className="border border-white/10 p-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-1">Economic Value</span>
          <span className="text-4xl font-light tracking-tighter text-emerald-400">${carbonValueUsd.toLocaleString()}</span>
          <span className="text-[10px] text-white/40 ml-1">/yr</span>
        </div>
      </div>

      <p className="text-[10px] text-emerald-400/60 mt-2 italic">
        Co-Benefits Generated — eligible for carbon credit programmes
      </p>
    </div>
  );
};
