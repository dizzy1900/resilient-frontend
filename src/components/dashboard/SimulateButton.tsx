import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardMode } from './ModeSelector';
import { cn } from '@/lib/utils';

interface SimulateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  mode?: DashboardMode;
}

const modeStyles: Record<DashboardMode, string> = {
  agriculture: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_0_rgba(16,185,129,0.3)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_0_30px_0_rgba(16,185,129,0.5)] active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.3),0_0_20px_0_rgba(16,185,129,0.3)]',
  coastal: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_0_rgba(20,184,166,0.3)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_0_30px_0_rgba(20,184,166,0.5)] active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.3),0_0_20px_0_rgba(20,184,166,0.3)]',
  flood: 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_0_rgba(59,130,246,0.3)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_0_30px_0_rgba(59,130,246,0.5)] active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.3),0_0_20px_0_rgba(59,130,246,0.3)]',
};

export const SimulateButton = ({ 
  onClick, 
  isLoading, 
  disabled, 
  label = 'Simulate Resilience',
  mode = 'agriculture'
}: SimulateButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "w-full h-12 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        modeStyles[mode]
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Simulating...
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
};
