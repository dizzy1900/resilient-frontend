import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MapView } from '@/components/dashboard/MapView';

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
    monthlyData: mockMonthlyData,
  });

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setShowResults(false);
  }, []);

  const handleSimulate = useCallback(() => {
    if (!markerPosition) return;
    
    setIsSimulating(true);
    setShowResults(false);
    
    // Simulate API call
    setTimeout(() => {
      // Generate mock results based on location and crop
      const baseValue = cropType === 'maize' ? 2400 : 3200;
      const locationFactor = Math.abs(markerPosition.lat) / 10;
      const avoidedLoss = Math.round(baseValue + (locationFactor * 500) + (Math.random() * 800));
      const riskReduction = Math.round(15 + (Math.random() * 25));
      
      // Randomize monthly data slightly
      const monthlyData = mockMonthlyData.map(d => ({
        ...d,
        value: Math.max(20, Math.min(100, d.value + (Math.random() * 20 - 10)))
      }));
      
      setResults({
        avoidedLoss,
        riskReduction,
        monthlyData,
      });
      setIsSimulating(false);
      setShowResults(true);
    }, 1500);
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
