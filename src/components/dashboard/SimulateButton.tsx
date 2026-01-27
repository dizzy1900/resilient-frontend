import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimulateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const SimulateButton = ({ onClick, isLoading, disabled }: SimulateButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-safe to-accent hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-safe/30 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Simulating...
        </>
      ) : (
        <>
          <Zap className="w-5 h-5 mr-2" />
          Simulate Resilience
        </>
      )}
    </Button>
  );
};
