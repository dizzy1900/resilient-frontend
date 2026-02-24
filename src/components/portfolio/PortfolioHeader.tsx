import { Activity, ChevronLeft } from 'lucide-react';
import { GlassCard } from '@/components/hud/GlassCard';
import { Button } from '@/components/ui/button';
import { DashboardMode } from '@/components/dashboard/ModeSelector';

interface PortfolioHeaderProps {
  onModeChange: (mode: DashboardMode) => void;
}

export const PortfolioHeader = ({ onModeChange }: PortfolioHeaderProps) => {
  return (
    <GlassCard className="p-3 lg:p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 blur-lg opacity-40" />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-xl font-bold tracking-tight text-purple-400">Resilient</span>
          <span className="text-xs font-medium text-white/50 tracking-wide uppercase">
            Portfolio Analysis
          </span>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('agriculture')}
        className="mt-3 w-full text-white/60 hover:text-white hover:bg-white/10 justify-start"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Map View
      </Button>
    </GlassCard>
  );
};
