import { Users, Home } from 'lucide-react';

interface SocialImpactCardProps {
  livesProtected: number;
  householdsSecured: number;
}

export const SocialImpactCard = ({ livesProtected, householdsSecured }: SocialImpactCardProps) => {
  const hasImpact = livesProtected > 0 || householdsSecured > 0;
  const borderColor = hasImpact ? 'border-teal-500/30' : 'border-white/10';

  return (
    <div className={`p-4 border ${borderColor}`}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-3">Social Impact</span>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-1">Lives Protected</span>
          <span className={`text-4xl font-light tracking-tighter ${hasImpact ? 'text-teal-400' : 'text-white/30'}`}>
            {livesProtected > 0 ? livesProtected.toLocaleString() : '—'}
          </span>
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-1">Households</span>
          <span className={`text-4xl font-light tracking-tighter ${hasImpact ? 'text-cyan-400' : 'text-white/30'}`}>
            {householdsSecured > 0 ? householdsSecured.toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {!hasImpact && (
        <p className="text-[10px] text-white/40 mt-2">
          Run a simulation to see social impact metrics
        </p>
      )}
    </div>
  );
};
