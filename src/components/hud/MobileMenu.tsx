import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingControlPanel } from './FloatingControlPanel';
import { SimulationPanel } from './SimulationPanel';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel';
import { useState, useEffect } from 'react';

interface MobileMenuProps {
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
  onSimulate: () => void;
  isSimulating: boolean;
  globalTempTarget: number;
  onGlobalTempTargetChange: (value: number) => void;
  rainChange: number;
  onRainChangeChange: (value: number) => void;
  selectedYear: number;
  onSelectedYearChange: (value: number) => void;
  yieldPotential?: number | null;
}

export const MobileMenu = ({
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
  onSimulate,
  isSimulating,
  globalTempTarget,
  onGlobalTempTargetChange,
  rainChange,
  onRainChangeChange,
  selectedYear,
  onSelectedYearChange,
  yieldPotential,
}: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSimulate = () => {
    onSimulate();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 sm:top-4 left-3 sm:left-4 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black/40 backdrop-blur-xl border border-white/20 hover:bg-white/10 text-white shadow-lg p-0 flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in-0 duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-[88%] max-w-xs sm:max-w-sm bg-slate-950/95 backdrop-blur-xl border-r border-white/20 z-[70] shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {mode === 'portfolio' ? 'Portfolio' : 'Controls'}
                </h2>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 p-0 flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {mode === 'portfolio' ? (
                <>
                  <PortfolioHeader onModeChange={onModeChange} />
                  <PortfolioPanel />
                </>
              ) : (
                <>
                  <FloatingControlPanel
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
                    canSimulate={canSimulate}
                    assetLifespan={30}
                    onAssetLifespanChange={() => {}}
                    dailyRevenue={0}
                    onDailyRevenueChange={() => {}}
                    seaWallEnabled={false}
                    onSeaWallChange={() => {}}
                    drainageEnabled={false}
                    onDrainageChange={() => {}}
                    workforceSize={100}
                    onWorkforceSizeChange={() => {}}
                    averageDailyWage={15}
                    onAverageDailyWageChange={() => {}}
                  />

                  <SimulationPanel
                    mode={mode}
                    onSimulate={handleSimulate}
                    isSimulating={isSimulating}
                    canSimulate={canSimulate}
                    globalTempTarget={globalTempTarget}
                    onGlobalTempTargetChange={onGlobalTempTargetChange}
                    rainChange={rainChange}
                    onRainChangeChange={onRainChangeChange}
                    selectedYear={selectedYear}
                    onSelectedYearChange={onSelectedYearChange}
                    yieldPotential={yieldPotential}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
