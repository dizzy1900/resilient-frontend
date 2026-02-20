import * as React from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { DashboardMode } from './ModeSelector';

interface SimulateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  mode?: DashboardMode;
}

const modeStyles: Record<DashboardMode, {
  gradient: string;
  hoverGradient: string;
  glowColor: string;
}> = {
  agriculture: {
    gradient: 'linear-gradient(to right, #10b981, #14b8a6)',
    hoverGradient: 'linear-gradient(to right, #059669, #0d9488)',
    glowColor: '16, 185, 129',
  },
  coastal: {
    gradient: 'linear-gradient(to right, #14b8a6, #06b6d4)',
    hoverGradient: 'linear-gradient(to right, #0d9488, #0891b2)',
    glowColor: '20, 184, 166',
  },
  flood: {
    gradient: 'linear-gradient(to right, #3b82f6, #60a5fa)',
    hoverGradient: 'linear-gradient(to right, #2563eb, #3b82f6)',
    glowColor: '59, 130, 246',
  },
  health: {
    gradient: 'linear-gradient(to right, #e11d48, #f43f5e)',
    hoverGradient: 'linear-gradient(to right, #be123c, #e11d48)',
    glowColor: '244, 63, 94',
  },
  finance: {
    gradient: 'linear-gradient(to right, #d97706, #f59e0b)',
    hoverGradient: 'linear-gradient(to right, #b45309, #d97706)',
    glowColor: '245, 158, 11',
  },
  portfolio: {
    gradient: 'linear-gradient(to right, #9333ea, #a855f7)',
    hoverGradient: 'linear-gradient(to right, #7c3aed, #9333ea)',
    glowColor: '147, 51, 234',
  },
};

export const SimulateButton = ({
  onClick,
  isLoading,
  disabled,
  label = 'Simulate Resilience',
  mode = 'agriculture'
}: SimulateButtonProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const currentStyle = modeStyles[mode];
  const currentGradient = isHovered ? currentStyle.hoverGradient : currentStyle.gradient;
  const glowIntensity = isPressed ? '0.3' : (isHovered ? '0.5' : '0.3');
  const glowSize = isPressed ? '20px' : (isHovered ? '30px' : '20px');
  const insetHighlight = isPressed ? 'none' : (isHovered ? 'inset 0 1px 0 0 rgba(255,255,255,0.3)' : 'inset 0 1px 0 0 rgba(255,255,255,0.2)');
  const insetShadow = isPressed ? 'inset 0 2px 4px 0 rgba(0,0,0,0.3)' : 'none';
  const scale = isPressed ? 0.98 : (isHovered ? 1.02 : 1);

  const shadowParts = [
    insetHighlight !== 'none' ? insetHighlight : null,
    insetShadow !== 'none' ? insetShadow : null,
    `0 0 ${glowSize} 0 rgba(${currentStyle.glowColor}, ${glowIntensity})`
  ].filter(Boolean);
  const boxShadow = shadowParts.join(', ');

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        background: currentGradient,
        boxShadow: boxShadow,
        transform: `scale(${scale})`,
      }}
      className="w-full h-12 text-sm font-semibold text-white transition-all duration-300 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
    </button>
  );
};
