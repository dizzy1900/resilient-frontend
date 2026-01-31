import { useEffect, useRef, useCallback, useMemo } from 'react';
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

  const progress = useMemo(
    () => ((selectedYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100,
    [selectedYear]
  );

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
    <div
      className="fixed bottom-6 z-40 transition-all duration-300 ease-out left-1/2 -translate-x-1/2 w-[90%] max-w-xl"
    >
      <div
        className="bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-xl rounded-2xl border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5)] px-6 py-3.5"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayToggle}
            className={`rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white shrink-0 border border-white/15 transition-all duration-300 hover:shadow-lg h-10 w-10 ${
              isPlaying
                ? 'bg-emerald-500/25 border-emerald-400/40 hover:bg-emerald-500/30 shadow-emerald-500/20'
                : 'hover:border-white/25'
            }`}
          >
            <div className="relative">
              {isPlaying ? (
                <Pause
                  className="h-4.5 w-4.5 transition-all duration-200 animate-in fade-in-0 zoom-in-50"
                />
              ) : (
                <Play
                  className="ml-0.5 h-4.5 w-4.5 transition-all duration-200 animate-in fade-in-0 zoom-in-50"
                />
              )}
            </div>
          </Button>

          <div
            className="flex items-center gap-1.5 shrink-0"
          >
            <Calendar
              className="text-emerald-400 shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] w-3.5 h-3.5"
            />
            <span
              className="text-white/70 font-medium tabular-nums tracking-tight transition-all duration-200 text-sm"
              key={selectedYear}
              style={{
                animation: 'fadeInScale 0.3s ease-out',
              }}
            >
              {selectedYear}
            </span>
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
            <div
              className="flex justify-between items-center text-white/50 font-medium transition-colors duration-200 text-xs"
            >
              <span className="transition-colors duration-200 hover:text-white/70">{MIN_YEAR}</span>
              <span className="text-white/35 transition-colors duration-200 hover:text-white/50">
                Climate Projection Timeline
              </span>
              <span className="transition-colors duration-200 hover:text-white/70">{MAX_YEAR}</span>
            </div>
          </div>
        </div>

        <div
          className="bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 mt-3 h-1"
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500/70 via-teal-500/70 to-cyan-500/70 transition-all duration-500 ease-out rounded-full shadow-[0_0_12px_rgba(52,211,153,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
