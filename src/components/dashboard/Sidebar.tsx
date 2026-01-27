import { Logo } from './Logo';
import { CropSelector } from './CropSelector';
import { SimulateButton } from './SimulateButton';
import { CoordinatesDisplay } from './CoordinatesDisplay';
import { ResultsCard } from './ResultsCard';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  cropType: string;
  onCropChange: (value: string) => void;
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
}

export const Sidebar = ({
  cropType,
  onCropChange,
  latitude,
  longitude,
  onSimulate,
  isSimulating,
  showResults,
  results,
}: SidebarProps) => {
  const canSimulate = latitude !== null && longitude !== null;

  return (
    <aside className="sidebar-width h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-6 pb-4">
        <Logo />
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      {/* Controls */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <CropSelector value={cropType} onChange={onCropChange} />
        
        <CoordinatesDisplay latitude={latitude} longitude={longitude} />
        
        <SimulateButton 
          onClick={onSimulate} 
          isLoading={isSimulating}
          disabled={!canSimulate}
        />
        
        <ResultsCard 
          visible={showResults}
          avoidedLoss={results.avoidedLoss}
          riskReduction={results.riskReduction}
          monthlyData={results.monthlyData}
        />
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
