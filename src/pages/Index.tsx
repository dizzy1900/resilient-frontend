import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MapView } from '@/components/dashboard/MapView';
import { toast } from '@/hooks/use-toast';

const mockMonthlyData = [
  { month: 'Jan', value: 45 },
  { month: 'Feb', value: 52 },
  { month: 'Mar', value: 78 },
  { month: 'Apr', value: 85 },
  { month: 'May', value: 92 },
  { month: 'Jun', value: 88 },
  { month: 'Jul', value: 65 },
  { month: 'Aug', value: 55 },
  { month: 'Sep', value: 48 },
  { month: 'Oct', value: 42 },
  { month: 'Nov', value: 38 },
  { month: 'Dec', value: 35 },
];

const Index = () => {
  const [cropType, setCropType] = useState('maize');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({
    avoidedLoss: 0,
    riskReduction: 0,
    yieldBaseline: 0,
    yieldResilient: 0,
    monthlyData: mockMonthlyData,
  });

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setShowResults(false);
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!markerPosition) return;
    
    setIsSimulating(true);
    setShowResults(false);
    
    try {
      const response = await fetch('https://primary-production-679e.up.railway.app/webhook/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: markerPosition.lat,
          lon: markerPosition.lng,
          crop: cropType,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Calculate risk reduction as percentage difference between resilient and baseline
      const riskReduction = data.yield_baseline > 0 
        ? Math.round(((data.yield_resilient - data.yield_baseline) / data.yield_baseline) * 100)
        : 0;
      
      setResults({
        avoidedLoss: Math.round(data.avoided_loss),
        riskReduction,
        yieldBaseline: data.yield_baseline,
        yieldResilient: data.yield_resilient,
        monthlyData: mockMonthlyData,
      });
      setShowResults(true);
    } catch (error) {
      console.error('Simulation failed:', error);
      toast({
        title: 'Simulation Failed',
        description: error instanceof Error ? error.message : 'Unable to connect to the simulation server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  }, [markerPosition, cropType]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        cropType={cropType}
        onCropChange={setCropType}
        latitude={markerPosition?.lat ?? null}
        longitude={markerPosition?.lng ?? null}
        onSimulate={handleSimulate}
        isSimulating={isSimulating}
        showResults={showResults}
        results={results}
      />
      
      <main className="flex-1 relative">
        <MapView
          onLocationSelect={handleLocationSelect}
          markerPosition={markerPosition}
        />
      </main>
    </div>
  );
};

export default Index;
