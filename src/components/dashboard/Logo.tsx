import { Activity } from 'lucide-react';

export const Logo = () => {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-safe to-accent flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-safe to-accent blur-lg opacity-50" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight text-white">ADAPTMetric</span>
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Resilience Engine</span>
      </div>
    </div>
  );
};
