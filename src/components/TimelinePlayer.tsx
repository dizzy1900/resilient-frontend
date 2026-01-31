import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onYearChange(selectedYear >= MAX_YEAR ? MIN_YEAR : selectedYear + 1);
      }, INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, selectedYear, onYearChange]);

  const progress = ((selectedYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  return (
    <div
      className={`fixed bottom-6 z-40 ${
        isSplitMode
          ? 'left-1/2 -translate-x-1/2 w-[320px]'
          : 'left-1/2 -translate-x-1/2 w-[90%] max-w-xl'
      }`}
    >
      <div
        className={`bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl ${
          isSplitMode ? 'px-4 py-3' : 'px-6 py-4'
        }`}
      >
        <div className={`flex items-center ${isSplitMode ? 'gap-3' : 'gap-4'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayToggle}
            className={`rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 border border-white/10 transition-all duration-200 ${
              isSplitMode ? 'h-9 w-9' : 'h-11 w-11'
            } ${isPlaying ? 'bg-emerald-500/20 border-emerald-500/30' : ''}`}
          >
            {isPlaying ? (
              <Pause className={isSplitMode ? 'h-4 w-4' : 'h-5 w-5'} />
            ) : (
              <Play className={`ml-0.5 ${isSplitMode ? 'h-4 w-4' : 'h-5 w-5'}`} />
            )}
          </Button>

          <div
            className={`flex items-center gap-2 shrink-0 ${
              isSplitMode ? 'min-w-[70px]' : 'min-w-[90px]'
            }`}
          >
            <Calendar className={`text-emerald-400 ${isSplitMode ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span
              className={`text-white font-bold tabular-nums ${
                isSplitMode ? 'text-lg' : 'text-2xl'
              }`}
            >
              {selectedYear}
            </span>
          </div>

          <div className={`flex-1 flex flex-col ${isSplitMode ? 'gap-1.5' : 'gap-2'}`}>
            <Slider
              value={[selectedYear]}
              onValueChange={(value) => onYearChange(value[0])}
              min={MIN_YEAR}
              max={MAX_YEAR}
              step={1}
              className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-track]]:h-2 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:to-blue-500 [&_[data-radix-slider-thumb]]:border-2 [&_[data-radix-slider-thumb]]:border-white [&_[data-radix-slider-thumb]]:bg-emerald-500 [&_[data-radix-slider-thumb]]:shadow-lg [&_[data-radix-slider-thumb]]:shadow-emerald-500/30"
            />
            <div
              className={`flex justify-between text-white/40 ${
                isSplitMode ? 'text-[10px]' : 'text-xs'
              }`}
            >
              <span>{MIN_YEAR}</span>
              <span className="text-white/30">Climate Projection Timeline</span>
              <span>{MAX_YEAR}</span>
            </div>
          </div>
        </div>

        <div
          className={`bg-white/5 rounded-full overflow-hidden ${isSplitMode ? 'mt-2 h-1' : 'mt-3 h-1.5'}`}
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500/60 to-blue-500/60 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
