import { Users, Home } from 'lucide-react';

interface SocialImpactCardProps {
  livesProtected: number;
  householdsSecured: number;
}

export const SocialImpactCard = ({ livesProtected, householdsSecured }: SocialImpactCardProps) => {
  const hasImpact = livesProtected > 0 || householdsSecured > 0;
  const borderColor = hasImpact ? 'border-teal-500/30' : 'border-white/10';
  const bgColor = hasImpact ? 'bg-teal-500/5' : 'bg-white/5';

  return (
    <div className={`rounded-xl p-4 border ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${hasImpact ? 'bg-teal-500/20 border-teal-500/30' : 'bg-white/10 border-white/10'} border`}>
          <Users className={`w-4 h-4 ${hasImpact ? 'text-teal-400' : 'text-white/40'}`} />
        </div>
        <h3 className="text-sm font-medium text-white">Social Impact</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Users className={`w-3 h-3 ${hasImpact ? 'text-teal-400' : 'text-white/40'}`} />
            <span className="text-[10px] text-white/50">Lives Protected</span>
          </div>
          <span className={`text-xl font-bold ${hasImpact ? 'text-teal-400' : 'text-white/30'}`}>
            {livesProtected > 0 ? livesProtected.toLocaleString() : '—'}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Home className={`w-3 h-3 ${hasImpact ? 'text-cyan-400' : 'text-white/40'}`} />
            <span className="text-[10px] text-white/50">Households</span>
          </div>
          <span className={`text-xl font-bold ${hasImpact ? 'text-cyan-400' : 'text-white/30'}`}>
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
