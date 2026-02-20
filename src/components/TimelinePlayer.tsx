import { useEffect, useRef, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, Calendar } from 'lucide-react';

interface TimelinePlayerProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  isSplitMode?: boolean;
}

const MIN_YEAR = 2026;
const MAX_YEAR = 2050;
const INTERVAL_MS = 800;

export function TimelinePlayer({
  selectedYear,
  onYearChange,
  isPlaying,
  onPlayToggle,
  isSplitMode = false,
}: TimelinePlayerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleYearIncrement = useCallback(() => {
    onYearChange(selectedYear >= MAX_YEAR ? MIN_YEAR : selectedYear + 1);
  }, [selectedYear, onYearChange]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(handleYearIncrement, INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, handleYearIncrement]);

  const handleSliderChange = useCallback(
    (value: number[]) => {
      onYearChange(value[0]);
    },
    [onYearChange]
  );

  const sliderBaseClasses = "w-full group";
  const sliderTrackClasses = "[&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-track]]:rounded-full [&_[data-radix-slider-track]]:transition-all [&_[data-radix-slider-track]]:duration-200 hover:[&_[data-radix-slider-track]]:bg-white/15";
  const sliderRangeClasses = "[&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:via-teal-500 [&_[data-radix-slider-range]]:to-cyan-500 [&_[data-radix-slider-range]]:transition-all [&_[data-radix-slider-range]]:duration-300";
  const sliderThumbClasses = "[&_[data-radix-slider-thumb]]:border-2 [&_[data-radix-slider-thumb]]:border-white/90 [&_[data-radix-slider-thumb]]:bg-emerald-500 [&_[data-radix-slider-thumb]]:shadow-lg [&_[data-radix-slider-thumb]]:shadow-emerald-500/40 [&_[data-radix-slider-thumb]]:transition-all [&_[data-radix-slider-thumb]]:duration-200 hover:[&_[data-radix-slider-thumb]]:scale-110 hover:[&_[data-radix-slider-thumb]]:shadow-xl hover:[&_[data-radix-slider-thumb]]:shadow-emerald-500/50 focus:[&_[data-radix-slider-thumb]]:ring-2 focus:[&_[data-radix-slider-thumb]]:ring-emerald-400/50 focus:[&_[data-radix-slider-thumb]]:ring-offset-2 focus:[&_[data-radix-slider-thumb]]:ring-offset-black/50";
  const sliderHeightClasses = '[&_[data-radix-slider-track]]:h-2';

  return (
    <>
      {/* Desktop: flat panel footer — rendered inside LeftPanel, so no wrapper needed */}
      <div
        className="hidden lg:block w-full px-4 py-3"
        style={{ backgroundColor: 'var(--cb-bg)' }}
      >
        <div className="cb-label mb-2">Climate Projection Timeline</div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayToggle}
            className="shrink-0 h-7 w-7 p-0 rounded-none border"
            style={{
              backgroundColor: isPlaying ? 'var(--cb-surface)' : 'transparent',
              borderColor: 'var(--cb-border)',
              color: isPlaying ? '#10b981' : 'var(--cb-secondary)',
            }}
          >
            {isPlaying ? (
              <Pause style={{ width: 11, height: 11 }} />
            ) : (
              <Play style={{ width: 11, height: 11 }} />
            )}
          </Button>

          <div className="flex-1 flex flex-col gap-1.5">
            <Slider
              value={[selectedYear]}
              onValueChange={handleSliderChange}
              min={MIN_YEAR}
              max={MAX_YEAR}
              step={1}
              className={`${sliderBaseClasses} ${sliderHeightClasses} ${sliderTrackClasses} ${sliderRangeClasses} ${sliderThumbClasses}`}
            />
            <div className="flex justify-between items-center" style={{ fontSize: 10, color: 'var(--cb-secondary)' }}>
              <span>{MIN_YEAR}</span>
              <span className="font-medium tabular-nums" style={{ color: 'var(--cb-text)' }}>{selectedYear}</span>
              <span>{MAX_YEAR}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: floating centered bar */}
      <div
        className="lg:hidden fixed bottom-4 sm:bottom-6 z-40 transition-all duration-300 ease-out left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] max-w-lg"
      >
        <div
          className="bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-xl rounded-xl border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] px-2.5 sm:px-3 py-2.5 sm:py-3"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayToggle}
              className={`rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white shrink-0 border border-white/15 h-8 w-8 ${
                isPlaying ? 'bg-emerald-500/25 border-emerald-400/40' : ''
              }`}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="ml-0.5 h-3.5 w-3.5" />
              )}
            </Button>
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="text-emerald-400 w-3 h-3" />
              <span className="text-white/70 font-medium tabular-nums text-[11px]">{selectedYear}</span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Slider
                value={[selectedYear]}
                onValueChange={handleSliderChange}
                min={MIN_YEAR}
                max={MAX_YEAR}
                step={1}
                className={`${sliderBaseClasses} ${sliderHeightClasses} ${sliderTrackClasses} ${sliderRangeClasses} ${sliderThumbClasses}`}
              />
              <div className="flex justify-between text-white/50 text-[10px]">
                <span>{MIN_YEAR}</span>
                <span className="hidden sm:inline text-white/35">Climate Timeline</span>
                <span>{MAX_YEAR}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
