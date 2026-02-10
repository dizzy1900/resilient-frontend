import { Activity, MapPin, Wheat, Coffee, TreePine, Building2, Droplets, Briefcase, DollarSign, Sprout } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { useState, useEffect, useRef } from 'react';
import { useFinancialSettings } from '@/contexts/FinancialContext';

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
  onOpenInterventionWizard?: () => void;
}

const crops = [
  { value: 'maize', label: '🌽 Maize (Corn)', icon: Wheat },
  { value: 'cocoa', label: '🍫 Cocoa (Tree Crop)', icon: Coffee },
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
  onOpenInterventionWizard,
}: FloatingControlPanelProps) => {
  const [localMangroveWidth, setLocalMangroveWidth] = useState(mangroveWidth);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { settings, updateSettings } = useFinancialSettings();

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
    <GlassCard className="w-full lg:w-80 p-2.5 sm:p-3 lg:p-4 lg:max-h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="relative">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 blur-lg opacity-40" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-bold tracking-tight text-blue-400">ADAPTMetric</span>
          <span className="text-[10px] sm:text-xs font-medium text-white/50 tracking-wide uppercase">
            Resilience Engine
          </span>
        </div>
      </div>

      <Tabs
        value={mode}
        onValueChange={(v) => onModeChange(v as DashboardMode)}
        className="w-full mb-3 sm:mb-4"
      >
        <TabsList className="w-full grid grid-cols-4 h-9 sm:h-10 lg:h-11 bg-white/5 border border-white/10 rounded-xl p-0.5 sm:p-1">
          <TabsTrigger
            value="agriculture"
            className="rounded-lg text-[9px] lg:text-[10px] font-medium data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/30 text-white/60 transition-all px-1"
          >
            Agri
          </TabsTrigger>
          <TabsTrigger
            value="coastal"
            className="rounded-lg text-[9px] lg:text-[10px] font-medium data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400 data-[state=active]:border data-[state=active]:border-teal-500/30 text-white/60 transition-all px-1"
          >
            Coastal
          </TabsTrigger>
          <TabsTrigger
            value="flood"
            className="rounded-lg text-[9px] lg:text-[10px] font-medium data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/30 text-white/60 transition-all px-1"
          >
            Flood
          </TabsTrigger>
          <TabsTrigger
            value="portfolio"
            className="rounded-lg text-[9px] lg:text-[10px] font-medium data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border data-[state=active]:border-purple-500/30 text-white/60 transition-all px-1"
          >
            Portfolio
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode !== 'portfolio' && (
        <div className="flex items-center gap-2 mb-3 sm:mb-4 px-1">
          <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hasCoordinates ? 'text-emerald-400' : 'text-white/40'}`} />
          {hasCoordinates ? (
            <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs sm:text-sm text-white/70">
              <span>{latitude?.toFixed(4)}</span>
              <span className="text-white/30">|</span>
              <span>{longitude?.toFixed(4)}</span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-white/40">Click map to select location</span>
          )}
        </div>
      )}

      <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {mode === 'agriculture' && (
          <div className="space-y-3">
            <Button
              onClick={onOpenInterventionWizard}
              className="w-full h-10 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-600 hover:to-teal-600 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all"
            >
              <Sprout className="w-4 h-4 mr-2" />
              🌱 Define Adaptation Project
            </Button>

            <label className="text-sm font-medium text-white/70">Select Crop Commodity</label>
            <Select value={cropType} onValueChange={onCropChange}>
              <SelectTrigger className="w-full h-12 bg-white/5 border-white/10 hover:border-white/20 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CropIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <SelectValue placeholder="Select crop type" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 z-50">
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
              <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                <DollarSign className="w-4 h-4 text-teal-400" />
                <span>Asset Valuation</span>
              </div>
              <Label className="text-xs text-white/50">Property Value ($)</Label>
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

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <Label htmlFor="biz-interrupt-coastal" className="text-xs text-white/80 cursor-pointer">
                    Include Business Interruption?
                  </Label>
                </div>
                <Switch
                  id="biz-interrupt-coastal"
                  checked={settings.includeBusinessInterruption}
                  onCheckedChange={(checked) => updateSettings({ includeBusinessInterruption: checked })}
                />
              </div>

              {settings.includeBusinessInterruption && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/50">Daily Revenue ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                    <Input
                      type="text"
                      value={settings.dailyRevenue.toLocaleString()}
                      onChange={(e) => {
                        const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                        updateSettings({ dailyRevenue: numValue });
                      }}
                      className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                      placeholder="Enter daily revenue"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'flood' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span>Asset Valuation</span>
            </div>

            <div className="space-y-2">
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

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <Label htmlFor="biz-interrupt-flood" className="text-xs text-white/80 cursor-pointer">
                  Include Business Interruption?
                </Label>
              </div>
              <Switch
                id="biz-interrupt-flood"
                checked={settings.includeBusinessInterruption}
                onCheckedChange={(checked) => updateSettings({ includeBusinessInterruption: checked })}
              />
            </div>

            {settings.includeBusinessInterruption && (
              <div className="space-y-1.5">
                <Label className="text-xs text-white/50">Daily Revenue ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                  <Input
                    type="text"
                    value={settings.dailyRevenue.toLocaleString()}
                    onChange={(e) => {
                      const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                      updateSettings({ dailyRevenue: numValue });
                    }}
                    className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                    placeholder="Enter daily revenue"
                  />
                </div>
              </div>
            )}

            <div className="h-px bg-white/10 my-1" />

            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Sponge City Toolkit</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Label htmlFor="green-roofs" className="text-xs text-white/80 cursor-pointer">
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

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <Label
                    htmlFor="permeable-pavement"
                    className="text-xs text-white/80 cursor-pointer"
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

            <p className="text-[10px] text-white/40 leading-tight">
              Toggle interventions to simulate flood protection benefits
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
