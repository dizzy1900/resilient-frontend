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
  const sliderTrackClasses = "[&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-track]]:rounded-full [&_[data-radix-slider-track]]:transition-all [&_[data-radix-slider-track]]:duration-200 hover:[&_[data-radix-slider-track]]:bg-white/12";
  const sliderRangeClasses = "[&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-green-600 [&_[data-radix-slider-range]]:via-emerald-600 [&_[data-radix-slider-range]]:to-teal-600 [&_[data-radix-slider-range]]:transition-all [&_[data-radix-slider-range]]:duration-300";
  const sliderThumbClasses = "[&_[data-radix-slider-thumb]]:border-2 [&_[data-radix-slider-thumb]]:border-white [&_[data-radix-slider-thumb]]:bg-green-600 [&_[data-radix-slider-thumb]]:shadow-lg [&_[data-radix-slider-thumb]]:shadow-green-600/30 [&_[data-radix-slider-thumb]]:transition-all [&_[data-radix-slider-thumb]]:duration-200 hover:[&_[data-radix-slider-thumb]]:scale-105 hover:[&_[data-radix-slider-thumb]]:shadow-xl hover:[&_[data-radix-slider-thumb]]:shadow-green-600/30 focus:[&_[data-radix-slider-thumb]]:ring-2 focus:[&_[data-radix-slider-thumb]]:ring-green-500/50";
  const sliderHeightClasses = '[&_[data-radix-slider-track]]:h-2';

  return (
    <div
      className="fixed bottom-6 lg:bottom-8 z-40 transition-all duration-300 ease-out left-1/2 -translate-x-1/2 w-[95%] lg:w-[85%] max-w-lg"
    >
      <div
        className="bg-gradient-to-br from-black/40 to-black/25 backdrop-blur-2xl rounded-2xl lg:rounded-3xl border border-white/10 shadow-2xl transition-all duration-300 px-5 lg:px-7 py-4 lg:py-5"
      >
        <div className="flex items-center gap-3 lg:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayToggle}
            className={`rounded-lg lg:rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white shrink-0 border border-white/10 transition-all duration-300 h-10 w-10 lg:h-11 lg:w-11 ${
              isPlaying
                ? 'bg-green-600/20 border-green-500/30 hover:bg-green-600/25'
                : 'hover:border-white/20'
            }`}
          >
            <div className="relative">
              {isPlaying ? (
                <Pause
                  className="h-3.5 w-3.5 lg:h-4 lg:w-4 transition-opacity duration-200"
                />
              ) : (
                <Play
                  className="ml-0.5 h-3.5 w-3.5 lg:h-4 lg:w-4 transition-opacity duration-200"
                />
              )}
            </div>
          </Button>

          <div
            className="flex items-center gap-1 shrink-0"
          >
            <Calendar
              className="text-green-500 shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] w-4 h-4"
            />
            <span
              className="text-white/85 font-semibold tabular-nums tracking-wide transition-all duration-200 text-sm lg:text-base"
            >
              {selectedYear}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-3">
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
              <span className="transition-opacity duration-200 hover:opacity-80">{MIN_YEAR}</span>
              <span className="text-white/40 transition-opacity duration-200 hover:opacity-80 hidden sm:inline">
                Climate Projection Timeline
              </span>
              <span className="transition-opacity duration-200 hover:opacity-80">{MAX_YEAR}</span>
            </div>
          </div>
        </div>

        <div
          className="bg-white/8 rounded-full overflow-hidden backdrop-blur-sm mt-5 h-0.5"
        >
          <div
            className="h-full bg-gradient-to-r from-green-600/80 via-emerald-600/80 to-teal-600/80 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
