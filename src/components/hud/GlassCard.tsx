import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export const GlassCard = ({ children, className, animate = true }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl',
        animate && 'animate-slide-up',
        className
      )}
    >
      {children}
    </div>
  );
};
