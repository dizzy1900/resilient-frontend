import { Logo } from './Logo';
import { ModeSelector, DashboardMode } from './ModeSelector';
import { CropSelector } from './CropSelector';
import { MangroveSlider } from './MangroveSlider';
import { PropertyValueInput } from './PropertyValueInput';
import { SpongeCityToolkit } from './SpongeCityToolkit';
import { SimulateButton } from './SimulateButton';
import { CoordinatesDisplay } from './CoordinatesDisplay';
import { ResultsCard } from './ResultsCard';
import { CoastalResultsCard } from './CoastalResultsCard';
import { FloodResultsCard } from './FloodResultsCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
  // Flood mode props
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
  // Common props
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
}: SidebarProps) => {
  const canSimulate = latitude !== null && longitude !== null;

  return (
    <aside className="sidebar-width h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <Logo />
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      {/* Controls */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <ModeSelector value={mode} onChange={onModeChange} />
        
        <CoordinatesDisplay latitude={latitude} longitude={longitude} />
        
        {mode === 'agriculture' ? (
          <>
            <CropSelector value={cropType} onChange={onCropChange} />
            
            <SimulateButton 
              onClick={onSimulate} 
              isLoading={isSimulating}
              disabled={!canSimulate}
              mode="agriculture"
            />
            
            <ResultsCard 
              visible={showResults}
              isLoading={isSimulating}
              avoidedLoss={results.avoidedLoss}
              riskReduction={results.riskReduction}
              monthlyData={results.monthlyData}
            />
          </>
        ) : mode === 'coastal' ? (
          <>
            <MangroveSlider
              value={mangroveWidth}
              onChange={onMangroveWidthChange}
              onChangeEnd={() => {}}
              disabled={!canSimulate}
            />
            
            <PropertyValueInput
              value={propertyValue}
              onChange={onPropertyValueChange}
              disabled={!canSimulate}
            />
            
            <SimulateButton 
              onClick={() => onMangroveWidthChangeEnd(mangroveWidth)} 
              isLoading={isCoastalSimulating}
              disabled={!canSimulate}
              label="Simulate Protection"
              mode="coastal"
            />
            
            <CoastalResultsCard
              visible={showCoastalResults}
              isLoading={isCoastalSimulating}
              avoidedLoss={coastalResults.avoidedLoss}
              slope={coastalResults.slope}
              stormWave={coastalResults.stormWave}
              mangroveWidth={mangroveWidth}
            />
          </>
        ) : (
          <>
            <SpongeCityToolkit
              buildingValue={buildingValue}
              onBuildingValueChange={onBuildingValueChange}
              greenRoofsEnabled={greenRoofsEnabled}
              onGreenRoofsChange={onGreenRoofsChange}
              permeablePavementEnabled={permeablePavementEnabled}
              onPermeablePavementChange={onPermeablePavementChange}
              disabled={!canSimulate}
            />
            
            <SimulateButton 
              onClick={onFloodSimulate} 
              isLoading={isFloodSimulating}
              disabled={!canSimulate}
              label="Simulate Flood Risk"
              mode="flood"
            />
            
            <FloodResultsCard
              visible={showFloodResults}
              isLoading={isFloodSimulating}
              floodDepthReduction={floodResults.floodDepthReduction}
              valueProtected={floodResults.valueProtected}
              greenRoofsEnabled={greenRoofsEnabled}
              permeablePavementEnabled={permeablePavementEnabled}
            />
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          Climate Risk Analysis Platform v1.0
        </p>
      </div>
    </aside>
  );
};
