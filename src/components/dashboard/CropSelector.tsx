import { Wheat, Candy, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CropSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const crops = [
  { value: "maize", label: "🌽 Maize (Corn)", icon: Wheat },
  { value: "cocoa", label: "🍫 Cocoa", icon: Candy },
];

export const CropSelector = ({ value, onChange }: CropSelectorProps) => {
  const selectedCrop = crops.find((c) => c.value === value);
  const Icon = selectedCrop?.icon || Wheat;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Crop Type</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-12 bg-secondary border-border/50 hover:border-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Icon className="w-4 h-4 text-accent" />
            </div>
            <SelectValue placeholder="Select crop type" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {crops.map((crop) => (
            <SelectItem
              key={crop.value}
              value={crop.value}
              className="cursor-pointer hover:bg-accent/20 focus:bg-accent/20"
            >
              <div className="flex items-center gap-3">
                <crop.icon className="w-4 h-4 text-accent" />
                <span>{crop.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
