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
  agriculture: 'bg-mode-agriculture hover:bg-mode-agriculture/90',
  coastal: 'bg-mode-coastal hover:bg-mode-coastal/90',
  flood: 'bg-mode-flood hover:bg-mode-flood/90',
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
        "w-full h-12 text-sm font-semibold text-white transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
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
