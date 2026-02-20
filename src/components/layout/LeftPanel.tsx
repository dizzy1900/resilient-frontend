import { useState, useEffect, useRef, useCallback } from "react";
import {
  Wheat,
  Waves,
  Droplets,
  Briefcase,
  HeartPulse,
  Landmark,
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
  CloudRain,
  Info,
  ToggleLeft,
  ToggleRight,
  Thermometer,
  Upload,
} from "lucide-react";
import { DashboardMode } from "@/components/dashboard/ModeSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FinancialSettingsModal } from "@/components/hud/FinancialSettingsModal";
import { TimelinePlayer } from "@/components/TimelinePlayer";
import { cn } from "@/lib/utils";
import { LocationSearch } from "@/components/dashboard/LocationSearch";

const MODE_ITEMS: {
  mode: DashboardMode;
  label: string;
  accent: string;
}[] = [
  { mode: "agriculture", label: "Agri", accent: "#10b981" },
  { mode: "coastal", label: "Coastal", accent: "#14b8a6" },
  { mode: "flood", label: "Flood", accent: "#3b82f6" },
  { mode: "health", label: "Health", accent: "#f43f5e" },
  { mode: "finance", label: "Finance", accent: "#f59e0b" },
  { mode: "portfolio", label: "Portfolio", accent: "#64748b" },
];

const CROPS = [
  { value: "maize", label: "Maize (Corn)" },
  { value: "cocoa", label: "Cocoa" },
  { value: "coffee", label: "Coffee (Arabica)" },
];

const CLIMATE_ANCHORS = [
  { year: 2026, temp: 1.4 },
  { year: 2030, temp: 1.5 },
  { year: 2050, temp: 2.1 },
];

const RAIN_ANCHORS = [
  { year: 2026, intensity: 9 },
  { year: 2030, intensity: 10 },
  { year: 2050, intensity: 17 },
];

const SLR_ANCHORS = [
  { year: 2026, slr: 0.1 },
  { year: 2030, slr: 0.13 },
  { year: 2050, slr: 0.27 },
];

const STORM_SURGE_HEIGHT = 2.5;
const BASELINE_RAINFALL_MM = 700;

function calculateTempFromYear(year: number): number {
  for (let i = 0; i < CLIMATE_ANCHORS.length - 1; i++) {
    const cur = CLIMATE_ANCHORS[i];
    const nxt = CLIMATE_ANCHORS[i + 1];
    if (year >= cur.year && year <= nxt.year) {
      const t = (year - cur.year) / (nxt.year - cur.year);
      return cur.temp + t * (nxt.temp - cur.temp);
    }
  }
  return CLIMATE_ANCHORS[CLIMATE_ANCHORS.length - 1].temp;
}

function calculateRainFromYear(year: number): number {
  if (year <= RAIN_ANCHORS[0].year) return RAIN_ANCHORS[0].intensity;
  for (let i = 0; i < RAIN_ANCHORS.length - 1; i++) {
    const cur = RAIN_ANCHORS[i];
    const nxt = RAIN_ANCHORS[i + 1];
    if (year >= cur.year && year <= nxt.year) {
      const t = (year - cur.year) / (nxt.year - cur.year);
      return Math.round(cur.intensity + t * (nxt.intensity - cur.intensity));
    }
  }
  const last = RAIN_ANCHORS[RAIN_ANCHORS.length - 1];
  const prev = RAIN_ANCHORS[RAIN_ANCHORS.length - 2];
  const rate = (last.intensity - prev.intensity) / (last.year - prev.year);
  return Math.round(last.intensity + rate * (year - last.year));
}

function calculateSLRFromYear(year: number): number {
  if (year <= SLR_ANCHORS[0].year) {
    const t = (year - 2000) / (SLR_ANCHORS[0].year - 2000);
    return t * SLR_ANCHORS[0].slr;
  }
  for (let i = 0; i < SLR_ANCHORS.length - 1; i++) {
    const cur = SLR_ANCHORS[i];
    const nxt = SLR_ANCHORS[i + 1];
    if (year >= cur.year && year <= nxt.year) {
      const t = (year - cur.year) / (nxt.year - cur.year);
      return cur.slr + t * (nxt.slr - cur.slr);
    }
  }
  const last = SLR_ANCHORS[SLR_ANCHORS.length - 1];
  const prev = SLR_ANCHORS[SLR_ANCHORS.length - 2];
  const rate = (last.slr - prev.slr) / (last.year - prev.year);
  return last.slr + rate * (year - last.year);
}

export interface LeftPanelProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  latitude: number | null;
  longitude: number | null;
  hasPolygon?: boolean;
  locationName: string | null;
  onLocationSearch: (lat: number, lng: number) => void;
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
  atlasOverlay: "default" | "credit_rating" | "financial_risk";
  onAtlasOverlayChange: (v: "default" | "credit_rating" | "financial_risk") => void;
  // Agriculture simulation
  globalTempTarget: number;
  onGlobalTempTargetChange: (v: number) => void;
  rainChange: number;
  onRainChangeChange: (v: number) => void;
  onAgricultureSimulate: () => void;
  isAgricultureSimulating: boolean;
  yieldPotential: number | null;
  // Flood simulation
  totalRainIntensity: number;
  onTotalRainIntensityChange: (v: number) => void;
  floodSelectedYear: number;
  onFloodSelectedYearChange: (v: number) => void;
  isFloodUserOverride: boolean;
  onFloodUserOverrideChange: (v: boolean) => void;
  onFloodSimulate: () => void;
  isFloodSimulating: boolean;
  // Coastal simulation
  totalSLR: number;
  onTotalSLRChange: (v: number) => void;
  includeStormSurge: boolean;
  onIncludeStormSurgeChange: (v: boolean) => void;
  coastalSelectedYear: number;
  onCoastalSelectedYearChange: (v: number) => void;
  onCoastalSimulate: () => void;
  isCoastalSimulating: boolean;
  // Health simulation
  healthTempTarget: number;
  onHealthTempTargetChange: (v: number) => void;
  healthSelectedYear: number;
  onHealthSelectedYearChange: (v: number) => void;
  onHealthSimulate: () => void;
  isHealthSimulating: boolean;
  onPortfolioResultsChange?: (data: import("@/types/portfolio").PortfolioAnalysisResult | null) => void;
}

export function LeftPanel({
  mode,
  onModeChange,
  latitude,
  longitude,
  hasPolygon = false,
  locationName,
  onLocationSearch,
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
  atlasOverlay,
  onAtlasOverlayChange,
  globalTempTarget,
  onGlobalTempTargetChange,
  rainChange,
  onRainChangeChange,
  onAgricultureSimulate,
  isAgricultureSimulating,
  yieldPotential,
  totalRainIntensity,
  onTotalRainIntensityChange,
  floodSelectedYear,
  onFloodSelectedYearChange,
  isFloodUserOverride,
  onFloodUserOverrideChange,
  onFloodSimulate,
  isFloodSimulating,
  totalSLR,
  onTotalSLRChange,
  includeStormSurge,
  onIncludeStormSurgeChange,
  coastalSelectedYear,
  onCoastalSelectedYearChange,
  onCoastalSimulate,
  isCoastalSimulating,
  healthTempTarget,
  onHealthTempTargetChange,
  healthSelectedYear,
  onHealthSelectedYearChange,
  onHealthSimulate,
  isHealthSimulating,
  onPortfolioResultsChange,
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

  return (
    <div className="hidden md:flex absolute top-0 left-0 h-full z-30 pointer-events-none">
      <div
        className="flex flex-col h-full pointer-events-auto border-r"
        style={{
          width: 360,
          backgroundColor: "var(--cb-bg)",
          borderColor: "var(--cb-border)",
        }}
      >
        {/* Header row: branding + utilities */}
        <div
          className="shrink-0 flex items-center justify-between px-4 border-b"
          style={{ height: 48, borderColor: "var(--cb-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-sm flex items-center justify-center shrink-0"
              style={{ backgroundColor: activeItem?.accent ?? "#10b981" }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>R</span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 300,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cb-text)",
              }}
            >
              Resilient
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={onToggleSplitMode}
              title={isSplitMode ? "Exit Comparison" : "Compare Scenarios"}
              className="cb-icon-btn"
              style={isSplitMode ? { color: "var(--cb-text)" } : {}}
            >
              {isSplitMode ? <X style={{ width: 14, height: 14 }} /> : <Columns2 style={{ width: 14, height: 14 }} />}
            </button>
            <CompactUserMenu />
            <CompactSettingsButton />
          </div>
        </div>

        {/* Sector segmented control */}
        <div className="shrink-0 flex border-b" style={{ borderColor: "var(--cb-border)" }}>
          {MODE_ITEMS.map(({ mode: m, label, accent }) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              style={{
                flex: 1,
                height: 32,
                fontSize: 9,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                fontFamily: "monospace",
                borderRight: "1px solid var(--cb-border)",
                backgroundColor: mode === m ? "var(--cb-surface)" : "transparent",
                color: mode === m ? accent : "var(--cb-secondary)",
                cursor: "pointer",
                transition: "color 0.15s, background-color 0.15s",
                position: "relative",
                borderBottom: mode === m ? `2px solid ${accent}` : "2px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Location search + coordinates */}
        <LocationSearch
          latitude={latitude}
          longitude={longitude}
          hasPolygon={hasPolygon}
          locationName={locationName}
          accentColor={activeItem?.accent ?? "#10b981"}
          onSelectLocation={onLocationSearch}
        />

        {/* Map overlay selector */}
        <div className="shrink-0 px-4 py-2.5 cb-divider">
          <div className="cb-label mb-2">Map Overlay</div>
          <div className="flex gap-1">
            {(
              [
                { value: "default", label: "Default" },
                { value: "credit_rating", label: "Credit" },
                { value: "financial_risk", label: "Risk" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onAtlasOverlayChange(value)}
                style={{
                  flex: 1,
                  height: 24,
                  fontSize: 9,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  border: "1px solid var(--cb-border)",
                  backgroundColor: atlasOverlay === value ? "var(--cb-surface)" : "transparent",
                  color: atlasOverlay === value ? (activeItem?.accent ?? "var(--cb-text)") : "var(--cb-secondary)",
                  cursor: "pointer",
                  transition: "color 0.15s, background-color 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode-specific controls + simulation params — scrollable */}
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
            globalTempTarget={globalTempTarget}
            onGlobalTempTargetChange={onGlobalTempTargetChange}
            rainChange={rainChange}
            onRainChangeChange={onRainChangeChange}
            onAgricultureSimulate={onAgricultureSimulate}
            isAgricultureSimulating={isAgricultureSimulating}
            yieldPotential={yieldPotential}
            totalRainIntensity={totalRainIntensity}
            onTotalRainIntensityChange={onTotalRainIntensityChange}
            floodSelectedYear={floodSelectedYear}
            onFloodSelectedYearChange={onFloodSelectedYearChange}
            isFloodUserOverride={isFloodUserOverride}
            onFloodUserOverrideChange={onFloodUserOverrideChange}
            onFloodSimulate={onFloodSimulate}
            isFloodSimulating={isFloodSimulating}
            totalSLR={totalSLR}
            onTotalSLRChange={onTotalSLRChange}
            includeStormSurge={includeStormSurge}
            onIncludeStormSurgeChange={onIncludeStormSurgeChange}
            coastalSelectedYear={coastalSelectedYear}
            onCoastalSelectedYearChange={onCoastalSelectedYearChange}
            onCoastalSimulate={onCoastalSimulate}
            isCoastalSimulating={isCoastalSimulating}
            healthTempTarget={healthTempTarget}
            onHealthTempTargetChange={onHealthTempTargetChange}
            healthSelectedYear={healthSelectedYear}
            onHealthSelectedYearChange={onHealthSelectedYearChange}
            onHealthSimulate={onHealthSimulate}
            isHealthSimulating={isHealthSimulating}
            onPortfolioResultsChange={onPortfolioResultsChange}
            propertyValue={propertyValue}
            onPropertyValueChange={onPropertyValueChange}
            selectedYear={selectedYear}
          />
        </div>

        {/* Timeline footer */}
        <div className="shrink-0 border-t" style={{ borderColor: "var(--cb-border)" }}>
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
  );
}

export interface ModeContentProps {
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
  onOpenDefensiveWizard?: (type: "sea_wall" | "drainage") => void;
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
  globalTempTarget: number;
  onGlobalTempTargetChange: (v: number) => void;
  rainChange: number;
  onRainChangeChange: (v: number) => void;
  onAgricultureSimulate: () => void;
  isAgricultureSimulating: boolean;
  yieldPotential: number | null;
  totalRainIntensity: number;
  onTotalRainIntensityChange: (v: number) => void;
  floodSelectedYear: number;
  onFloodSelectedYearChange: (v: number) => void;
  isFloodUserOverride: boolean;
  onFloodUserOverrideChange: (v: boolean) => void;
  onFloodSimulate: () => void;
  isFloodSimulating: boolean;
  totalSLR: number;
  onTotalSLRChange: (v: number) => void;
  includeStormSurge: boolean;
  onIncludeStormSurgeChange: (v: boolean) => void;
  coastalSelectedYear: number;
  onCoastalSelectedYearChange: (v: number) => void;
  onCoastalSimulate: () => void;
  isCoastalSimulating: boolean;
  healthTempTarget: number;
  onHealthTempTargetChange: (v: number) => void;
  healthSelectedYear: number;
  onHealthSelectedYearChange: (v: number) => void;
  onHealthSimulate: () => void;
  isHealthSimulating: boolean;
  onPortfolioResultsChange?: (data: import("@/types/portfolio").PortfolioAnalysisResult | null) => void;
  propertyValue: number;
  onPropertyValueChange: (v: number) => void;
  selectedYear: number;
}

function SectionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 cb-divider">
      <div className="cb-label mb-2">{label}</div>
      {children}
    </div>
  );
}

function SimDivider() {
  return <div className="mx-4 mt-6 mb-0 border-t" style={{ borderColor: "var(--cb-border)" }} />;
}

function getAnalyzePortfolioUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base && typeof base === "string") {
    const trimmed = base.replace(/\/+$/, "");
    return `${trimmed}/api/v1/analyze-portfolio`;
  }
  return "/api/v1/analyze-portfolio";
}

export function ModeContent(props: ModeContentProps) {
  const {
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
    globalTempTarget,
    onGlobalTempTargetChange,
    rainChange,
    onRainChangeChange,
    onAgricultureSimulate,
    isAgricultureSimulating,
    yieldPotential,
    totalRainIntensity,
    onTotalRainIntensityChange,
    floodSelectedYear,
    onFloodSelectedYearChange,
    isFloodUserOverride,
    onFloodUserOverrideChange,
    onFloodSimulate,
    isFloodSimulating,
    totalSLR,
    onTotalSLRChange,
    includeStormSurge,
    onIncludeStormSurgeChange,
    coastalSelectedYear,
    onCoastalSelectedYearChange,
    onCoastalSimulate,
    isCoastalSimulating,
    healthTempTarget,
    onHealthTempTargetChange,
    healthSelectedYear,
    onHealthSelectedYearChange,
    onHealthSimulate,
    isHealthSimulating,
    onPortfolioResultsChange,
    propertyValue,
    onPropertyValueChange,
    selectedYear,
  } = props;

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile || !selectedFile.name.toLowerCase().endsWith(".csv")) return;
      setIsUploading(true);
      onPortfolioResultsChange?.(null);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const url = getAnalyzePortfolioUrl();
        const res = await fetch(url, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log('Backend Response:', data);
        onPortfolioResultsChange?.(data);
      } catch (err) {
        console.error("Portfolio analyze error:", err);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    },
    [onPortfolioResultsChange]
  );

  if (mode === "agriculture") {
    return (
      <div>
        <SectionRow label="Crop Commodity">
          <Select value={cropType} onValueChange={onCropChange}>
            <SelectTrigger
              className="w-full h-8 bg-transparent rounded-none shadow-none px-0 focus:ring-0 focus:ring-offset-0"
              style={{
                border: "1px solid var(--cb-border)",
                color: "var(--cb-text)",
                fontFamily: "monospace",
                fontSize: 12,
                paddingLeft: 8,
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="rounded-none shadow-none"
              style={{
                backgroundColor: "var(--cb-bg)",
                border: "1px solid var(--cb-border)",
                color: "var(--cb-text)",
              }}
            >
              {CROPS.map((c) => (
                <SelectItem
                  key={c.value}
                  value={c.value}
                  className="rounded-none"
                  style={{ fontFamily: "monospace", fontSize: 12, color: "var(--cb-text)" }}
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
            style={{ color: "#10b981" }}
          >
            <Sprout style={{ width: 13, height: 13 }} />
            Define Intervention Wizard
          </Button>
        </SectionRow>

        <SimDivider />
        <AgricultureSimPanel
          canSimulate={canSimulate}
          globalTempTarget={globalTempTarget}
          onGlobalTempTargetChange={onGlobalTempTargetChange}
          rainChange={rainChange}
          onRainChangeChange={onRainChangeChange}
          selectedYear={selectedYear}
          onSelectedYearChange={() => {}}
          onSimulate={onAgricultureSimulate}
          isSimulating={isAgricultureSimulating}
          yieldPotential={yieldPotential}
        />
      </div>
    );
  }

  if (mode === "coastal") {
    return (
      <div>
        <SectionRow label="Mangrove Belt Width">
          <div className="flex items-center justify-between mb-2">
            <span className="cb-value">{localMangroveWidth} m</span>
            <TreePine style={{ width: 12, height: 12, color: "#14b8a6" }} />
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
          <div className="flex justify-between mt-1" style={{ fontSize: 10, color: "var(--cb-secondary)" }}>
            <span>0 m</span>
            <span>500 m</span>
          </div>
        </SectionRow>

        <SectionRow label="Defensive Infrastructure">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield style={{ width: 11, height: 11, color: "#14b8a6" }} />
                <Label htmlFor="sea-wall" style={{ fontSize: 11, color: "var(--cb-text)", cursor: "pointer" }}>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets style={{ width: 11, height: 11, color: "#06b6d4" }} />
                <Label htmlFor="coastal-drainage" style={{ fontSize: 11, color: "var(--cb-text)", cursor: "pointer" }}>
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
        </SectionRow>

        <SimDivider />
        <CoastalSimPanel
          canSimulate={canSimulate}
          totalSLR={totalSLR}
          onTotalSLRChange={onTotalSLRChange}
          includeStormSurge={includeStormSurge}
          onIncludeStormSurgeChange={onIncludeStormSurgeChange}
          selectedYear={coastalSelectedYear}
          onSelectedYearChange={onCoastalSelectedYearChange}
          onSimulate={onCoastalSimulate}
          isSimulating={isCoastalSimulating}
          propertyValue={propertyValue}
          onPropertyValueChange={onPropertyValueChange}
          dailyRevenue={dailyRevenue}
          onDailyRevenueChange={onDailyRevenueChange}
          assetLifespan={assetLifespan}
          onAssetLifespanChange={onAssetLifespanChange}
        />
      </div>
    );
  }

  if (mode === "flood") {
    return (
      <div>
        <SectionRow label="Asset at Risk">
          <div className="space-y-3">
            <div>
              <div className="cb-label mb-1.5">Property Value ($)</div>
              <div className="relative">
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{ fontSize: 11, color: "var(--cb-secondary)" }}
                >
                  $
                </span>
                <Input
                  type="text"
                  value={buildingValue.toLocaleString()}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                    onBuildingValueChange(v);
                  }}
                  disabled={!canSimulate}
                  className="pl-3 h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
                  style={{
                    color: "var(--cb-text)",
                    borderColor: "var(--cb-border)",
                    borderBottomWidth: 1,
                    borderBottomStyle: "solid",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="cb-label mb-1.5">Daily Revenue ($)</div>
              <div className="relative">
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{ fontSize: 11, color: "var(--cb-secondary)" }}
                >
                  $
                </span>
                <Input
                  type="text"
                  value={dailyRevenue.toLocaleString()}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                    onDailyRevenueChange(v);
                  }}
                  disabled={!canSimulate}
                  className="pl-3 h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
                  style={{
                    color: "var(--cb-text)",
                    borderColor: "var(--cb-border)",
                    borderBottomWidth: 1,
                    borderBottomStyle: "solid",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar style={{ width: 10, height: 10, color: "var(--cb-secondary)" }} />
                  <span className="cb-label">Asset Lifespan</span>
                </div>
                <span style={{ fontSize: 11, color: "#3b82f6" }}>{assetLifespan} yrs</span>
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
                <Building2 style={{ width: 11, height: 11, color: "#10b981" }} />
                <Label htmlFor="green-roofs" style={{ fontSize: 11, color: "var(--cb-text)", cursor: "pointer" }}>
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
                <DollarSign style={{ width: 11, height: 11, color: "#3b82f6" }} />
                <Label
                  htmlFor="permeable-pavement"
                  style={{ fontSize: 11, color: "var(--cb-text)", cursor: "pointer" }}
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
                <Droplets style={{ width: 11, height: 11, color: "#06b6d4" }} />
                <Label htmlFor="flood-drainage" style={{ fontSize: 11, color: "var(--cb-text)", cursor: "pointer" }}>
                  Drainage Upgrade
                </Label>
              </div>
              <Switch
                id="flood-drainage"
                checked={drainageEnabled}
                onCheckedChange={(checked) => {
                  onDrainageChange(checked);
                  if (checked && onOpenDefensiveWizard) onOpenDefensiveWizard("drainage");
                }}
                disabled={!canSimulate}
              />
            </div>
          </div>
        </SectionRow>

        <SimDivider />
        <FloodSimPanel
          canSimulate={canSimulate}
          totalRainIntensity={totalRainIntensity}
          onTotalRainIntensityChange={onTotalRainIntensityChange}
          selectedYear={floodSelectedYear}
          onSelectedYearChange={onFloodSelectedYearChange}
          isUserOverride={isFloodUserOverride}
          onUserOverrideChange={onFloodUserOverrideChange}
          onSimulate={onFloodSimulate}
          isSimulating={isFloodSimulating}
        />
      </div>
    );
  }

  if (mode === "health") {
    return (
      <div>
        <SectionRow label="Workforce Input">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users style={{ width: 10, height: 10, color: "#f43f5e" }} />
                <span className="cb-label">Outdoor Workforce Size</span>
              </div>
              <Input
                type="number"
                value={workforceSize}
                onChange={(e) => onWorkforceSizeChange(parseInt(e.target.value) || 0)}
                disabled={!canSimulate}
                className="h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
                style={{
                  color: "var(--cb-text)",
                  borderColor: "var(--cb-border)",
                  borderBottomWidth: 1,
                  borderBottomStyle: "solid",
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
                  color: "var(--cb-text)",
                  borderColor: "var(--cb-border)",
                  borderBottomWidth: 1,
                  borderBottomStyle: "solid",
                }}
              />
            </div>
          </div>
        </SectionRow>

        <SimDivider />
        <HealthSimPanel
          canSimulate={canSimulate}
          globalTempTarget={healthTempTarget}
          onGlobalTempTargetChange={onHealthTempTargetChange}
          selectedYear={healthSelectedYear}
          onSelectedYearChange={onHealthSelectedYearChange}
          onSimulate={onHealthSimulate}
          isSimulating={isHealthSimulating}
        />
      </div>
    );
  }

  if (mode === "finance") {
    return (
      <div>
        <SectionRow label="Green Bond Structuring">
          <p style={{ fontSize: 11, color: "var(--cb-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
            Run a live simulation to generate a Green Bond Term Sheet for the selected location.
          </p>
          <Button
            variant="ghost"
            onClick={onFinanceSimulate}
            disabled={!canSimulate || isFinanceSimulating}
            className="w-full h-8 text-xs font-medium gap-2"
            style={{
              backgroundColor: "var(--cb-surface)",
              color: isFinanceSimulating ? "var(--cb-secondary)" : "#f59e0b",
              border: "1px solid var(--cb-border)",
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
            <p className="mt-2 text-center" style={{ fontSize: 10, color: "var(--cb-secondary)" }}>
              Select a location on the map first
            </p>
          )}
        </SectionRow>
      </div>
    );
  }

  if (mode === "portfolio") {
    return (
      <div className="px-4 py-3 space-y-3">
        <p style={{ fontSize: 11, color: "var(--cb-secondary)", lineHeight: 1.5 }}>
          Upload a CSV portfolio to screen climate risk across multiple assets.
        </p>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (!isUploading && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className="relative bg-transparent border border-dashed rounded-none font-mono text-xs cursor-pointer transition-colors hover:opacity-80"
          style={{
            borderWidth: 1,
            borderColor: "var(--cb-border)",
            color: "var(--cb-text)",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="absolute w-0 h-0 opacity-0 overflow-hidden"
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
            disabled={isUploading}
          />
          <span
            className="w-full py-4 px-3 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider"
            style={{ color: "var(--cb-text)" }}
          >
            {isUploading ? (
              <>
                <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload style={{ width: 12, height: 12 }} />
                UPLOAD ASSET CSV
              </>
            )}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Inline simulation sub-panels ────────────────────────────────────────────

interface AgricultureSimPanelProps {
  canSimulate: boolean;
  globalTempTarget: number;
  onGlobalTempTargetChange: (v: number) => void;
  rainChange: number;
  onRainChangeChange: (v: number) => void;
  selectedYear: number;
  onSelectedYearChange: (v: number) => void;
  onSimulate: () => void;
  isSimulating: boolean;
  yieldPotential: number | null;
}

function AgricultureSimPanel({
  canSimulate,
  globalTempTarget,
  onGlobalTempTargetChange,
  rainChange,
  onRainChangeChange,
  selectedYear,
  onSelectedYearChange,
  onSimulate,
  isSimulating,
  yieldPotential,
}: AgricultureSimPanelProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const getEstimatedScore = () => {
    const base = 85;
    const tempDelta = globalTempTarget - 1.4;
    const tempReduction = tempDelta * 15;
    const rainImpact = rainChange < 0 ? Math.abs(rainChange) * 0.5 : rainChange * -0.2;
    return Math.max(0, Math.min(100, base - tempReduction + rainImpact));
  };

  const displayScore = yieldPotential !== null && yieldPotential !== undefined ? yieldPotential : getEstimatedScore();

  const getScoreColor = () => {
    if (displayScore >= 70) return "bg-emerald-500";
    if (displayScore >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getGWLBadgeColor = () => {
    if (globalTempTarget <= 1.5) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (globalTempTarget > 2.0) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  const getRainBadgeColor = () => {
    const projected = BASELINE_RAINFALL_MM * (1 + rainChange / 100);
    if (projected > 900) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (projected < 500) return "bg-amber-600/20 text-amber-600 border-amber-600/30";
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="cb-label flex items-center gap-1.5">
        <Thermometer style={{ width: 10, height: 10, color: "#f59e0b" }} />
        Simulation Parameters
      </div>

      <SliderRow
        label="Projection Year"
        icon={<Calendar style={{ width: 10, height: 10, color: "var(--cb-secondary)" }} />}
        badge={<span style={{ fontSize: 10, color: "var(--cb-text)", fontFamily: "monospace" }}>{selectedYear}</span>}
      >
        <Slider
          value={[selectedYear]}
          onValueChange={(v) => {
            onSelectedYearChange(v[0]);
            onGlobalTempTargetChange(Math.round(calculateTempFromYear(v[0]) * 10) / 10);
          }}
          min={2026}
          max={2050}
          step={1}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:via-amber-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["2026", "2030", "2040", "2050"]} />
      </SliderRow>

      <SliderRow
        label="Global Warming"
        icon={<Thermometer style={{ width: 10, height: 10, color: "#f59e0b" }} />}
        badge={
          <Badge className={cn("text-[10px] px-1.5 py-0 font-bold tabular-nums border", getGWLBadgeColor())}>
            +{globalTempTarget.toFixed(1)}°C
          </Badge>
        }
      >
        <Slider
          value={[globalTempTarget]}
          onValueChange={(v) => onGlobalTempTargetChange(v[0])}
          min={1.4}
          max={4.0}
          step={0.1}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:via-amber-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["1.4°C", "2.0°C", "4.0°C"]} />
      </SliderRow>

      <SliderRow
        label="Rainfall Δ"
        icon={<CloudRain style={{ width: 10, height: 10, color: "#3b82f6" }} />}
        badge={
          <Badge className={cn("text-[10px] px-1.5 py-0 font-bold tabular-nums border", getRainBadgeColor())}>
            {rainChange > 0 ? "+" : ""}
            {rainChange}%
          </Badge>
        }
      >
        <Slider
          value={[rainChange]}
          onValueChange={(v) => onRainChangeChange(v[0])}
          min={-30}
          max={30}
          step={5}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-amber-500 [&_[data-radix-slider-range]]:to-blue-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["-30%", "0%", "+30%"]} />
      </SliderRow>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span
            style={{ fontSize: 10, color: "var(--cb-secondary)", letterSpacing: "0.07em", textTransform: "uppercase" }}
          >
            Projected Yield Potential
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: displayScore >= 70 ? "#10b981" : displayScore >= 40 ? "#f59e0b" : "#ef4444",
              fontFamily: "monospace",
            }}
          >
            {Math.round(displayScore)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--cb-border)" }}>
          <div
            className={cn("h-full transition-all duration-500 rounded-full", getScoreColor())}
            style={{ width: `${displayScore}%` }}
          />
        </div>
      </div>

      <SimButton
        onClick={onSimulate}
        disabled={!canSimulate || isSimulating}
        isSimulating={isSimulating}
        label="Simulate Resilience"
        color="#10b981"
      />
      {!canSimulate && <NoLocationHint />}
    </div>
  );
}

interface FloodSimPanelProps {
  canSimulate: boolean;
  totalRainIntensity: number;
  onTotalRainIntensityChange: (v: number) => void;
  selectedYear: number;
  onSelectedYearChange: (v: number) => void;
  isUserOverride: boolean;
  onUserOverrideChange: (v: boolean) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

function FloodSimPanel({
  canSimulate,
  totalRainIntensity,
  onTotalRainIntensityChange,
  selectedYear,
  onSelectedYearChange,
  isUserOverride,
  onUserOverrideChange,
  onSimulate,
  isSimulating,
}: FloodSimPanelProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!canSimulate) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSimulate();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [totalRainIntensity, canSimulate]);

  const getIntensityBadgeColor = () => {
    if (totalRainIntensity < 10) return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    if (totalRainIntensity <= 15) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (totalRainIntensity <= 25) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getProgressColor = () => {
    if (totalRainIntensity < 10) return "bg-slate-500";
    if (totalRainIntensity <= 15) return "bg-emerald-500";
    if (totalRainIntensity <= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="cb-label flex items-center gap-1.5">
        <Droplets style={{ width: 10, height: 10, color: "#3b82f6" }} />
        Flood Parameters
      </div>

      <SliderRow
        label="Projection Year"
        icon={<Calendar style={{ width: 10, height: 10, color: "var(--cb-secondary)" }} />}
        badge={<span style={{ fontSize: 10, color: "var(--cb-text)", fontFamily: "monospace" }}>{selectedYear}</span>}
      >
        <Slider
          value={[selectedYear]}
          onValueChange={(v) => {
            onSelectedYearChange(v[0]);
            if (!isUserOverride) onTotalRainIntensityChange(calculateRainFromYear(v[0]));
            onUserOverrideChange(false);
          }}
          min={2026}
          max={2050}
          step={1}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-blue-500 [&_[data-radix-slider-range]]:via-blue-400 [&_[data-radix-slider-range]]:to-cyan-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["2026", "2038", "2050"]} />
      </SliderRow>

      <SliderRow
        label="Rainfall Intensity"
        icon={<CloudRain style={{ width: 10, height: 10, color: "#3b82f6" }} />}
        badge={
          <Badge className={cn("text-[10px] px-1.5 py-0 font-bold tabular-nums border", getIntensityBadgeColor())}>
            +{totalRainIntensity}%
          </Badge>
        }
      >
        <Slider
          value={[totalRainIntensity]}
          onValueChange={(v) => {
            onTotalRainIntensityChange(v[0]);
            onUserOverrideChange(true);
          }}
          min={0}
          max={40}
          step={1}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-blue-500 [&_[data-radix-slider-range]]:via-orange-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["0%", "20%", "40%"]} />
        <div className="flex gap-1 pt-0.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-400/80 bg-blue-500/5">
            vs Pre-industrial
          </Badge>
          {isUserOverride && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400/80 bg-amber-500/5"
            >
              Manual Override
            </Badge>
          )}
        </div>
      </SliderRow>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span
            style={{ fontSize: 10, color: "var(--cb-secondary)", letterSpacing: "0.07em", textTransform: "uppercase" }}
          >
            Rainfall Intensity
          </span>
          <span
            className={cn(
              "text-xs font-semibold tabular-nums font-mono",
              totalRainIntensity < 10
                ? "text-slate-400"
                : totalRainIntensity <= 15
                  ? "text-emerald-400"
                  : totalRainIntensity <= 25
                    ? "text-orange-400"
                    : "text-red-400",
            )}
          >
            +{totalRainIntensity}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--cb-border)" }}>
          <div
            className={cn("h-full transition-all duration-500 rounded-full", getProgressColor())}
            style={{ width: `${Math.min((totalRainIntensity / 40) * 100, 100)}%` }}
          />
        </div>
      </div>

      <SimButton
        onClick={onSimulate}
        disabled={!canSimulate || isSimulating}
        isSimulating={isSimulating}
        label="Simulate Flood Risk"
        color="#3b82f6"
      />
      {!canSimulate && <NoLocationHint />}
    </div>
  );
}

interface CoastalSimPanelProps {
  canSimulate: boolean;
  totalSLR: number;
  onTotalSLRChange: (v: number) => void;
  includeStormSurge: boolean;
  onIncludeStormSurgeChange: (v: boolean) => void;
  selectedYear: number;
  onSelectedYearChange: (v: number) => void;
  onSimulate: () => void;
  isSimulating: boolean;
  propertyValue: number;
  onPropertyValueChange: (v: number) => void;
  dailyRevenue: number;
  onDailyRevenueChange: (v: number) => void;
  assetLifespan: number;
  onAssetLifespanChange: (v: number) => void;
}

function CoastalSimPanel({
  canSimulate,
  totalSLR,
  onTotalSLRChange,
  includeStormSurge,
  onIncludeStormSurgeChange,
  selectedYear,
  onSelectedYearChange,
  onSimulate,
  isSimulating,
  propertyValue,
  onPropertyValueChange,
  dailyRevenue,
  onDailyRevenueChange,
  assetLifespan,
  onAssetLifespanChange,
}: CoastalSimPanelProps) {
  const totalWaterLevel = totalSLR + (includeStormSurge ? STORM_SURGE_HEIGHT : 0);

  const getSLRBadgeColor = () => {
    if (totalSLR <= 0.1) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (totalSLR <= 0.5) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getTotalWaterColor = () => {
    if (totalWaterLevel <= 0.5) return "text-emerald-400";
    if (totalWaterLevel <= 1.5) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="cb-label flex items-center gap-1.5">
        <Waves style={{ width: 10, height: 10, color: "#14b8a6" }} />
        Coastal Parameters
      </div>

      {/* Asset at Risk */}
      <div className="space-y-2">
        <div className="cb-label mb-1">Asset at Risk</div>
        <div>
          <div className="cb-label mb-1">Property Value ($)</div>
          <div className="relative">
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2"
              style={{ fontSize: 11, color: "var(--cb-secondary)" }}
            >
              $
            </span>
            <Input
              type="text"
              value={propertyValue.toLocaleString()}
              onChange={(e) => {
                const v = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                onPropertyValueChange(v);
              }}
              disabled={!canSimulate}
              className="pl-3 h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
              style={{
                color: "var(--cb-text)",
                borderColor: "var(--cb-border)",
                borderBottomWidth: 1,
                borderBottomStyle: "solid",
              }}
            />
          </div>
        </div>
        <div>
          <div className="cb-label mb-1">Daily Revenue ($)</div>
          <div className="relative">
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2"
              style={{ fontSize: 11, color: "var(--cb-secondary)" }}
            >
              $
            </span>
            <Input
              type="text"
              value={dailyRevenue.toLocaleString()}
              onChange={(e) => {
                const v = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                onDailyRevenueChange(v);
              }}
              disabled={!canSimulate}
              className="pl-3 h-7 border-0 border-b rounded-none bg-transparent text-xs focus-visible:ring-0"
              style={{
                color: "var(--cb-text)",
                borderColor: "var(--cb-border)",
                borderBottomWidth: 1,
                borderBottomStyle: "solid",
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="cb-label">Asset Lifespan</span>
            <span style={{ fontSize: 10, color: "#14b8a6", fontFamily: "monospace" }}>{assetLifespan} yrs</span>
          </div>
          <Slider
            value={[assetLifespan]}
            onValueChange={(v) => onAssetLifespanChange(v[0])}
            min={5}
            max={50}
            step={5}
            className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-teal-500 [&_[data-radix-slider-thumb]]:border-teal-500 [&_[data-radix-slider-thumb]]:bg-white"
          />
        </div>
      </div>

      <SliderRow
        label="Projection Year"
        icon={<Calendar style={{ width: 10, height: 10, color: "var(--cb-secondary)" }} />}
        badge={<span style={{ fontSize: 10, color: "var(--cb-text)", fontFamily: "monospace" }}>{selectedYear}</span>}
      >
        <Slider
          value={[selectedYear]}
          onValueChange={(v) => {
            onSelectedYearChange(v[0]);
            onTotalSLRChange(Math.round(calculateSLRFromYear(v[0]) * 100) / 100);
          }}
          min={2026}
          max={2050}
          step={1}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-teal-500 [&_[data-radix-slider-range]]:via-cyan-500 [&_[data-radix-slider-range]]:to-blue-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["2026", "2038", "2050"]} />
      </SliderRow>

      <SliderRow
        label="Sea Level Rise (vs 2000)"
        icon={<Waves style={{ width: 10, height: 10, color: "#14b8a6" }} />}
        badge={
          <Badge className={cn("text-[10px] px-1.5 py-0 font-bold tabular-nums border", getSLRBadgeColor())}>
            +{totalSLR.toFixed(2)}m
          </Badge>
        }
      >
        <Slider
          value={[totalSLR]}
          onValueChange={(v) => onTotalSLRChange(v[0])}
          min={0}
          max={2.0}
          step={0.05}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-teal-500 [&_[data-radix-slider-range]]:via-cyan-500 [&_[data-radix-slider-range]]:to-blue-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["0m", "1.0m", "2.0m"]} />
      </SliderRow>

      <button
        onClick={() => onIncludeStormSurgeChange(!includeStormSurge)}
        className={cn(
          "w-full flex items-center justify-between p-2.5 border transition-all duration-200",
          includeStormSurge ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/5 border-white/10 hover:bg-white/10",
        )}
      >
        <div className="flex items-center gap-2">
          <CloudRain className={cn("w-3.5 h-3.5", includeStormSurge ? "text-cyan-400" : "text-white/50")} />
          <div className="text-left">
            <span className={cn("text-xs font-medium", includeStormSurge ? "text-cyan-400" : "text-white/70")}>
              1-in-100 Year Storm Surge
            </span>
            <p className="text-[9px] text-white/40">Adds +{STORM_SURGE_HEIGHT}m to calculation</p>
          </div>
        </div>
        {includeStormSurge ? (
          <ToggleRight className="w-4 h-4 text-cyan-400" />
        ) : (
          <ToggleLeft className="w-4 h-4 text-white/40" />
        )}
      </button>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span
            style={{ fontSize: 10, color: "var(--cb-secondary)", letterSpacing: "0.07em", textTransform: "uppercase" }}
          >
            Total Water Level
          </span>
          <span className={cn("text-xs font-semibold tabular-nums font-mono", getTotalWaterColor())}>
            +{totalWaterLevel.toFixed(2)}m
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--cb-border)" }}>
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              totalWaterLevel <= 0.5 ? "bg-emerald-500" : totalWaterLevel <= 1.5 ? "bg-amber-500" : "bg-red-500",
            )}
            style={{ width: `${Math.min((totalWaterLevel / 4.5) * 100, 100)}%` }}
          />
        </div>
      </div>

      <SimButton
        onClick={onSimulate}
        disabled={!canSimulate || isSimulating}
        isSimulating={isSimulating}
        label="Simulate Coastal Risk"
        color="#14b8a6"
      />
      {!canSimulate && <NoLocationHint />}
    </div>
  );
}

interface HealthSimPanelProps {
  canSimulate: boolean;
  globalTempTarget: number;
  onGlobalTempTargetChange: (v: number) => void;
  selectedYear: number;
  onSelectedYearChange: (v: number) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

function HealthSimPanel({
  canSimulate,
  globalTempTarget,
  onGlobalTempTargetChange,
  selectedYear,
  onSelectedYearChange,
  onSimulate,
  isSimulating,
}: HealthSimPanelProps) {
  const getGWLBadgeColor = () => {
    if (globalTempTarget <= 1.5) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (globalTempTarget > 2.0) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="cb-label flex items-center gap-1.5">
        <HeartPulse style={{ width: 10, height: 10, color: "#f43f5e" }} />
        Climate &amp; Health Parameters
      </div>

      <SliderRow
        label="Projection Year"
        icon={<Calendar style={{ width: 10, height: 10, color: "var(--cb-secondary)" }} />}
        badge={<span style={{ fontSize: 10, color: "var(--cb-text)", fontFamily: "monospace" }}>{selectedYear}</span>}
      >
        <Slider
          value={[selectedYear]}
          onValueChange={(v) => {
            onSelectedYearChange(v[0]);
            onGlobalTempTargetChange(Math.round(calculateTempFromYear(v[0]) * 10) / 10);
          }}
          min={2026}
          max={2050}
          step={1}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:via-amber-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["2026", "2030", "2040", "2050"]} />
      </SliderRow>

      <SliderRow
        label="Global Warming"
        icon={<Thermometer style={{ width: 10, height: 10, color: "#f59e0b" }} />}
        badge={
          <Badge className={cn("text-[10px] px-1.5 py-0 font-bold tabular-nums border", getGWLBadgeColor())}>
            +{globalTempTarget.toFixed(1)}°C
          </Badge>
        }
      >
        <Slider
          value={[globalTempTarget]}
          onValueChange={(v) => onGlobalTempTargetChange(v[0])}
          min={1.4}
          max={4.0}
          step={0.1}
          className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-emerald-500 [&_[data-radix-slider-range]]:via-amber-500 [&_[data-radix-slider-range]]:to-red-500 [&_[data-radix-slider-thumb]]:border-white/50 [&_[data-radix-slider-thumb]]:bg-white"
        />
        <SliderTicks ticks={["1.4°C", "2.0°C", "4.0°C"]} />
      </SliderRow>

      <SimButton
        onClick={onSimulate}
        disabled={!canSimulate || isSimulating}
        isSimulating={isSimulating}
        label="Simulate Health Risk"
        color="#f43f5e"
      />
      {!canSimulate && <NoLocationHint />}
    </div>
  );
}

// ─── Shared micro-components ─────────────────────────────────────────────────

function SliderRow({
  label,
  icon,
  badge,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  badge: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span
            style={{ fontSize: 10, color: "var(--cb-secondary)", letterSpacing: "0.07em", textTransform: "uppercase" }}
          >
            {label}
          </span>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function SliderTicks({ ticks }: { ticks: string[] }) {
  return (
    <div className="flex justify-between" style={{ fontSize: 9, color: "var(--cb-secondary)" }}>
      {ticks.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}

function SimButton({
  onClick,
  disabled,
  isSimulating,
  label,
  color,
}: {
  onClick: () => void;
  disabled: boolean;
  isSimulating: boolean;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 34,
        fontSize: 10,
        fontFamily: "monospace",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: disabled ? "var(--cb-secondary)" : color,
        backgroundColor: "var(--cb-surface)",
        border: `1px solid ${disabled ? "var(--cb-border)" : color}`,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "opacity 0.15s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {isSimulating ? (
        <>
          <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
          Simulating...
        </>
      ) : (
        <>
          <Zap style={{ width: 11, height: 11 }} />
          {label}
        </>
      )}
    </button>
  );
}

function NoLocationHint() {
  return (
    <p style={{ fontSize: 10, color: "var(--cb-secondary)", textAlign: "center" }}>
      Select a location on the map first
    </p>
  );
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** Auth UI hidden for prototyping; all pages are public. */
function CompactUserMenu() {
  return null;
}

function CompactSettingsButton() {
  return (
    <div className="flex items-center justify-center" style={{ width: 40, height: 40 }} title="Financial Settings">
      <FinancialSettingsModal />
    </div>
  );
}
