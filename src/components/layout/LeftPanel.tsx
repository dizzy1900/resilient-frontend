import { useState, useEffect, useRef } from 'react';
import {
  Wheat,
  Waves,
  Droplets,
  Briefcase,
  HeartPulse,
  Landmark,
  MapPin,
  TreePine,
  Building2,
  Shield,
  Users,
  DollarSign,
  Calendar,
  Sprout,
  Columns2,
  X,
  Loader2,
  Zap,
} from 'lucide-react';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Settings, User, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast as showToast } from '@/hooks/use-toast';
import { FinancialSettingsModal } from '@/components/hud/FinancialSettingsModal';
import { TimelinePlayer } from '@/components/TimelinePlayer';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { SectorFilter, MapOverlay } from '@/components/dashboard/AtlasMarkers';

const MODE_ITEMS: {
  mode: DashboardMode;
  icon: React.ElementType;
  label: string;
  accent: string;
}[] = [
  { mode: 'agriculture', icon: Wheat, label: 'Agriculture', accent: '#10b981' },
  { mode: 'coastal', icon: Waves, label: 'Coastal', accent: '#14b8a6' },
  { mode: 'flood', icon: Droplets, label: 'Flood', accent: '#3b82f6' },
  { mode: 'health', icon: HeartPulse, label: 'Health', accent: '#f43f5e' },
  { mode: 'finance', icon: Landmark, label: 'Finance', accent: '#f59e0b' },
  { mode: 'portfolio', icon: Briefcase, label: 'Portfolio', accent: '#64748b' },
];

const CROPS = [
  { value: 'maize', label: 'Maize (Corn)' },
  { value: 'cocoa', label: 'Cocoa' },
];

interface LeftPanelProps {
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
  onOpenDefensiveWizard?: (type: 'sea_wall' | 'drainage') => void;
  workforceSize: number;
  onWorkforceSizeChange: (value: number) => void;
  averageDailyWage: number;
  onAverageDailyWageChange: (value: number) => void;
  isSplitMode: boolean;
  onToggleSplitMode: () => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  isFinanceSimulating: boolean;
  onFinanceSimulate: () => void;
  sectorFilter: SectorFilter;
  onSectorFilterChange: (value: SectorFilter) => void;
  timeHorizon: string;
  onTimeHorizonChange: (value: string) => void;
  mapOverlay: MapOverlay;
  onMapOverlayChange: (value: MapOverlay) => void;
}

export function LeftPanel({
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
  isSplitMode,
  onToggleSplitMode,
  selectedYear,
  onYearChange,
  isPlaying,
  onPlayToggle,
  isFinanceSimulating,
  onFinanceSimulate,
  sectorFilter,
  onSectorFilterChange,
  timeHorizon,
  onTimeHorizonChange,
  mapOverlay,
  onMapOverlayChange,
}: LeftPanelProps) {
  const [localMangroveWidth, setLocalMangroveWidth] = useState(mangroveWidth);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalMangroveWidth(mangroveWidth);
  }, [mangroveWidth]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMangroveChange = (newValue: number[]) => {
    const val = newValue[0];
    setLocalMangroveWidth(val);
    onMangroveWidthChange(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onMangroveWidthChangeEnd(val);
    }, 500);
  };

  const activeItem = MODE_ITEMS.find((m) => m.mode === mode);
  const hasCoordinates = latitude !== null && longitude !== null;

  return (
    <div className="hidden lg:flex absolute top-0 left-0 h-full z-30 pointer-events-none">
      <div className="flex h-full pointer-events-auto">
        {/* Narrow icon strip */}
        <div
          className="flex flex-col h-full border-r"
          style={{
            width: 40,
            backgroundColor: 'var(--cb-bg)',
            borderColor: 'var(--cb-border)',
          }}
        >
          {/* Logo mark */}
          <div
            className="flex items-center justify-center shrink-0 border-b"
            style={{ height: 48, borderColor: 'var(--cb-border)' }}
          >
            <div
              className="w-5 h-5 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: activeItem?.accent ?? '#10b981' }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>R</span>
            </div>
          </div>

          {/* Mode icon nav */}
          <div className="flex flex-col flex-1 pt-1">
            {MODE_ITEMS.map(({ mode: m, icon: Icon, label, accent }) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                title={label}
                className="cb-icon-btn"
                style={
                  mode === m
                    ? {
                        color: accent,
                        backgroundColor: 'var(--cb-surface)',
                        position: 'relative',
                      }
                    : {}
                }
              >
                {mode === m && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-0.5"
                    style={{ backgroundColor: accent }}
                  />
                )}
                <Icon style={{ width: 15, height: 15 }} />
              </button>
            ))}
          </div>

          {/* Bottom controls */}
          <div
            className="flex flex-col items-center gap-1 pb-2 pt-1 border-t"
            style={{ borderColor: 'var(--cb-border)' }}
          >
            <button
              onClick={onToggleSplitMode}
              title={isSplitMode ? 'Exit Comparison' : 'Compare Scenarios'}
              className="cb-icon-btn"
              style={isSplitMode ? { color: 'var(--cb-text)' } : {}}
            >
              {isSplitMode ? (
                <X style={{ width: 15, height: 15 }} />
              ) : (
                <Columns2 style={{ width: 15, height: 15 }} />
              )}
            </button>
            <CompactUserMenu />
            <CompactSettingsButton />
          </div>
        </div>

        {/* Main content panel */}
        <div
          className="flex flex-col h-full border-r"
          style={{
            width: 320,
            backgroundColor: 'var(--cb-bg)',
            borderColor: 'var(--cb-border)',
          }}
        >
          {/* Header */}
          <div
            className="shrink-0 flex flex-col justify-end px-4 pb-3 border-b"
            style={{ height: 48, borderColor: 'var(--cb-border)' }}
          >
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 300,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--cb-text)',
                }}
              >
                Resilience OS
              </span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'var(--cb-secondary)',
                }}
              >
                {activeItem?.label}
              </span>
            </div>
          </div>

          {/* Location row */}
          <div className="shrink-0 px-4 py-3 cb-divider">
            <div className="flex items-center justify-between mb-1">
              <span className="cb-label">Location</span>
              {hasCoordinates && (
                <MapPin style={{ width: 10, height: 10, color: activeItem?.accent ?? '#10b981' }} />
              )}
            </div>
            {hasCoordinates ? (
              <span className="cb-value font-mono" style={{ fontSize: 11 }}>
                {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--cb-secondary)' }}>
                Click map to select location
              </span>
            )}
          </div>

          {/* Map Controls — always visible */}
          <div className="shrink-0 cb-divider">
            <div className="px-4 pt-3 pb-2 space-y-3">
              <div>
                <div className="cb-label mb-1.5">Sector Filter</div>
                <SegmentedControl
                  options={[
                    { value: 'ALL', label: 'ALL' },
                    { value: 'AGRICULTURE', label: 'AGR' },
                    { value: 'COASTAL', label: 'COASTAL' },
                    { value: 'FLOOD', label: 'FLOOD' },
                  ]}
                  value={sectorFilter}
                  onChange={(v) => onSectorFilterChange(v as SectorFilter)}
                />
              </div>
              <div>
                <div className="cb-label mb-1.5">Time Horizon</div>
                <SegmentedControl
                  options={[
                    { value: '2030', label: '2030' },
                    { value: '2040', label: '2040' },
                    { value: '2050', label: '2050' },
                  ]}
                  value={timeHorizon}
                  onChange={onTimeHorizonChange}
                />
              </div>
              <div>
                <div className="cb-label mb-1.5">Map Overlay</div>
                <SegmentedControl
                  options={[
                    { value: 'NPV', label: 'NPV' },
                    { value: 'RATING', label: 'RATING' },
                    { value: 'WATER', label: 'WATER' },
                  ]}
                  value={mapOverlay}
                  onChange={(v) => onMapOverlayChange(v as MapOverlay)}
                />
              </div>
            </div>
          </div>

          {/* Mode-specific content — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <ModeContent
              mode={mode}
              cropType={cropType}
              onCropChange={onCropChange}
              localMangroveWidth={localMangroveWidth}
              handleMangroveChange={handleMangroveChange}
              canSimulate={canSimulate}
              seaWallEnabled={seaWallEnabled}
              onSeaWallChange={onSeaWallChange}
              drainageEnabled={drainageEnabled}
              onDrainageChange={onDrainageChange}
              onOpenDefensiveWizard={onOpenDefensiveWizard}
              buildingValue={buildingValue}
              onBuildingValueChange={onBuildingValueChange}
              dailyRevenue={dailyRevenue}
              onDailyRevenueChange={onDailyRevenueChange}
              assetLifespan={assetLifespan}
              onAssetLifespanChange={onAssetLifespanChange}
              greenRoofsEnabled={greenRoofsEnabled}
              onGreenRoofsChange={onGreenRoofsChange}
              permeablePavementEnabled={permeablePavementEnabled}
              onPermeablePavementChange={onPermeablePavementChange}
              workforceSize={workforceSize}
              onWorkforceSizeChange={onWorkforceSizeChange}
              averageDailyWage={averageDailyWage}
              onAverageDailyWageChange={onAverageDailyWageChange}
              onOpenInterventionWizard={onOpenInterventionWizard}
              isFinanceSimulating={isFinanceSimulating}
              onFinanceSimulate={onFinanceSimulate}
            />
          </div>

          {/* Timeline footer */}
          <div
            className="shrink-0 border-t"
            style={{ borderColor: 'var(--cb-border)' }}
          >
            <TimelinePlayer
              selectedYear={selectedYear}
              onYearChange={onYearChange}
              isPlaying={isPlaying}
              onPlayToggle={onPlayToggle}
              isSplitMode={isSplitMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModeContentProps {
  mode: DashboardMode;
  cropType: string;
  onCropChange: (v: string) => void;
  localMangroveWidth: number;
  handleMangroveChange: (v: number[]) => void;
  canSimulate: boolean;
  seaWallEnabled: boolean;
  onSeaWallChange: (v: boolean) => void;
  drainageEnabled: boolean;
  onDrainageChange: (v: boolean) => void;
  onOpenDefensiveWizard?: (type: 'sea_wall' | 'drainage') => void;
  buildingValue: number;
  onBuildingValueChange: (v: number) => void;
  dailyRevenue: number;
  onDailyRevenueChange: (v: number) => void;
  assetLifespan: number;
  onAssetLifespanChange: (v: number) => void;
  greenRoofsEnabled: boolean;
  onGreenRoofsChange: (v: boolean) => void;
  permeablePavementEnabled: boolean;
  onPermeablePavementChange: (v: boolean) => void;
  workforceSize: number;
  onWorkforceSizeChange: (v: number) => void;
  averageDailyWage: number;
  onAverageDailyWageChange: (v: number) => void;
  onOpenInterventionWizard?: () => void;
  isFinanceSimulating: boolean;
  onFinanceSimulate: () => void;
}

function SectionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 cb-divider">
      <div className="cb-label mb-2">{label}</div>
      {children}
    </div>
  );
}

function ModeContent({
  mode,
  cropType,
  onCropChange,
  localMangroveWidth,
  handleMangroveChange,
  canSimulate,
  seaWallEnabled,
  onSeaWallChange,
  drainageEnabled,
  onDrainageChange,
  onOpenDefensiveWizard,
  buildingValue,
  onBuildingValueChange,
  dailyRevenue,
  onDailyRevenueChange,
  assetLifespan,
  onAssetLifespanChange,
  greenRoofsEnabled,
  onGreenRoofsChange,
  permeablePavementEnabled,
  onPermeablePavementChange,
  workforceSize,
  onWorkforceSizeChange,
  averageDailyWage,
  onAverageDailyWageChange,
  onOpenInterventionWizard,
  isFinanceSimulating,
  onFinanceSimulate,
}: ModeContentProps) {
  if (mode === 'agriculture') {
    return (
      <div>
        <SectionRow label="Crop Commodity">
          <Select value={cropType} onValueChange={onCropChange}>
            <SelectTrigger
              className="w-full h-8 border-0 bg-transparent px-0 text-xs focus:ring-0 focus:ring-offset-0"
              style={{ color: 'var(--cb-text)', fontSize: 12 }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="border"
              style={{
                backgroundColor: 'var(--cb-bg)',
                borderColor: 'var(--cb-border)',
                color: 'var(--cb-text)',
              }}
            >
              {CROPS.map((c) => (
                <SelectItem
                  key={c.value}
                  value={c.value}
                  style={{ fontSize: 12, color: 'var(--cb-text)' }}
                >
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SectionRow>

        <SectionRow label="Adaptation Project">
          <Button
            onClick={onOpenInterventionWizard}
            variant="ghost"
            className="w-full h-8 text-xs justify-start px-0 gap-2"
            style={{ color: '#10b981' }}
          >
            <Sprout style={{ width: 13, height: 13 }} />
            Define Intervention Wizard
          </Button>
        </SectionRow>
      </div>
    );
  }

  if (mode === 'coastal') {
    return (
      <div>
        <SectionRow label="Mangrove Belt Width">
          <div className="flex items-center justify-between mb-2">
            <span className="cb-value">{localMangroveWidth} m</span>
            <TreePine style={{ width: 12, height: 12, color: '#14b8a6' }} />
          </div>
          <Slider
            value={[localMangroveWidth]}
            onValueChange={handleMangroveChange}
            min={0}
            max={500}
            step={10}
            disabled={!canSimulate}
            className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-teal-500 [&_[data-radix-slider-thumb]]:border-teal-500 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-track]]:h-1"
          />
          <div className="flex justify-between mt-1" style={{ fontSize: 10, color: 'var(--cb-secondary)' }}>
            <span>0 m</span>
            <span>500 m</span>
          </div>
        </SectionRow>

        <SectionRow label="Defensive Infrastructure">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield style={{ width: 11, height: 11, color: '#14b8a6' }} />
                <Label
                  htmlFor="sea-wall"
                  style={{ fontSize: 11, color: 'var(--cb-text)', cursor: 'pointer' }}
                >
                  Sea Wall
                </Label>
              </div>
              <Switch
                id="sea-wall"
                checked={seaWallEnabled}
                onCheckedChange={(checked) => {
                  onSeaWallChange(checked);
                  if (checked && onOpenDefensiveWizard) onOpenDefensiveWizard('sea_wall');
                }}
                disabled={!canSimulate}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets style={{ width: 11, height: 11, color: '#06b6d4' }} />
                <Label
                  htmlFor="coastal-drainage"
                  style={{ fontSize: 11, color: 'var(--cb-text)', cursor: 'pointer' }}
                >
                  Drainage Upgrade
                </Label>
              </div>
              <Switch
                id="coastal-drainage"
                checked={drainageEnabled}
                onCheckedChange={(checked) => {
                  onDrainageChange(checked);
                  if (checked && onOpenDefensiveWizard) onOpenDefensiveWizard('drainage');
                }}
                disabled={!canSimulate}
              />
            </div>
          </div>
        </SectionRow>
      </div>
    );
  }

  if (mode === 'flood') {
    return (
      <div>
        <SectionRow label="Asset at Risk">
          <div className="space-y-3">
            <div>
              <div className="cb-label mb-1.5">Property Value ($)</div>
              <div className="relative">
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{ fontSize: 11, color: 'var(--cb-secondary)' }}
                >
                  $
                </span>
                <Input
                  type="text"
                  value={buildingValue.toLocaleString()}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                    onBuildingValueChange(v);
                  }}
                  disabled={!canSimulate}
                  className="pl-3 h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
                  style={{
                    color: 'var(--cb-text)',
                    borderColor: 'var(--cb-border)',
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="cb-label mb-1.5">Daily Revenue ($)</div>
              <div className="relative">
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{ fontSize: 11, color: 'var(--cb-secondary)' }}
                >
                  $
                </span>
                <Input
                  type="text"
                  value={dailyRevenue.toLocaleString()}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                    onDailyRevenueChange(v);
                  }}
                  disabled={!canSimulate}
                  className="pl-3 h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
                  style={{
                    color: 'var(--cb-text)',
                    borderColor: 'var(--cb-border)',
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar style={{ width: 10, height: 10, color: 'var(--cb-secondary)' }} />
                  <span className="cb-label">Asset Lifespan</span>
                </div>
                <span style={{ fontSize: 11, color: '#3b82f6' }}>{assetLifespan} yrs</span>
              </div>
              <Slider
                value={[assetLifespan]}
                onValueChange={(v) => onAssetLifespanChange(v[0])}
                min={5}
                max={50}
                step={5}
                className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-blue-500 [&_[data-radix-slider-thumb]]:border-blue-500 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-track]]:h-1"
              />
            </div>
          </div>
        </SectionRow>

        <SectionRow label="Sponge City Toolkit">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 style={{ width: 11, height: 11, color: '#10b981' }} />
                <Label
                  htmlFor="green-roofs"
                  style={{ fontSize: 11, color: 'var(--cb-text)', cursor: 'pointer' }}
                >
                  Green Roofs
                </Label>
              </div>
              <Switch
                id="green-roofs"
                checked={greenRoofsEnabled}
                onCheckedChange={onGreenRoofsChange}
                disabled={!canSimulate}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign style={{ width: 11, height: 11, color: '#3b82f6' }} />
                <Label
                  htmlFor="permeable-pavement"
                  style={{ fontSize: 11, color: 'var(--cb-text)', cursor: 'pointer' }}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets style={{ width: 11, height: 11, color: '#06b6d4' }} />
                <Label
                  htmlFor="flood-drainage"
                  style={{ fontSize: 11, color: 'var(--cb-text)', cursor: 'pointer' }}
                >
                  Drainage Upgrade
                </Label>
              </div>
              <Switch
                id="flood-drainage"
                checked={drainageEnabled}
                onCheckedChange={(checked) => {
                  onDrainageChange(checked);
                  if (checked && onOpenDefensiveWizard) onOpenDefensiveWizard('drainage');
                }}
                disabled={!canSimulate}
              />
            </div>
          </div>
        </SectionRow>
      </div>
    );
  }

  if (mode === 'health') {
    return (
      <div>
        <SectionRow label="Workforce Input">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users style={{ width: 10, height: 10, color: '#f43f5e' }} />
                <span className="cb-label">Outdoor Workforce Size</span>
              </div>
              <Input
                type="number"
                value={workforceSize}
                onChange={(e) => onWorkforceSizeChange(parseInt(e.target.value) || 0)}
                disabled={!canSimulate}
                className="h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
                style={{
                  color: 'var(--cb-text)',
                  borderColor: 'var(--cb-border)',
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                }}
              />
            </div>
            <div>
              <div className="cb-label mb-1.5">Average Daily Wage ($)</div>
              <Input
                type="number"
                value={averageDailyWage}
                onChange={(e) => onAverageDailyWageChange(parseFloat(e.target.value) || 0)}
                disabled={!canSimulate}
                className="h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
                style={{
                  color: 'var(--cb-text)',
                  borderColor: 'var(--cb-border)',
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                }}
              />
            </div>
          </div>
        </SectionRow>
      </div>
    );
  }

  if (mode === 'finance') {
    return (
      <div>
        <SectionRow label="Green Bond Structuring">
          <p style={{ fontSize: 11, color: 'var(--cb-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            Run a live simulation to generate a Green Bond Term Sheet for the selected location.
          </p>
          <Button
            variant="ghost"
            onClick={onFinanceSimulate}
            disabled={!canSimulate || isFinanceSimulating}
            className="w-full h-8 text-xs font-medium gap-2"
            style={{
              backgroundColor: 'var(--cb-surface)',
              color: isFinanceSimulating ? 'var(--cb-secondary)' : '#f59e0b',
              border: '1px solid var(--cb-border)',
              borderRadius: 0,
            }}
          >
            {isFinanceSimulating ? (
              <>
                <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Zap style={{ width: 12, height: 12 }} />
                Run Simulation
              </>
            )}
          </Button>
          {!canSimulate && (
            <p className="mt-2 text-center" style={{ fontSize: 10, color: 'var(--cb-secondary)' }}>
              Select a location on the map first
            </p>
          )}
        </SectionRow>
      </div>
    );
  }

  if (mode === 'portfolio') {
    return (
      <div className="px-4 py-3">
        <p style={{ fontSize: 11, color: 'var(--cb-secondary)', lineHeight: 1.5 }}>
          Upload a CSV portfolio to screen climate risk across multiple assets.
        </p>
      </div>
    );
  }

  return null;
}

function CompactUserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    showToast({ title: 'Signed out', description: 'You have been signed out successfully.' });
    navigate('/');
  };

  if (!user) {
    return (
      <button
        onClick={() => navigate('/auth')}
        className="cb-icon-btn"
        title="Sign In"
      >
        <User style={{ width: 14, height: 14 }} />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cb-icon-btn" title={user.email ?? 'User'}>
          <User style={{ width: 14, height: 14 }} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="end"
        className="border"
        style={{
          backgroundColor: 'var(--cb-bg)',
          borderColor: 'var(--cb-border)',
          color: 'var(--cb-text)',
          minWidth: 160,
        }}
      >
        <DropdownMenuItem
          onClick={handleSignOut}
          style={{ fontSize: 12, color: 'var(--cb-text)', cursor: 'pointer' }}
        >
          <LogOut style={{ width: 12, height: 12, marginRight: 8 }} />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CompactSettingsButton() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 40, height: 40 }}
      title="Financial Settings"
    >
      <FinancialSettingsModal />
    </div>
  );
}
