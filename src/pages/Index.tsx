import { useState, useCallback, useMemo, useEffect } from 'react';
import { MapView, MapStyle, ViewState, ZoneData } from '@/components/dashboard/MapView';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { TimelinePlayer } from '@/components/TimelinePlayer';
import { FloatingControlPanel } from '@/components/hud/FloatingControlPanel';
import { SimulationPanel } from '@/components/hud/SimulationPanel';
import { ResultsPanel } from '@/components/hud/ResultsPanel';
import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { MobileMenu } from '@/components/hud/MobileMenu';
import { ZoneLegend } from '@/components/dashboard/ZoneLegend';
import { AnalyticsHighlightsCard } from '@/components/hud/AnalyticsHighlightsCard';
import { UserMenu } from '@/components/auth/UserMenu';
import { toast } from '@/hooks/use-toast';
import { Columns2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Polygon } from '@/utils/polygonMath';
import { generateIrregularZone, ZoneMode } from '@/utils/zoneGeneration';
import { calculateZoneAtTemperature } from '@/utils/zoneMorphing';
import { supabase } from '@/integrations/supabase/clientSafe';

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
  const [mode, setMode] = useState<DashboardMode>('agriculture');
  const [cropType, setCropType] = useState('maize');
  const [mangroveWidth, setMangroveWidth] = useState(100);
  const [propertyValue, setPropertyValue] = useState(500000);
  const [buildingValue, setBuildingValue] = useState(750000);
  const [greenRoofsEnabled, setGreenRoofsEnabled] = useState(false);
  const [permeablePavementEnabled, setPermeablePavementEnabled] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCoastalSimulating, setIsCoastalSimulating] = useState(false);
  const [isFloodSimulating, setIsFloodSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCoastalResults, setShowCoastalResults] = useState(false);
  const [showFloodResults, setShowFloodResults] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 37.9062,
    latitude: -0.0236,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  });

  const [selectedYear, setSelectedYear] = useState(2026);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);

  const [globalTempTarget, setGlobalTempTarget] = useState(1.4);
  const [rainChange, setRainChange] = useState(0);
  const [baselineZone, setBaselineZone] = useState<Polygon | null>(null);

  // Chart data from API
  const [chartData, setChartData] = useState<{
    rainfall: Array<{ month: string; historical: number; projected: number }>;
    soilMoisture: Array<{ month: string; moisture: number }>;
  } | null>(null);

  const [results, setResults] = useState({
    avoidedLoss: 0,
    riskReduction: 0,
    yieldBaseline: 0,
    yieldResilient: 0,
    yieldPotential: null as number | null, // Unified yield metric from API
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

  const [floodResults, setFloodResults] = useState({
    floodDepthReduction: 0,
    valueProtected: 0,
  });

  const mapStyle: MapStyle = mode === 'coastal' ? 'satellite' : mode === 'flood' ? 'flood' : 'dark';
  const showFloodOverlay = mode === 'flood' && markerPosition !== null;
  const canSimulate = markerPosition !== null;

  useEffect(() => {
    if (markerPosition) {
      const newZone = generateIrregularZone(
        { lat: markerPosition.lat, lng: markerPosition.lng },
        mode as ZoneMode
      );
      setBaselineZone(newZone);
    } else {
      setBaselineZone(null);
    }
  }, [markerPosition, mode]);

  const currentZone = useMemo(() => {
    if (!baselineZone) return null;
    // Pass temperature delta (relative to 1.4°C baseline) for zone morphing
    const tempDelta = globalTempTarget - 1.4;
    return calculateZoneAtTemperature(baselineZone, tempDelta, mode as ZoneMode);
  }, [baselineZone, globalTempTarget, mode]);

  const zoneData: ZoneData | undefined = useMemo(() => {
    if (!baselineZone) return undefined;
    return {
      baselineZone,
      currentZone,
      temperature: globalTempTarget - 1.4,
      mode: mode as ZoneMode,
    };
  }, [baselineZone, currentZone, globalTempTarget, mode]);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
  }, []);

  const handleGlobalTempTargetChange = useCallback((value: number) => {
    setGlobalTempTarget(value);
  }, []);

  const handleRainChangeChange = useCallback((value: number) => {
    setRainChange(value);
  }, []);

  const handleSelectedYearChange = useCallback((value: number) => {
    setSelectedYear(value);
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!markerPosition) return;

    setIsSimulating(true);
    setShowResults(false);

    try {
      // Calculate delta for API (backend expects relative increase)
      const tempDelta = globalTempTarget - 1.4;

      const { data: responseData, error } = await supabase.functions.invoke('simulate-agriculture', {
        body: {
          lat: markerPosition.lat,
          lon: markerPosition.lng,
          crop: cropType,
          temp_increase: Math.round(tempDelta * 10) / 10,
          rain_change: rainChange,
        },
      });

      if (error) {
        throw new Error(error.message || 'Agriculture simulation failed');
      }

      const result = Array.isArray(responseData) ? responseData[0] : responseData;
      const analysis = result?.data?.analysis;
      const predictions = result?.data?.predictions;
      const apiChartData = result?.data?.chart_data;

      if (!analysis || !predictions) {
        throw new Error('Invalid response format from simulation API');
      }

      const yieldBaseline = predictions.standard_seed?.predicted_yield ?? 0;
      const yieldResilient = predictions.resilient_seed?.predicted_yield ?? 0;
      const avoidedLoss = analysis.avoided_loss ?? 0;
      const percentageImprovement = analysis.percentage_improvement ?? 0;
      
      // Extract resilience_score from API - this is the single source of truth
      // Look for resilience_score in multiple possible locations in the response
      const resilienceScore = 
        analysis.resilience_score ?? 
        predictions.resilient_seed?.resilience_score ?? 
        result?.data?.resilience_score ??
        result?.resilience_score ??
        null;
      
      // Use resilience_score as the unified yield potential (0-100 scale)
      const yieldPotential = resilienceScore !== null 
        ? Math.min(100, Math.max(0, resilienceScore)) 
        : Math.min(100, Math.max(0, yieldResilient));

      // Parse chart_data from API if available
      if (apiChartData) {
        const months = apiChartData.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const rainfallBaseline = apiChartData.rainfall_baseline || [];
        const rainfallProjected = apiChartData.rainfall_projected || [];
        const soilMoistureBaseline = apiChartData.soil_moisture_baseline || [];

        setChartData({
          rainfall: months.map((month: string, i: number) => ({
            month,
            historical: rainfallBaseline[i] ?? 0,
            projected: rainfallProjected[i] ?? 0,
          })),
          soilMoisture: months.map((month: string, i: number) => ({
            month,
            moisture: soilMoistureBaseline[i] ?? 0,
          })),
        });
      }

      setResults({
        avoidedLoss: Math.round(avoidedLoss * 100) / 100,
        riskReduction: Math.round(percentageImprovement * 100),
        yieldBaseline,
        yieldResilient,
        yieldPotential,
        monthlyData: mockMonthlyData,
      });
      setShowResults(true);
    } catch (error) {
      console.error('Simulation failed:', error);
      toast({
        title: 'Simulation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Unable to connect to the simulation server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  }, [markerPosition, cropType, globalTempTarget, rainChange]);

  const handleCoastalSimulate = useCallback(
    async (width: number) => {
      if (!markerPosition) return;

      setIsCoastalSimulating(true);

      try {
        const { data: responseData, error } = await supabase.functions.invoke('simulate-coastal', {
          body: {
            lat: markerPosition.lat,
            lon: markerPosition.lng,
            mangrove_width: width,
          },
        });

        if (error) {
          throw new Error(error.message || 'Coastal simulation failed');
        }

        const data = responseData.data;
        const rawSlope = data.slope;
        const rawStormWave = data.storm_wave;
        const rawAvoidedLoss = data.avoided_loss;

        setCoastalResults({
          avoidedLoss:
            rawAvoidedLoss !== null && Number.isFinite(rawAvoidedLoss)
              ? Math.round(rawAvoidedLoss * 100) / 100
              : 0,
          slope: rawSlope !== null ? Math.round(rawSlope * 10) / 10 : null,
          stormWave: rawStormWave !== null ? Math.round(rawStormWave * 10) / 10 : null,
        });
        setShowCoastalResults(true);
      } catch (error) {
        console.error('Coastal simulation failed:', error);
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
    },
    [markerPosition, propertyValue]
  );

  const getInterventionType = useCallback(() => {
    const selectedToolkits: string[] = [
      ...(greenRoofsEnabled ? ['Install Green Roofs'] : []),
      ...(permeablePavementEnabled ? ['Permeable Pavement'] : []),
    ];

    if (!selectedToolkits || selectedToolkits.length === 0) {
      return 'green_roof';
    }

    const toolkitsLower = selectedToolkits.map((t) => t.toLowerCase());

    if (toolkitsLower.some((t) => t.includes('green') && t.includes('roof'))) {
      return 'green_roof';
    }

    if (toolkitsLower.some((t) => t.includes('permeable') || t.includes('pavement'))) {
      return 'permeable_pavement';
    }

    if (toolkitsLower.some((t) => t.includes('bioswale'))) {
      return 'bioswales';
    }

    if (toolkitsLower.some((t) => t.includes('rain') && t.includes('garden'))) {
      return 'rain_gardens';
    }

    return 'green_roof';
  }, [greenRoofsEnabled, permeablePavementEnabled]);

  const handleFloodSimulate = useCallback(async () => {
    if (!markerPosition) return;

    setIsFloodSimulating(true);

    try {
      const intervention_type = getInterventionType();

      const payload = {
        rain_intensity: 100,
        current_imperviousness: 0.7,
        intervention_type,
        slope_pct: 2.0,
      };

      const { data: responseData, error } = await supabase.functions.invoke('simulate-flood', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Flood simulation failed');
      }

      const analysis = responseData.data?.analysis || responseData.analysis || responseData;
      const avoidedLoss = analysis.avoided_loss ?? 0;
      const floodDepthReduction = analysis.avoided_depth_cm ?? 0;

      setFloodResults({
        floodDepthReduction: Math.round(floodDepthReduction * 10) / 10,
        valueProtected: Math.round(avoidedLoss * 100) / 100,
      });
      setShowFloodResults(true);
    } catch (error) {
      console.error('Flood simulation failed:', error);
      const baseReduction = greenRoofsEnabled ? 8 : 0;
      const pavementReduction = permeablePavementEnabled ? 4 : 0;
      const totalReduction = baseReduction + pavementReduction;
      const protectedValue = buildingValue * (totalReduction / 100);

      setFloodResults({
        floodDepthReduction: totalReduction,
        valueProtected: Math.round(protectedValue),
      });
      setShowFloodResults(true);
      toast({
        title: 'Using Estimated Values',
        description: 'Could not reach the flood simulation API. Showing estimated values.',
        variant: 'default',
      });
    } finally {
      setIsFloodSimulating(false);
    }
  }, [markerPosition, buildingValue, greenRoofsEnabled, permeablePavementEnabled, getInterventionType]);

  const handleGreenRoofsChange = useCallback(
    (enabled: boolean) => {
      setGreenRoofsEnabled(enabled);
      if (markerPosition) {
        setTimeout(() => {
          handleFloodSimulate();
        }, 100);
      }
    },
    [markerPosition, handleFloodSimulate]
  );

  const handlePermeablePavementChange = useCallback(
    (enabled: boolean) => {
      setPermeablePavementEnabled(enabled);
      if (markerPosition) {
        setTimeout(() => {
          handleFloodSimulate();
        }, 100);
      }
    },
    [markerPosition, handleFloodSimulate]
  );

  const handleMangroveWidthChange = useCallback((value: number) => {
    setMangroveWidth(value);
  }, []);

  const handleMangroveWidthChangeEnd = useCallback(
    (value: number) => {
      if (markerPosition) {
        handleCoastalSimulate(value);
      }
    },
    [markerPosition, handleCoastalSimulate]
  );

  const handleModeChange = useCallback((newMode: DashboardMode) => {
    setMode(newMode);
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
    setSelectedYear(2026);
    setIsTimelinePlaying(false);
    setGlobalTempTarget(1.4);
    setRainChange(0);
  }, []);

  const handleViewStateChange = useCallback((newViewState: ViewState) => {
    setViewState(newViewState);
  }, []);

  const getCurrentSimulateHandler = useCallback(() => {
    if (mode === 'agriculture') return handleSimulate;
    if (mode === 'coastal') return () => handleCoastalSimulate(mangroveWidth);
    return handleFloodSimulate;
  }, [mode, handleSimulate, handleCoastalSimulate, handleFloodSimulate, mangroveWidth]);

  const isCurrentlySimulating =
    mode === 'agriculture'
      ? isSimulating
      : mode === 'coastal'
        ? isCoastalSimulating
        : isFloodSimulating;

  const showCurrentResults =
    mode === 'agriculture' ? showResults : mode === 'coastal' ? showCoastalResults : showFloodResults;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950">
      <div className="absolute inset-0 hex-grid-pattern pointer-events-none z-10" />

      <div className={`absolute inset-0 ${isSplitMode ? 'grid lg:grid-cols-2 grid-rows-2 lg:grid-rows-1' : ''}`}>
        <MapView
          onLocationSelect={handleLocationSelect}
          markerPosition={markerPosition}
          mapStyle={mapStyle}
          showFloodOverlay={showFloodOverlay}
          viewState={isSplitMode ? viewState : undefined}
          onViewStateChange={isSplitMode ? handleViewStateChange : undefined}
          scenarioLabel={isSplitMode ? 'Current Forecast' : undefined}
          zoneData={zoneData}
        />

        {isSplitMode && (
          <>
            <MapView
              onLocationSelect={handleLocationSelect}
              markerPosition={markerPosition}
              mapStyle={mapStyle}
              showFloodOverlay={showFloodOverlay}
              viewState={viewState}
              onViewStateChange={handleViewStateChange}
              scenarioLabel="With Adaptation"
              isAdaptationScenario={true}
              zoneData={zoneData}
            />

            <div className="absolute lg:left-1/2 lg:top-0 lg:bottom-0 top-1/2 left-0 right-0 -translate-y-1/2 lg:translate-y-0 z-20 pointer-events-none">
              <div className="lg:w-px lg:h-full h-px w-full bg-white/20 backdrop-blur-sm" />
            </div>
          </>
        )}
      </div>

      {/* User Menu - positioned above left panel */}
      <div className="hidden lg:block absolute top-4 left-6 z-40">
        <UserMenu />
      </div>

      {mode !== 'portfolio' && (
        <div className="hidden lg:block absolute top-16 left-6 z-30">
          <FloatingControlPanel
            mode={mode}
            onModeChange={handleModeChange}
            latitude={markerPosition?.lat ?? null}
            longitude={markerPosition?.lng ?? null}
            cropType={cropType}
            onCropChange={setCropType}
            mangroveWidth={mangroveWidth}
            onMangroveWidthChange={handleMangroveWidthChange}
            onMangroveWidthChangeEnd={handleMangroveWidthChangeEnd}
            propertyValue={propertyValue}
            onPropertyValueChange={setPropertyValue}
            buildingValue={buildingValue}
            onBuildingValueChange={setBuildingValue}
            greenRoofsEnabled={greenRoofsEnabled}
            onGreenRoofsChange={handleGreenRoofsChange}
            permeablePavementEnabled={permeablePavementEnabled}
            onPermeablePavementChange={handlePermeablePavementChange}
            canSimulate={canSimulate}
          />
        </div>
      )}

      {mode === 'portfolio' ? (
        <div className="hidden lg:block absolute top-16 left-6 bottom-20 z-30 w-80 overflow-y-auto">
          <PortfolioHeader onModeChange={handleModeChange} />
          <PortfolioPanel />
        </div>
      ) : (
        <div className="hidden lg:block absolute bottom-32 left-6 z-30">
          <SimulationPanel
            mode={mode}
            onSimulate={getCurrentSimulateHandler()}
            isSimulating={isCurrentlySimulating}
            canSimulate={canSimulate}
            globalTempTarget={globalTempTarget}
            onGlobalTempTargetChange={handleGlobalTempTargetChange}
            rainChange={rainChange}
            onRainChangeChange={handleRainChangeChange}
            selectedYear={selectedYear}
            onSelectedYearChange={handleSelectedYearChange}
            yieldPotential={showResults ? results.yieldPotential : null}
          />
        </div>
      )}

      {mode !== 'portfolio' && (
        <div className="hidden lg:block absolute bottom-32 left-[344px] xl:left-[360px] z-30 max-w-[180px]">
          <ZoneLegend
            baselineZone={baselineZone}
            currentZone={currentZone}
            mode={mode as ZoneMode}
            temperature={globalTempTarget - 1.4}
            visible={!!baselineZone && !!currentZone}
          />
        </div>
      )}

      <MobileMenu
        mode={mode}
        onModeChange={handleModeChange}
        latitude={markerPosition?.lat ?? null}
        longitude={markerPosition?.lng ?? null}
        cropType={cropType}
        onCropChange={setCropType}
        mangroveWidth={mangroveWidth}
        onMangroveWidthChange={handleMangroveWidthChange}
        onMangroveWidthChangeEnd={handleMangroveWidthChangeEnd}
        propertyValue={propertyValue}
        onPropertyValueChange={setPropertyValue}
        buildingValue={buildingValue}
        onBuildingValueChange={setBuildingValue}
        greenRoofsEnabled={greenRoofsEnabled}
        onGreenRoofsChange={handleGreenRoofsChange}
        permeablePavementEnabled={permeablePavementEnabled}
        onPermeablePavementChange={handlePermeablePavementChange}
        canSimulate={canSimulate}
        onSimulate={getCurrentSimulateHandler()}
        isSimulating={isCurrentlySimulating}
        globalTempTarget={globalTempTarget}
        onGlobalTempTargetChange={handleGlobalTempTargetChange}
        rainChange={rainChange}
        onRainChangeChange={handleRainChangeChange}
        selectedYear={selectedYear}
        onSelectedYearChange={handleSelectedYearChange}
        yieldPotential={showResults ? results.yieldPotential : null}
      />

      <div className={`absolute top-4 z-40 flex items-center gap-2 ${
        isSplitMode 
          ? 'right-4 sm:right-16 lg:right-16' 
          : 'right-16 lg:right-20'
      }`}>
        {/* Mobile UserMenu - hidden on desktop since it's in the left panel area */}
        <div className="lg:hidden">
          <UserMenu />
        </div>
        <Button
          className="bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3 py-2 lg:px-4 h-auto shadow-lg text-[11px] sm:text-xs lg:text-sm"
          onClick={() => setIsSplitMode(!isSplitMode)}
        >
          {isSplitMode ? (
            <>
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xl:inline">Exit Comparison</span>
              <span className="xl:hidden">Exit</span>
            </>
          ) : (
            <>
              <Columns2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xl:inline">Compare Scenarios</span>
              <span className="xl:hidden">Compare</span>
            </>
          )}
        </Button>
      </div>

      {mode !== 'portfolio' && (
        <div className="absolute bottom-28 sm:bottom-24 lg:bottom-32 right-4 sm:right-6 lg:right-20 left-4 sm:left-auto z-30 flex flex-col gap-2 sm:gap-3 max-w-full sm:max-w-none sm:w-80 lg:w-80">
          <ResultsPanel
            mode={mode}
            visible={showCurrentResults}
            isLoading={isCurrentlySimulating}
            agricultureResults={
              mode === 'agriculture'
                ? {
                    avoidedLoss: results.avoidedLoss,
                    riskReduction: results.riskReduction,
                    yieldPotential: results.yieldPotential,
                    monthlyData: results.monthlyData,
                  }
                : undefined
            }
            coastalResults={mode === 'coastal' ? coastalResults : undefined}
            floodResults={mode === 'flood' ? floodResults : undefined}
            mangroveWidth={mangroveWidth}
            greenRoofsEnabled={greenRoofsEnabled}
            permeablePavementEnabled={permeablePavementEnabled}
            tempIncrease={globalTempTarget - 1.4}
            rainChange={rainChange}
          />

          <AnalyticsHighlightsCard
            visible={showCurrentResults && !isCurrentlySimulating}
            mode={mode}
            latitude={markerPosition?.lat ?? null}
            longitude={markerPosition?.lng ?? null}
            temperature={globalTempTarget - 1.4}
            cropType={cropType}
            mangroveWidth={mangroveWidth}
            greenRoofsEnabled={greenRoofsEnabled}
            permeablePavementEnabled={permeablePavementEnabled}
            agricultureResults={
              mode === 'agriculture'
                ? { avoidedLoss: results.avoidedLoss, riskReduction: results.riskReduction }
                : undefined
            }
            coastalResults={mode === 'coastal' ? coastalResults : undefined}
            floodResults={mode === 'flood' ? floodResults : undefined}
            chartData={mode === 'agriculture' ? chartData : null}
            rainChange={rainChange}
          />
        </div>
      )}

      <TimelinePlayer
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        isPlaying={isTimelinePlaying}
        onPlayToggle={() => setIsTimelinePlaying((prev) => !prev)}
        isSplitMode={isSplitMode}
      />
    </div>
  );
};

export default Index;
