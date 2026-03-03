import { useState, useCallback, useRef } from 'react';

interface DigitalTwinOverlayProps {
  leftMap: React.ReactNode;
  rightMap: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
}

/**
 * 50/50 side-by-side split view for Digital Twin mode.
 * Both maps share the same viewState; hover-gating prevents infinite loops.
 */
export function DigitalTwinOverlay({
  leftMap,
  rightMap,
  leftLabel = 'BASELINE (2026)',
  rightLabel = 'SCENARIO (2050)',
}: DigitalTwinOverlayProps) {
  return (
    <div className="relative w-full h-full flex">
      {/* Left: Baseline */}
      <div className="relative flex-1 h-full overflow-hidden border-r" style={{ borderColor: 'var(--cb-border)' }}>
        {leftMap}

        {/* Floating label */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none"
          style={{
            backgroundColor: 'rgba(15, 15, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            color: 'var(--cb-secondary)',
            fontFamily: "'Inter', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            padding: '5px 14px',
            border: '1px solid var(--cb-border)',
          }}
        >
          {leftLabel}
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 z-30 pointer-events-none"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1,
          backgroundColor: 'var(--cb-border)',
        }}
      />

      {/* Right: Scenario */}
      <div className="relative flex-1 h-full overflow-hidden">
        {rightMap}

        {/* Floating label */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.10)',
            backdropFilter: 'blur(8px)',
            color: '#10b981',
            fontFamily: "'Inter', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            padding: '5px 14px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
          }}
        >
          {rightLabel}
        </div>
      </div>
    </div>
  );
}
