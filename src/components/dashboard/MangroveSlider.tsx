import { useState, useEffect, useRef } from 'react';
import { TreePine } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface MangroveSliderProps {
  value: number;
  onChange: (value: number) => void;
  onChangeEnd: (value: number) => void;
  disabled?: boolean;
}

export const MangroveSlider = ({ value, onChange, onChangeEnd, disabled }: MangroveSliderProps) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number[]) => {
    const val = newValue[0];
    setLocalValue(val);
    onChange(val);

    // Debounce the API call - trigger when slider stops moving
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onChangeEnd(val);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TreePine className="w-4 h-4 text-primary" />
          Mangrove Width
        </label>
        <span className="text-sm font-semibold text-primary tabular-nums">
          {localValue}m
        </span>
      </div>
      
      <Slider
        value={[localValue]}
        onValueChange={handleChange}
        min={0}
        max={500}
        step={10}
        disabled={disabled}
        className="w-full"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0m</span>
        <span>250m</span>
        <span>500m</span>
      </div>
    </div>
  );
};
