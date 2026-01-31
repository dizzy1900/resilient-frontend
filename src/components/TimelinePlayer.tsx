import { useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface TimelinePlayerProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

const MIN_YEAR = 2026;
const MAX_YEAR = 2050;
const INTERVAL_MS = 800;

export function TimelinePlayer({
  selectedYear,
  onYearChange,
  isPlaying,
  onPlayToggle,
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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg">
      <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 px-6 py-4 shadow-xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayToggle}
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <div className="text-white font-bold text-2xl tabular-nums w-16 text-center shrink-0">
            {selectedYear}
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <Slider
              value={[selectedYear]}
              onValueChange={(value) => onYearChange(value[0])}
              min={MIN_YEAR}
              max={MAX_YEAR}
              step={1}
              className="w-full [&_[data-radix-slider-track]]:bg-white/20 [&_[data-radix-slider-range]]:bg-emerald-500 [&_[data-radix-slider-thumb]]:border-emerald-500 [&_[data-radix-slider-thumb]]:bg-white"
            />
            <div className="flex justify-between text-xs text-white/60">
              <span>{MIN_YEAR}</span>
              <span>{MAX_YEAR}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500/50 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
