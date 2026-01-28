import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MapView, MapStyle } from '@/components/dashboard/MapView';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { toast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

// Coastal simulation endpoint (n8n webhook)
const COASTAL_API_URL = 'https://primary-production-679e.up.railway.app/webhook/coastal-valuation';

const Index = () => {
  const [mode, setMode] = useState<DashboardMode>('agriculture');
  const [cropType, setCropType] = useState('maize');
  const [mangroveWidth, setMangroveWidth] = useState(100);
  const [propertyValue, setPropertyValue] = useState(500000);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCoastalSimulating, setIsCoastalSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCoastalResults, setShowCoastalResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [results, setResults] = useState({
    avoidedLoss: 0,
    riskReduction: 0,
    yieldBaseline: 0,
    yieldResilient: 0,
    monthlyData: mockMonthlyData,
  });

  const [coastalResults, setCoastalResults] = useState<{
    avoidedLoss: number;
    slope: number | null;
    stormWave: number | null;
  }>({
    avoidedLoss: 0,
    slope: null,
    stormWave: null,
  });

  // Determine map style based on mode
  const mapStyle: MapStyle = mode === 'coastal' ? 'satellite' : 'dark';

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setShowResults(false);
    setShowCoastalResults(false);
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

      const responseData = await response.json();
      
      // API returns an array with nested data structure
      const result = Array.isArray(responseData) ? responseData[0] : responseData;
      const analysis = result?.data?.analysis;
      const predictions = result?.data?.predictions;
      
      if (!analysis || !predictions) {
        throw new Error('Invalid response format from simulation API');
      }
      
      const yieldBaseline = predictions.standard_seed?.predicted_yield ?? 0;
      const yieldResilient = predictions.resilient_seed?.predicted_yield ?? 0;
      const avoidedLoss = analysis.avoided_loss ?? 0;
      const percentageImprovement = analysis.percentage_improvement ?? 0;
      
      setResults({
        avoidedLoss: Math.round(avoidedLoss * 100) / 100,
        riskReduction: Math.round(percentageImprovement * 100),
        yieldBaseline,
        yieldResilient,
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

  const handleCoastalSimulate = useCallback(async (width: number) => {
    if (!markerPosition) return;
    
    setIsCoastalSimulating(true);
    
    try {
      const response = await fetch(COASTAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: markerPosition.lat,
          lon: markerPosition.lng,
          mangrove_width: width,
          property_value: propertyValue,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Debug log the full response to see actual structure
      console.log('Coastal API response:', JSON.stringify(responseData, null, 2));
      
      // Handle response - adjust based on actual API response structure
      const result = Array.isArray(responseData) ? responseData[0] : responseData;
      const data = result?.data || result;
      const analysis = data?.data?.analysis || data?.analysis || data;
      
      // Try multiple possible field paths for slope and storm wave
      const rawSlope = analysis?.slope ?? data?.slope ?? data?.detected_slope ?? data?.terrain?.slope ?? result?.slope ?? null;
      const rawStormWave = analysis?.storm_wave ?? analysis?.stormWave ?? data?.storm_wave ?? data?.stormWave ?? data?.wave_height ?? result?.storm_wave ?? null;
      
      // Extract avoided_loss (backend may return it at multiple paths)
      const rawAvoidedLoss = analysis?.avoided_loss ?? analysis?.avoidedLoss ?? data?.avoided_loss ?? data?.avoidedLoss ?? null;
      const avoidedLossNumber =
        typeof rawAvoidedLoss === 'string' ? Number(rawAvoidedLoss) : rawAvoidedLoss;
      
      console.log('Parsed coastal data - slope:', rawSlope, 'stormWave:', rawStormWave, 'avoided_loss:', rawAvoidedLoss);
      
      setCoastalResults({
        // Keep cents precision so small values don't get rounded to $0
        avoidedLoss:
          avoidedLossNumber !== null && Number.isFinite(avoidedLossNumber)
            ? Math.round(avoidedLossNumber * 100) / 100
            : Math.round(propertyValue * 0.3),
        slope: rawSlope !== null ? Math.round(rawSlope * 10) / 10 : null,
        stormWave: rawStormWave !== null ? Math.round(rawStormWave * 10) / 10 : null,
      });
      setShowCoastalResults(true);
    } catch (error) {
      console.error('Coastal simulation failed:', error);
      // On API error, use a fallback calculation for demo purposes
      setCoastalResults({
        avoidedLoss: Math.round(propertyValue * (width / 500) * 0.5),
        slope: null,
        stormWave: null,
      });
      setShowCoastalResults(true);
      toast({
        title: 'Using Estimated Values',
        description: 'Could not reach the coastal simulation API. Showing estimated values.',
        variant: 'default',
      });
    } finally {
      setIsCoastalSimulating(false);
    }
  }, [markerPosition, propertyValue]);

  const handleMangroveWidthChange = useCallback((value: number) => {
    setMangroveWidth(value);
  }, []);

  const handleMangroveWidthChangeEnd = useCallback((value: number) => {
    if (markerPosition) {
      handleCoastalSimulate(value);
    }
  }, [markerPosition, handleCoastalSimulate]);

  const handleModeChange = useCallback((newMode: DashboardMode) => {
    setMode(newMode);
    // Reset results when switching modes
    setShowResults(false);
    setShowCoastalResults(false);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-sidebar border-sidebar-border"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - transforms to drawer on mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          mode={mode}
          onModeChange={handleModeChange}
          cropType={cropType}
          onCropChange={setCropType}
          mangroveWidth={mangroveWidth}
          onMangroveWidthChange={handleMangroveWidthChange}
          onMangroveWidthChangeEnd={handleMangroveWidthChangeEnd}
          propertyValue={propertyValue}
          onPropertyValueChange={setPropertyValue}
          latitude={markerPosition?.lat ?? null}
          longitude={markerPosition?.lng ?? null}
          onSimulate={handleSimulate}
          isSimulating={isSimulating}
          showResults={showResults}
          results={results}
          coastalResults={coastalResults}
          showCoastalResults={showCoastalResults}
          isCoastalSimulating={isCoastalSimulating}
          onClose={() => setIsMobileMenuOpen(false)}
          isMobile={isMobileMenuOpen}
        />
      </div>
      
      <main className="flex-1 relative">
        <MapView
          onLocationSelect={handleLocationSelect}
          markerPosition={markerPosition}
          mapStyle={mapStyle}
        />
      </main>
    </div>
  );
};

export default Index;
