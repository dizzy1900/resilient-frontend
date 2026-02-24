import { useState } from 'react';
import { DashboardMode } from './ModeSelector';
import { LocationHeader } from './sidebar/LocationHeader';
import { SidebarTabs, SidebarTab } from './sidebar/SidebarTabs';
import { OverviewTab } from './sidebar/OverviewTab';
import { RiskFinanceTab } from './sidebar/RiskFinanceTab';
import { AdaptationTab } from './sidebar/AdaptationTab';

interface SidebarProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
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
  onFloodSimulate: () => void;
  isFloodSimulating: boolean;
  showFloodResults: boolean;
  floodResults: {
    floodDepthReduction: number;
    valueProtected: number;
  };
  latitude: number | null;
  longitude: number | null;
  onSimulate: () => void;
  isSimulating: boolean;
  showResults: boolean;
  results: {
    avoidedLoss: number;
    riskReduction: number;
    monthlyData: { month: string; value: number }[];
  };
  coastalResults: {
    avoidedLoss: number;
    slope: number | null;
    stormWave: number | null;
  };
  showCoastalResults: boolean;
  isCoastalSimulating: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  locationName?: string | null;
  projectType?: string | null;
  thumbnailUrl?: string | null;
  creditRating?: string | null;
  executiveSummary?: string | null;
  sectorRank?: number | null;
  sectorTotal?: number | null;
  primaryDriver?: string | null;
  baselineNpv?: number | null;
  varAt95?: number | null;
  defaultProbability?: number | null;
  driverImpactPct?: number | null;
  temporalHistory?: { year: number; npv: number; default_prob?: number }[] | null;
  strandedAssetYear?: number | null;
  adaptationPortfolio?: {
    options: { tier: string; cost: number; roi: number; benefit: number }[];
    recommended_strategy: string;
    stress_level?: number;
  } | null;
}

export const Sidebar = ({
  mode,
  onModeChange,
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
  onFloodSimulate,
  isFloodSimulating,
  showFloodResults,
  floodResults,
  latitude,
  longitude,
  onSimulate,
  isSimulating,
  showResults,
  results,
  coastalResults,
  showCoastalResults,
  isCoastalSimulating,
  onClose,
  isMobile,
  locationName,
  projectType,
  thumbnailUrl,
  creditRating,
  executiveSummary,
  sectorRank,
  sectorTotal,
  primaryDriver,
  baselineNpv,
  varAt95,
  defaultProbability,
  driverImpactPct,
  temporalHistory,
  strandedAssetYear,
  adaptationPortfolio,
}: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');

  return (
    <aside className="sidebar-width h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <LocationHeader
        isMobile={isMobile}
        onClose={onClose}
        locationName={locationName}
        projectType={projectType}
        thumbnailUrl={thumbnailUrl}
        creditRating={creditRating}
      />

      <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto p-5 pt-4">
        {activeTab === 'overview' && (
          <OverviewTab
            mode={mode}
            onModeChange={onModeChange}
            latitude={latitude}
            longitude={longitude}
            cropType={cropType}
            onCropChange={onCropChange}
            mangroveWidth={mangroveWidth}
            onMangroveWidthChange={onMangroveWidthChange}
            onMangroveWidthChangeEnd={onMangroveWidthChangeEnd}
            propertyValue={propertyValue}
            onPropertyValueChange={onPropertyValueChange}
            buildingValue={buildingValue}
            onBuildingValueChange={onBuildingValueChange}
            greenRoofsEnabled={greenRoofsEnabled}
            onGreenRoofsChange={onGreenRoofsChange}
            permeablePavementEnabled={permeablePavementEnabled}
            onPermeablePavementChange={onPermeablePavementChange}
            onFloodSimulate={onFloodSimulate}
            isFloodSimulating={isFloodSimulating}
            showFloodResults={showFloodResults}
            floodResults={floodResults}
            onSimulate={onSimulate}
            isSimulating={isSimulating}
            showResults={showResults}
            results={results}
            coastalResults={coastalResults}
            showCoastalResults={showCoastalResults}
            isCoastalSimulating={isCoastalSimulating}
            executiveSummary={executiveSummary}
            sectorRank={sectorRank}
            sectorTotal={sectorTotal}
            primaryDriver={primaryDriver}
          />
        )}

        {activeTab === 'risk-finance' && (
          <RiskFinanceTab
            baselineNpv={baselineNpv}
            varAt95={varAt95}
            defaultProbability={defaultProbability}
            driverImpactPct={driverImpactPct}
            temporalHistory={temporalHistory}
            strandedAssetYear={strandedAssetYear}
          />
        )}

        {activeTab === 'adaptation' && <AdaptationTab portfolio={adaptationPortfolio} />}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          Climate Risk Analysis Platform v1.0
        </p>
      </div>
    </aside>
  );
};
