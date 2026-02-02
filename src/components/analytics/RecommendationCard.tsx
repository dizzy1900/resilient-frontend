import { Recommendation } from '@/utils/generateRecommendations';
import {
  Sprout,
  Droplets,
  Shield,
  Leaf,
  Building2,
  Waves,
  TreePine,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const iconMap = {
  seed: Sprout,
  water: Droplets,
  shield: Shield,
  leaf: Leaf,
  building: Building2,
  waves: Waves,
  tree: TreePine,
  drain: CircleDot,
};

const priorityStyles = {
  high: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: 'text-amber-400',
  },
  medium: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: 'text-blue-400',
  },
  low: {
    border: 'border-white/10',
    bg: 'bg-white/5',
    badge: 'bg-white/10 text-white/60 border-white/10',
    icon: 'text-white/60',
  },
};

export const RecommendationCard = ({ recommendation }: RecommendationCardProps) => {
  const { title, description, impact, priority, icon } = recommendation;
  const Icon = iconMap[icon];
  const styles = priorityStyles[priority];

  return (
    <div
      className={cn(
        'p-3 rounded-xl border transition-colors',
        styles.border,
        styles.bg
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', styles.icon)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-white truncate">{title}</h4>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap',
                styles.badge
              )}
            >
              {priority}
            </span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed mb-2">{description}</p>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">{impact}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
