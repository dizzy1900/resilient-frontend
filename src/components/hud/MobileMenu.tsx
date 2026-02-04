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
  temperature: number;
  onTemperatureChange: (value: number) => void;
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
  temperature,
  onTemperatureChange,
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
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 rounded-xl bg-black/40 backdrop-blur-xl border border-white/20 hover:bg-white/10 text-white shadow-lg p-0 flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in-0 duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-slate-950/95 backdrop-blur-xl border-r border-white/20 z-[70] shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {mode === 'portfolio' ? 'Portfolio' : 'Controls'}
                </h2>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 p-0 flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
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
                  />

                  <SimulationPanel
                    mode={mode}
                    onSimulate={handleSimulate}
                    isSimulating={isSimulating}
                    canSimulate={canSimulate}
                    temperature={temperature}
                    onTemperatureChange={onTemperatureChange}
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
