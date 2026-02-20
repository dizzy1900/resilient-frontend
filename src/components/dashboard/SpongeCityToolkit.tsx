import { Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SpongeCityToolkitProps {
  buildingValue: number;
  onBuildingValueChange: (value: number) => void;
  greenRoofsEnabled: boolean;
  onGreenRoofsChange: (enabled: boolean) => void;
  permeablePavementEnabled: boolean;
  onPermeablePavementChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export const SpongeCityToolkit = ({
  buildingValue,
  onBuildingValueChange,
  greenRoofsEnabled,
  onGreenRoofsChange,
  permeablePavementEnabled,
  onPermeablePavementChange,
  disabled,
}: SpongeCityToolkitProps) => {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
    onBuildingValueChange(numValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Building2 className="w-4 h-4 text-accent" />
        <span>Sponge City Toolkit</span>
      </div>
      
      {/* Building Value Input */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Building Value ($)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            type="text"
            value={buildingValue.toLocaleString()}
            onChange={handleValueChange}
            disabled={disabled}
            className="pl-7 bg-secondary/50 border-secondary text-foreground"
            placeholder="Enter building value"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <Label htmlFor="green-roofs" className="text-sm text-foreground cursor-pointer">
              Install Green Roofs
            </Label>
          </div>
          <Switch
            id="green-roofs"
            checked={greenRoofsEnabled}
            onCheckedChange={onGreenRoofsChange}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <Label htmlFor="permeable-pavement" className="text-sm text-foreground cursor-pointer">
              Permeable Pavement
            </Label>
          </div>
          <Switch
            id="permeable-pavement"
            checked={permeablePavementEnabled}
            onCheckedChange={onPermeablePavementChange}
            disabled={disabled}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Toggle interventions to simulate flood protection benefits
      </p>
    </div>
  );
};
