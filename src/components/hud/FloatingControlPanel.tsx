import {
  Activity,
  MapPin,
  Wheat,
  Bean,
  TreePine,
  Building2,
  Droplets,
  Briefcase,
  DollarSign,
  Sprout,
  Shield,
  ArrowUpFromLine,
  Calendar,
  HeartPulse,
  Users,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardMode } from "@/components/dashboard/ModeSelector";
import { useState, useEffect, useRef } from "react";
import { useFinancialSettings } from "@/contexts/FinancialContext";

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
  assetLifespan: number;
  onAssetLifespanChange: (value: number) => void;
  dailyRevenue: number;
  onDailyRevenueChange: (value: number) => void;
  seaWallEnabled: boolean;
  onSeaWallChange: (enabled: boolean) => void;
  drainageEnabled: boolean;
  onDrainageChange: (enabled: boolean) => void;
  onOpenDefensiveWizard?: (type: "sea_wall" | "drainage") => void;
  // Health mode props
  workforceSize: number;
  onWorkforceSizeChange: (value: number) => void;
  averageDailyWage: number;
  onAverageDailyWageChange: (value: number) => void;
}

const crops = [
  { value: "maize", label: "Maize (Corn)", icon: Wheat },
  { value: "cocoa", label: "Cocoa", icon: Bean },
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
  assetLifespan,
  onAssetLifespanChange,
  dailyRevenue,
  onDailyRevenueChange,
  seaWallEnabled,
  onSeaWallChange,
  drainageEnabled,
  onDrainageChange,
  onOpenDefensiveWizard,
  workforceSize,
  onWorkforceSizeChange,
  averageDailyWage,
  onAverageDailyWageChange,
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
    <GlassCard className={`w-full lg:w-80 p-2.5 sm:p-3 lg:p-4 flex flex-col ${mode === 'flood' ? 'lg:max-h-[calc(100vh-520px)]' : 'lg:max-h-[calc(100vh-360px)]'}`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="relative">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 blur-lg opacity-40" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-bold tracking-tight text-blue-400">Resilient</span>
          <span className="text-[10px] sm:text-xs font-medium text-white/50 tracking-wide uppercase">
            Resilience Engine
          </span>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => onModeChange(v as DashboardMode)} className="w-full mb-3 sm:mb-4">
        <TabsList className="w-full grid grid-cols-6 h-9 sm:h-10 lg:h-11 bg-white/5 border border-white/10 rounded-xl p-0.5 sm:p-1">
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
            value="health"
            className="rounded-lg text-[9px] lg:text-[10px] font-medium data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 data-[state=active]:border data-[state=active]:border-rose-500/30 text-white/60 transition-all px-1"
          >
            Health
          </TabsTrigger>
          <TabsTrigger
            value="finance"
            className="rounded-lg text-[9px] lg:text-[10px] font-medium data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:border data-[state=active]:border-amber-500/30 text-white/60 transition-all px-1"
          >
            Finance
          </TabsTrigger>
          <TabsTrigger
            value="portfolio"
            className="rounded-lg text-[9px] lg:text-[10px] font-medium data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border data-[state=active]:border-purple-500/30 text-white/60 transition-all px-1"
          >
            Portfolio
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode !== "portfolio" && (
        <div className="flex items-center gap-2 mb-3 sm:mb-4 px-1">
          <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hasCoordinates ? "text-emerald-400" : "text-white/40"}`} />
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
        {mode === "agriculture" && (
          <div className="space-y-3">
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
                    <span>{crop.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={onOpenInterventionWizard}
              className="w-full h-10 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-600 hover:to-teal-600 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all"
            >
              <Sprout className="w-4 h-4 mr-2" />
              Define Adaptation Project
            </Button>
          </div>
        )}

        {mode === "coastal" && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-teal-400" />
                  Mangrove Width
                </label>
                <span className="text-sm font-semibold text-teal-400 tabular-nums">{localMangroveWidth}m</span>
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

            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Defensive Infrastructure</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <Label htmlFor="sea-wall" className="text-xs text-white/80 cursor-pointer">
                    Sea Wall
                  </Label>
                </div>
                <Switch
                  id="sea-wall"
                  checked={seaWallEnabled}
                  onCheckedChange={(checked) => {
                    onSeaWallChange(checked);
                    if (checked && onOpenDefensiveWizard) onOpenDefensiveWizard("sea_wall");
                  }}
                  disabled={!canSimulate}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <Label htmlFor="coastal-drainage" className="text-xs text-white/80 cursor-pointer">
                    Drainage Upgrade
                  </Label>
                </div>
                <Switch
                  id="coastal-drainage"
                  checked={drainageEnabled}
                  onCheckedChange={(checked) => {
                    onDrainageChange(checked);
                    if (checked && onOpenDefensiveWizard) onOpenDefensiveWizard("drainage");
                  }}
                  disabled={!canSimulate}
                />
              </div>
            </div>
          </>
        )}

        {mode === "flood" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span>Asset at Risk</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/50">Property Value ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <Input
                  type="text"
                  value={buildingValue.toLocaleString()}
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                    onBuildingValueChange(numValue);
                  }}
                  disabled={!canSimulate}
                  className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                  placeholder="5,000,000"
                />
              </div>
            </div>

            <Label className="text-xs text-white/50">Daily Revenue ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <Input
                type="text"
                value={dailyRevenue.toLocaleString()}
                onChange={(e) => {
                  const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                  onDailyRevenueChange(numValue);
                }}
                disabled={!canSimulate}
                className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                placeholder="20,000"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-white/50 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-white/40" />
                Asset Lifespan
              </Label>
              <span className="text-xs font-semibold text-blue-400 tabular-nums">{assetLifespan} yrs</span>
            </div>
            <Slider
              value={[assetLifespan]}
              onValueChange={(v) => onAssetLifespanChange(v[0])}
              min={5}
              max={50}
              step={5}
              className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-blue-500 [&_[data-radix-slider-thumb]]:border-blue-500 [&_[data-radix-slider-thumb]]:bg-white"
            />

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
                  <Label htmlFor="permeable-pavement" className="text-xs text-white/80 cursor-pointer">
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

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <Label htmlFor="drainage-upgrade" className="text-xs text-white/80 cursor-pointer">
                    Drainage Upgrade
                  </Label>
                </div>
                <Switch
                  id="drainage-upgrade"
                  checked={drainageEnabled}
                  onCheckedChange={(checked) => {
                    onDrainageChange(checked);
                    if (checked && onOpenDefensiveWizard) onOpenDefensiveWizard("drainage");
                  }}
                  disabled={!canSimulate}
                />
              </div>
            </div>

            <p className="text-[10px] text-white/40 leading-tight">
              Toggle interventions to simulate flood protection benefits
            </p>
          </div>
        )}

        {mode === "health" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <Users className="w-4 h-4 text-rose-400" />
              <span>Workforce Input</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/50">Outdoor Workforce Size</Label>
              <Input
                type="number"
                value={workforceSize}
                onChange={(e) => onWorkforceSizeChange(parseInt(e.target.value) || 0)}
                disabled={!canSimulate}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/50">Average Daily Wage ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <Input
                  type="number"
                  value={averageDailyWage}
                  onChange={(e) => onAverageDailyWageChange(parseFloat(e.target.value) || 0)}
                  disabled={!canSimulate}
                  className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                  placeholder="15"
                />
              </div>
            </div>

            <p className="text-[10px] text-white/40 leading-tight">
              Enter workforce data to estimate heat stress productivity losses
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
