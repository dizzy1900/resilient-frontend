import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyValueInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const PropertyValueInput = ({ value, onChange, disabled }: PropertyValueInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
    onChange(numValue);
  };

  const formatDisplay = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}K`;
    }
    return val.toString();
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Property Value ($)
      </Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={value.toLocaleString()}
          onChange={handleChange}
          disabled={disabled}
          className="pl-9 bg-secondary/50 border-secondary text-foreground"
          placeholder="Enter property value"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Total value of coastal assets to protect
      </p>
    </div>
  );
};
