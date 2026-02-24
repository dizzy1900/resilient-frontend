import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface DigitalTwinOverlayProps {
  leftMap: React.ReactNode;
  rightMap: React.ReactNode;
}

export function DigitalTwinOverlay({ leftMap, rightMap }: DigitalTwinOverlayProps) {
  const [splitPosition, setSplitPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(20, Math.min(80, (x / rect.width) * 100));
    setSplitPosition(pct);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => { isDragging.current = false; };
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}>
        {leftMap}
      </div>

      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}>
        {rightMap}
      </div>

      <div
        className="absolute top-0 left-0 z-20 pointer-events-none"
        style={{
          backgroundColor: 'var(--cb-bg)',
          color: 'var(--cb-secondary)',
          fontFamily: "'Inter', monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '6px 16px',
          borderBottom: '1px solid var(--cb-border)',
          borderRight: '1px solid var(--cb-border)',
        }}
      >
        BASELINE SCENARIO
      </div>

      <div
        className="absolute top-0 z-20 pointer-events-none"
        style={{
          right: 80,
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          fontFamily: "'Inter', monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '6px 16px',
          borderBottom: '1px solid #10b981',
          borderLeft: '1px solid #10b981',
        }}
      >
        RESILIENT SCENARIO
      </div>

      <div
        className="absolute top-0 bottom-0 z-30 flex items-center"
        style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div
          className="absolute top-0 bottom-0"
          style={{ width: 1, backgroundColor: 'var(--cb-border)', left: '50%', transform: 'translateX(-50%)' }}
        />

        <div
          onPointerDown={handlePointerDown}
          className="relative flex items-center justify-center cursor-col-resize select-none"
          style={{
            width: 28,
            height: 48,
            backgroundColor: 'var(--cb-bg)',
            border: '1px solid var(--cb-border)',
            borderRadius: 4,
            color: 'var(--cb-secondary)',
            zIndex: 1,
            touchAction: 'none',
          }}
        >
          <GripVertical style={{ width: 14, height: 14 }} />
        </div>
      </div>
    </div>
  );
}
