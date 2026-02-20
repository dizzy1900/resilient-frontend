import { useState, useCallback, useRef, useEffect } from 'react';
import { ModeContent, ModeContentProps } from '@/components/layout/LeftPanel';
import { RightPanelContent, RightPanelContentProps } from '@/components/layout/RightPanel';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { TimelinePlayer } from '@/components/TimelinePlayer';

type MobileTab = 'controls' | 'data';

const MODE_ITEMS: { mode: DashboardMode; label: string; accent: string }[] = [
  { mode: 'agriculture', label: 'Agri', accent: '#10b981' },
  { mode: 'coastal', label: 'Coast', accent: '#14b8a6' },
  { mode: 'flood', label: 'Flood', accent: '#3b82f6' },
  { mode: 'health', label: 'Health', accent: '#f43f5e' },
  { mode: 'finance', label: 'Fin', accent: '#f59e0b' },
  { mode: 'portfolio', label: 'Port', accent: '#64748b' },
];

export interface MobileBottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  modeContentProps: Omit<ModeContentProps, 'mode'>;
  rightPanelContentProps: Omit<RightPanelContentProps, 'mode'>;
  selectedYear: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  isSplitMode: boolean;
}

const COLLAPSED_HEIGHT = 56;
const PEEK_HEIGHT = 340;

export function MobileBottomSheet({
  isOpen,
  onOpenChange,
  activeTab,
  onTabChange,
  mode,
  onModeChange,
  modeContentProps,
  rightPanelContentProps,
  selectedYear,
  onYearChange,
  isPlaying,
  onPlayToggle,
  isSplitMode,
}: MobileBottomSheetProps) {
  const [sheetHeight, setSheetHeight] = useState(COLLAPSED_HEIGHT);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.85 : 600;

  useEffect(() => {
    setSheetHeight(isOpen ? PEEK_HEIGHT : COLLAPSED_HEIGHT);
  }, [isOpen]);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startHeight.current = sheetHeight;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [sheetHeight]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const diff = startY.current - e.clientY;
    const newHeight = Math.max(COLLAPSED_HEIGHT, Math.min(maxHeight, startHeight.current + diff));
    setSheetHeight(newHeight);
  }, [maxHeight]);

  const handleDragEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (sheetHeight < COLLAPSED_HEIGHT + 40) {
      setSheetHeight(COLLAPSED_HEIGHT);
      onOpenChange(false);
    } else if (sheetHeight < PEEK_HEIGHT) {
      setSheetHeight(PEEK_HEIGHT);
      onOpenChange(true);
    } else {
      setSheetHeight(Math.min(sheetHeight, maxHeight));
      onOpenChange(true);
    }
  }, [sheetHeight, maxHeight, onOpenChange]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setSheetHeight(COLLAPSED_HEIGHT);
      onOpenChange(false);
    } else {
      setSheetHeight(PEEK_HEIGHT);
      onOpenChange(true);
    }
  }, [isOpen, onOpenChange]);

  const isExpanded = sheetHeight > COLLAPSED_HEIGHT;
  const activeAccent = MODE_ITEMS.find((m) => m.mode === mode)?.accent ?? '#10b981';

  return (
    <div
      ref={sheetRef}
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex flex-col"
      style={{
        height: sheetHeight,
        backgroundColor: 'var(--cb-bg)',
        borderTop: '1px solid var(--cb-border)',
        borderRadius: '12px 12px 0 0',
        transition: dragging.current ? 'none' : 'height 0.3s ease',
        overflow: 'hidden',
      }}
    >
      <div
        className="shrink-0 flex flex-col items-center cursor-grab select-none"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onClick={handleToggle}
        style={{ touchAction: 'none' }}
      >
        <div
          className="rounded-full my-3 mx-auto"
          style={{ width: 48, height: 4, backgroundColor: 'var(--cb-border)' }}
        />
      </div>

      <div
        className="shrink-0 flex overflow-x-auto"
        style={{ borderBottom: '1px solid var(--cb-border)' }}
      >
        {MODE_ITEMS.map(({ mode: m, label, accent }) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              flex: 1,
              minWidth: 0,
              height: 28,
              fontSize: 9,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              borderRight: '1px solid var(--cb-border)',
              backgroundColor: mode === m ? 'var(--cb-surface)' : 'transparent',
              color: mode === m ? accent : 'var(--cb-secondary)',
              cursor: 'pointer',
              transition: 'color 0.15s, background-color 0.15s',
              borderBottom: mode === m ? `2px solid ${accent}` : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isExpanded && (
        <>
          <div
            className="shrink-0 flex"
            style={{ borderBottom: '1px solid var(--cb-border)' }}
          >
            {(['controls', 'data'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                style={{
                  flex: 1,
                  height: 32,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', monospace",
                  backgroundColor: activeTab === tab ? 'var(--cb-surface)' : 'transparent',
                  color: activeTab === tab ? activeAccent : 'var(--cb-secondary)',
                  cursor: 'pointer',
                  transition: 'color 0.15s, background-color 0.15s',
                  borderBottom: activeTab === tab ? `2px solid ${activeAccent}` : '2px solid transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === 'controls' ? (
              <ModeContent mode={mode} {...modeContentProps} />
            ) : (
              <RightPanelContent mode={mode} {...rightPanelContentProps} />
            )}
          </div>

          <div
            className="shrink-0"
            style={{ borderTop: '1px solid var(--cb-border)' }}
          >
            <TimelinePlayer
              selectedYear={selectedYear}
              onYearChange={onYearChange}
              isPlaying={isPlaying}
              onPlayToggle={onPlayToggle}
              isSplitMode={isSplitMode}
            />
          </div>
        </>
      )}
    </div>
  );
}
