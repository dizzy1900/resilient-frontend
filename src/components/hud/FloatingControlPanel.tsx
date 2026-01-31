import { Activity, MapPin, Wheat, Coffee, TreePine, Building2, Droplets } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { useState, useEffect, useRef } from 'react';

interface FloatingControlPanelProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  latitude: number | null;
  longitude: number | null;
  cropType: string;
  onCropChange: (value: string) => void;
  mangroveWidth: number;
  onMangroveWidthChange: (value: number) => void;
  onMangroveWidthChangeEnd: (value: number) => void;
  propertyValue: number;
  onPropertyValueChange: (value: number) => void;
  buildingValue: number;
  onBuildingValueChange: (value: number) => void;
  greenRoofsEnabled: boolean;
  onGreenRoofsChange: (enabled: boolean) => void;
  permeablePavementEnabled: boolean;
  onPermeablePavementChange: (enabled: boolean) => void;
  canSimulate: boolean;
}

const crops = [
  { value: 'maize', label: 'Maize', icon: Wheat },
  { value: 'coffee', label: 'Coffee', icon: Coffee },
];

export const FloatingControlPanel = ({
  mode,
  onModeChange,
  latitude,
  longitude,
  cropType,
  onCropChange,
  mangroveWidth,
  onMangroveWidthChange,
  onMangroveWidthChangeEnd,
  propertyValue,
  onPropertyValueChange,
  buildingValue,
  onBuildingValueChange,
  greenRoofsEnabled,
  onGreenRoofsChange,
  permeablePavementEnabled,
  onPermeablePavementChange,
  canSimulate,
}: FloatingControlPanelProps) => {
  const [localMangroveWidth, setLocalMangroveWidth] = useState(mangroveWidth);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalMangroveWidth(mangroveWidth);
  }, [mangroveWidth]);

  const handleMangroveChange = (newValue: number[]) => {
    const val = newValue[0];
    setLocalMangroveWidth(val);
    onMangroveWidthChange(val);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onMangroveWidthChangeEnd(val);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasCoordinates = latitude !== null && longitude !== null;
  const selectedCrop = crops.find((c) => c.value === cropType);
  const CropIcon = selectedCrop?.icon || Wheat;

  return (
    <GlassCard className="w-80 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 blur-lg opacity-40" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-blue-400">ADAPTMetric</span>
          <span className="text-xs font-medium text-white/50 tracking-wide uppercase">
            Resilience Engine
          </span>
        </div>
      </div>

      <Tabs
        value={mode}
        onValueChange={(v) => onModeChange(v as DashboardMode)}
        className="w-full mb-6"
      >
        <TabsList className="w-full grid grid-cols-3 h-11 bg-white/5 border border-white/10 rounded-xl p-1">
          <TabsTrigger
            value="agriculture"
            className="rounded-lg text-xs font-medium data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/30 text-white/60 transition-all"
          >
            Agriculture
          </TabsTrigger>
          <TabsTrigger
            value="coastal"
            className="rounded-lg text-xs font-medium data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400 data-[state=active]:border data-[state=active]:border-teal-500/30 text-white/60 transition-all"
          >
            Coastal
          </TabsTrigger>
          <TabsTrigger
            value="flood"
            className="rounded-lg text-xs font-medium data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/30 text-white/60 transition-all"
          >
            Flood Risk
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 mb-6 px-1">
        <MapPin className={`w-4 h-4 ${hasCoordinates ? 'text-emerald-400' : 'text-white/40'}`} />
        {hasCoordinates ? (
          <div className="flex items-center gap-2 font-mono text-sm text-white/70">
            <span>{latitude?.toFixed(4)}</span>
            <span className="text-white/30">|</span>
            <span>{longitude?.toFixed(4)}</span>
          </div>
        ) : (
          <span className="text-sm text-white/40">Click map to select location</span>
        )}
      </div>

      <div className="space-y-5">
        {mode === 'agriculture' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/70">Crop Type</label>
            <Select value={cropType} onValueChange={onCropChange}>
              <SelectTrigger className="w-full h-12 bg-white/5 border-white/10 hover:border-white/20 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CropIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <SelectValue placeholder="Select crop type" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/10">
                {crops.map((crop) => (
                  <SelectItem
                    key={crop.value}
                    value={crop.value}
                    className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <crop.icon className="w-4 h-4 text-emerald-400" />
                      <span>{crop.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === 'coastal' && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-teal-400" />
                  Mangrove Width
                </label>
                <span className="text-sm font-semibold text-teal-400 tabular-nums">
                  {localMangroveWidth}m
                </span>
              </div>
              <Slider
                value={[localMangroveWidth]}
                onValueChange={handleMangroveChange}
                min={0}
                max={500}
                step={10}
                disabled={!canSimulate}
                className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-teal-500 [&_[data-radix-slider-thumb]]:border-teal-500 [&_[data-radix-slider-thumb]]:bg-white"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>0m</span>
                <span>250m</span>
                <span>500m</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/70">Property Value ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  $
                </span>
                <Input
                  type="text"
                  value={propertyValue.toLocaleString()}
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                    onPropertyValueChange(numValue);
                  }}
                  disabled={!canSimulate}
                  className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                  placeholder="Enter property value"
                />
              </div>
            </div>
          </>
        )}

        {mode === 'flood' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Sponge City Toolkit</span>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-white/50">Building Value ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  $
                </span>
                <Input
                  type="text"
                  value={buildingValue.toLocaleString()}
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                    onBuildingValueChange(numValue);
                  }}
                  disabled={!canSimulate}
                  className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                  placeholder="Enter building value"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Label htmlFor="green-roofs" className="text-sm text-white/80 cursor-pointer">
                    Install Green Roofs
                  </Label>
                </div>
                <Switch
                  id="green-roofs"
                  checked={greenRoofsEnabled}
                  onCheckedChange={onGreenRoofsChange}
                  disabled={!canSimulate}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <Label
                    htmlFor="permeable-pavement"
                    className="text-sm text-white/80 cursor-pointer"
                  >
                    Permeable Pavement
                  </Label>
                </div>
                <Switch
                  id="permeable-pavement"
                  checked={permeablePavementEnabled}
                  onCheckedChange={onPermeablePavementChange}
                  disabled={!canSimulate}
                />
              </div>
            </div>

            <p className="text-xs text-white/40">
              Toggle interventions to simulate flood protection benefits
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
