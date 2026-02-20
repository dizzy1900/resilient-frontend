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
        'bg-transparent border border-white/10 rounded-none shadow-none',
        animate && 'animate-slide-up',
        className
      )}
    >
      {children}
    </div>
  );
};
