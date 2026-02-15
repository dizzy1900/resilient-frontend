import { useState, useCallback, useMemo, useEffect } from 'react';
import { MapView, MapStyle, ViewState, ZoneData, PortfolioMapAsset } from '@/components/dashboard/MapView';
import { AtlasClickData } from '@/components/dashboard/AtlasMarkers';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { TimelinePlayer } from '@/components/TimelinePlayer';
import { FloatingControlPanel } from '@/components/hud/FloatingControlPanel';
import { SimulationPanel } from '@/components/hud/SimulationPanel';
import { FloodSimulationPanel } from '@/components/hud/FloodSimulationPanel';
import { CoastalSimulationPanel } from '@/components/hud/CoastalSimulationPanel';
import { HealthSimulationPanel } from '@/components/hud/HealthSimulationPanel';
import { HealthResultsPanel, HealthResults } from '@/components/hud/HealthResultsPanel';
import { ResultsPanel } from '@/components/hud/ResultsPanel';
import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel';
import { PortfolioAsset } from '@/components/portfolio/PortfolioCSVUpload';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioResultsPanel } from '@/components/portfolio/PortfolioResultsPanel';
import { MobileMenu } from '@/components/hud/MobileMenu';
import { ZoneLegend } from '@/components/dashboard/ZoneLegend';
import { UrbanInundationCard } from '@/components/dashboard/UrbanInundationCard';
import { InfrastructureRiskCard } from '@/components/dashboard/InfrastructureRiskCard';
import { AnalyticsHighlightsCard } from '@/components/hud/AnalyticsHighlightsCard';
import { UserMenu } from '@/components/auth/UserMenu';
import { FinancialSettingsModal } from '@/components/hud/FinancialSettingsModal';
import { InterventionWizardModal, ProjectParams } from '@/components/hud/InterventionWizardModal';
import { DefensiveInfrastructureModal, DefensiveProjectParams } from '@/components/hud/DefensiveInfrastructureModal';
import { toast } from '@/hooks/use-toast';
import { Columns2, X } from 'lucide-react';
import { DealTicketCard } from '@/components/hud/DealTicketCard';
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

// Generate fallback storm chart data based on SLR
const generateFallbackStormChartData = (slr: number) => {
  // Base surge heights for different return periods (in meters)
  const baseSurges = {
    '1yr': 0.5,
    '10yr': 1.2,
    '50yr': 2.0,
    '100yr': 2.8,
  };

  return Object.entries(baseSurges).map(([period, currentDepth]) => ({
    period,
    current_depth: currentDepth,
    future_depth: currentDepth + slr, // SLR adds to future surge depth
  }));
};

const Index = () => {
  const [mode, setMode] = useState<DashboardMode>('agriculture');
  const [cropType, setCropType] = useState('maize');
  const [mangroveWidth, setMangroveWidth] = useState(100);
  const [propertyValue, setPropertyValue] = useState(5000000);
  const [buildingValue, setBuildingValue] = useState(5000000);
  const [greenRoofsEnabled, setGreenRoofsEnabled] = useState(false);
  const [permeablePavementEnabled, setPermeablePavementEnabled] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Intervention Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [projectParams, setProjectParams] = useState<ProjectParams | null>(null);

  // Defensive Infrastructure state
  const [showDefensiveWizard, setShowDefensiveWizard] = useState(false);
  const [defensiveProjectType, setDefensiveProjectType] = useState<'sea_wall' | 'drainage'>('sea_wall');
  const [defensiveProjectParams, setDefensiveProjectParams] = useState<DefensiveProjectParams | null>(null);
  const [seaWallEnabled, setSeaWallEnabled] = useState(false);
  const [drainageEnabled, setDrainageEnabled] = useState(false);

  // Asset valuation state
  const [assetLifespan, setAssetLifespan] = useState(30);
  const [dailyRevenue, setDailyRevenue] = useState(20000);

  const [isCoastalSimulating, setIsCoastalSimulating] = useState(false);
  const [isFloodSimulating, setIsFloodSimulating] = useState(false);
  const [isHealthSimulating, setIsHealthSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCoastalResults, setShowCoastalResults] = useState(false);
  const [showFloodResults, setShowFloodResults] = useState(false);
  const [showHealthResults, setShowHealthResults] = useState(false);

  // Health mode state
  const [workforceSize, setWorkforceSize] = useState(100);
  const [averageDailyWage, setAverageDailyWage] = useState(15);
  const [healthSelectedYear, setHealthSelectedYear] = useState(2026);
  const [healthTempTarget, setHealthTempTarget] = useState(1.4);
  const [healthResults, setHealthResults] = useState<HealthResults | null>(null);
  const [isSplitMode, setIsSplitMode] = useState(false);
  // Finance mode: track current atlas item's financial data
  const [atlasFinancialData, setAtlasFinancialData] = useState<any>(null);
  const [atlasLocationName, setAtlasLocationName] = useState<string | null>(null);
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
    portfolioVolatilityPct: null as number | null, // Supply chain volatility CV%
    monthlyData: mockMonthlyData,
  });

  const [coastalResults, setCoastalResults] = useState<{
    avoidedLoss: number;
    slope: number | null;
    stormWave: number | null;
    isUnderwater?: boolean;
    floodDepth?: number | null;
    seaLevelRise?: number;
    includeStormSurge?: boolean;
    stormChartData?: Array<{ period: string; current_depth: number; future_depth: number }>;
    floodedUrbanKm2?: number | null;
    urbanImpactPct?: number | null;
  }>({
    avoidedLoss: 0,
    slope: null,
    stormWave: null,
    isUnderwater: undefined,
    floodDepth: null,
    floodedUrbanKm2: null,
    urbanImpactPct: null,
  });

  // Coastal-specific state (calibrated to Year 2000 baseline)
  const [totalSLR, setTotalSLR] = useState(0.10); // Default: 2026 value (includes 2000-2026 rise)
  const [includeStormSurge, setIncludeStormSurge] = useState(false);
  const [coastalSelectedYear, setCoastalSelectedYear] = useState(2026);

  // Flood-specific state
  const [totalRainIntensity, setTotalRainIntensity] = useState(9); // Default: 9% (2026 baseline)
  const [floodSelectedYear, setFloodSelectedYear] = useState(2026);
  const [isFloodUserOverride, setIsFloodUserOverride] = useState(false);

  const [floodResults, setFloodResults] = useState({
    floodDepthReduction: 0,
    valueProtected: 0,
    riskIncreasePct: null as number | null,
    futureFloodAreaKm2: null as number | null,
    rainChartData: null as Array<{ month: string; historical: number; projected: number }> | null,
    future100yr: null as number | null,
    baseline100yr: null as number | null,
  });

  // Spatial analysis data from API (for Viable Growing Area card)
  const [spatialAnalysis, setSpatialAnalysis] = useState<{
    baseline_sq_km: number;
    future_sq_km: number;
    loss_pct: number;
  } | null>(null);
  const [isSpatialLoading, setIsSpatialLoading] = useState(false);
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);

  const mapStyle: MapStyle = mode === 'coastal' ? 'satellite' : mode === 'flood' ? 'flood' : 'dark';
  const showFloodOverlay = mode === 'flood' && markerPosition !== null;
  const canSimulate = markerPosition !== null;

  useEffect(() => {
    if (markerPosition && ['agriculture', 'coastal', 'flood', 'portfolio'].includes(mode)) {
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

  const portfolioMapAssets: PortfolioMapAsset[] = useMemo(() => {
    if (mode !== 'portfolio' || portfolioAssets.length === 0) return [];
    return portfolioAssets.map((a) => ({
      lat: a.Lat,
      lng: a.Lon,
      name: a.Name,
      value: a.Value,
    }));
  }, [mode, portfolioAssets]);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
    setShowHealthResults(false);
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
    setIsSpatialLoading(true);
    setShowResults(false);
    setSpatialAnalysis(null);

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
          ...(projectParams ? {
            project_params: {
              capex: projectParams.capex,
              opex: projectParams.opex,
              yield_benefit: projectParams.yieldBenefit,
              crop_price: projectParams.cropPrice,
            },
          } : {}),
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

      // Parse spatial_analysis from API if available
      const apiSpatialAnalysis = result?.data?.spatial_analysis;
      if (apiSpatialAnalysis) {
        setSpatialAnalysis({
          baseline_sq_km: apiSpatialAnalysis.baseline_sq_km ?? 0,
          future_sq_km: apiSpatialAnalysis.future_sq_km ?? 0,
          loss_pct: apiSpatialAnalysis.loss_pct ?? 0,
        });
      }
      setIsSpatialLoading(false);

      // Extract portfolio_volatility_pct from API if available
      const apiVolatility = analysis.portfolio_volatility_pct ?? result?.data?.portfolio_volatility_pct ?? null;

      setResults({
        avoidedLoss: Math.round(avoidedLoss * 100) / 100,
        riskReduction: Math.round(percentageImprovement * 100),
        yieldBaseline,
        yieldResilient,
        yieldPotential,
        portfolioVolatilityPct: apiVolatility !== null ? apiVolatility : Math.round(15 + (globalTempTarget - 1.4) * 10), // Fallback estimate
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
      setIsSpatialLoading(false);
    }
  }, [markerPosition, cropType, globalTempTarget, rainChange, projectParams]);

  const handleWizardRunAnalysis = useCallback((params: ProjectParams) => {
    setProjectParams(params);
    setShowWizard(false);
    // Trigger simulation with the new params
    if (markerPosition) {
      // Small delay to let state update
      setTimeout(() => {
        handleSimulate();
      }, 100);
    }
  }, [markerPosition, handleSimulate]);

  const handleCoastalSimulate = useCallback(
    async () => {
      if (!markerPosition) return;

      setIsCoastalSimulating(true);

      try {
        // Calculate total water level for the API (totalSLR already includes 2000-2026 rise)
        const stormSurgeHeight = includeStormSurge ? 2.5 : 0;
        const totalWaterLevel = totalSLR + stormSurgeHeight;

        const { data: responseData, error } = await supabase.functions.invoke('simulate-coastal', {
          body: {
            lat: markerPosition.lat,
            lon: markerPosition.lng,
            mangrove_width: mangroveWidth,
            slr_projection: totalSLR, // Send totalSLR directly (vs Year 2000 baseline)
            include_storm_surge: includeStormSurge,
          },
        });

        if (error) {
          throw new Error(error.message || 'Coastal simulation failed');
        }

        const data = responseData.data;
        const rawSlope = data.slope;
        const rawStormWave = data.storm_wave;
        const rawAvoidedLoss = data.avoided_loss;
        const rawIsUnderwater = data.is_underwater;
        const rawFloodDepth = data.flood_depth;
        const rawStormChartData = data.storm_chart_data;
        const rawFloodedUrbanKm2 = data.flooded_urban_km2;
        const rawUrbanImpactPct = data.urban_impact_pct;

        // Generate fallback storm chart data if API doesn't provide it
        const stormChartData = rawStormChartData ?? generateFallbackStormChartData(totalSLR);

        // Generate fallback urban inundation data based on SLR if API doesn't provide it
        const floodedUrbanKm2 = rawFloodedUrbanKm2 ?? (totalSLR > 0 ? totalSLR * 12.5 : 0);
        const urbanImpactPct = rawUrbanImpactPct ?? (totalSLR > 0 ? Math.min(totalSLR * 15, 100) : 0);

        setCoastalResults({
          avoidedLoss:
            rawAvoidedLoss !== null && Number.isFinite(rawAvoidedLoss)
              ? Math.round(rawAvoidedLoss * 100) / 100
              : 0,
          slope: rawSlope !== null ? Math.round(rawSlope * 10) / 10 : null,
          stormWave: rawStormWave !== null ? Math.round(rawStormWave * 10) / 10 : null,
          isUnderwater: rawIsUnderwater ?? (totalWaterLevel > 1.5),
          floodDepth: rawFloodDepth ?? (totalWaterLevel > 1.5 ? totalWaterLevel - 1.5 : null),
          seaLevelRise: totalSLR,
          includeStormSurge,
          stormChartData,
          floodedUrbanKm2,
          urbanImpactPct,
        });
        setShowCoastalResults(true);
      } catch (error) {
        console.error('Coastal simulation failed:', error);
        // Fallback calculation
        const stormSurgeHeight = includeStormSurge ? 2.5 : 0;
        const totalWaterLevel = totalSLR + stormSurgeHeight;
        const isUnderwater = totalWaterLevel > 1.5;
        
        // Fallback urban inundation data
        const floodedUrbanKm2 = totalSLR > 0 ? totalSLR * 12.5 : 0;
        const urbanImpactPct = totalSLR > 0 ? Math.min(totalSLR * 15, 100) : 0;
        
        setCoastalResults({
          avoidedLoss: Math.round(propertyValue * (mangroveWidth / 500) * 0.5),
          slope: null,
          stormWave: null,
          isUnderwater,
          floodDepth: isUnderwater ? totalWaterLevel - 1.5 : null,
          seaLevelRise: totalSLR,
          includeStormSurge,
          stormChartData: generateFallbackStormChartData(totalSLR),
          floodedUrbanKm2,
          urbanImpactPct,
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
    [markerPosition, propertyValue, mangroveWidth, totalSLR, includeStormSurge]
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

      // New payload with lat, lon, and rain_intensity_pct from timeline
      const payload = {
        rain_intensity: 100 + totalRainIntensity, // Base 100mm + % increase
        current_imperviousness: 0.7,
        intervention_type,
        slope_pct: 2.0,
        // Additional context for API
        lat: markerPosition.lat,
        lon: markerPosition.lng,
        rain_intensity_pct: totalRainIntensity,
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
      const riskIncreasePct = analysis.risk_increase_pct ?? null;
      const futureFloodAreaKm2 = analysis.future_flood_area_km2 ?? null;

      // Extract rain chart data from analytics
      const analytics = responseData.data?.analytics || responseData.analytics;
      const rainChartData = analytics?.rain_chart_data ?? null;
      const future100yr = analytics?.future_100yr ?? null;
      const baseline100yr = analytics?.baseline_100yr ?? null;

      setFloodResults({
        floodDepthReduction: Math.round(floodDepthReduction * 10) / 10,
        valueProtected: Math.round(avoidedLoss * 100) / 100,
        riskIncreasePct: riskIncreasePct !== null ? Math.round(riskIncreasePct * 10) / 10 : null,
        futureFloodAreaKm2: futureFloodAreaKm2 !== null ? Math.round(futureFloodAreaKm2 * 100) / 100 : null,
        rainChartData,
        future100yr,
        baseline100yr,
      });
      setShowFloodResults(true);
    } catch (error) {
      console.error('Flood simulation failed:', error);
      const baseReduction = greenRoofsEnabled ? 8 : 0;
      const pavementReduction = permeablePavementEnabled ? 4 : 0;
      const totalReduction = baseReduction + pavementReduction;
      const protectedValue = buildingValue * (totalReduction / 100);

      // Fallback calculations based on rain intensity
      const riskIncreasePct = totalRainIntensity > 10 ? (totalRainIntensity - 10) * 3 : 0;
      const futureFloodAreaKm2 = 2.5 + (totalRainIntensity / 100) * 5;

      // Generate fallback rain chart data
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const baseRain = [45, 50, 80, 120, 95, 30, 15, 20, 55, 90, 110, 60];
      const fallbackRainChart = months.map((month, i) => ({
        month,
        historical: baseRain[i],
        projected: Math.round(baseRain[i] * (1 + totalRainIntensity / 100)),
      }));
      const fallbackBaseline100yr = 185;
      const fallbackFuture100yr = Math.round(fallbackBaseline100yr * (1 + totalRainIntensity / 100));

      setFloodResults({
        floodDepthReduction: totalReduction,
        valueProtected: Math.round(protectedValue),
        riskIncreasePct,
        futureFloodAreaKm2,
        rainChartData: fallbackRainChart,
        future100yr: fallbackFuture100yr,
        baseline100yr: fallbackBaseline100yr,
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
  }, [markerPosition, buildingValue, greenRoofsEnabled, permeablePavementEnabled, getInterventionType, totalRainIntensity]);

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
    (_value: number) => {
      if (markerPosition) {
        handleCoastalSimulate();
      }
    },
    [markerPosition, handleCoastalSimulate]
  );

  const handleModeChange = useCallback((newMode: DashboardMode) => {
    setMode(newMode);
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
    setShowHealthResults(false);
    setSelectedYear(2026);
    setIsTimelinePlaying(false);
    setGlobalTempTarget(1.4);
    setRainChange(0);
    // Reset flood-specific state
    setFloodSelectedYear(2026);
    setTotalRainIntensity(9);
    setIsFloodUserOverride(false);
  }, []);

  const handleAtlasClick = useCallback((data: AtlasClickData) => {
    const item = data.item as any;

    // 1. Set marker position
    setMarkerPosition({ lat: data.lat, lng: data.lng });

    // Store financial data for Finance mode
    setAtlasFinancialData(item.financial_analysis ?? null);
    setAtlasLocationName(item.target?.name ?? null);

    // 2. Switch mode
    const modeMap: Record<string, DashboardMode> = {
      agriculture: 'agriculture',
      coastal: 'coastal',
      flood: 'flood',
      health: 'health',
    };
    const newMode = modeMap[data.projectType] ?? 'agriculture';
    setMode(newMode);

    // Reset all result flags first
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
    setShowHealthResults(false);

    // 3. Pre-fill inputs & instantly populate results from JSON (zero-latency)
    if (data.projectType === 'agriculture') {
      if (data.cropType) setCropType(data.cropType);
      const crop = item.crop_analysis;
      const fin = item.financial_analysis;
      if (fin?.assumptions?.capex) setPropertyValue(fin.assumptions.capex);

      setResults({
        avoidedLoss: crop?.avoided_loss_pct ?? 0,
        riskReduction: Math.round((crop?.percentage_improvement ?? 0) * 100),
        yieldBaseline: crop?.standard_yield_pct ?? 0,
        yieldResilient: crop?.resilient_yield_pct ?? 0,
        yieldPotential: crop?.resilient_yield_pct ?? null,
        portfolioVolatilityPct: null,
        monthlyData: mockMonthlyData,
      });

      // Generate synthetic chart data from climate conditions
      if (item.climate_conditions) {
        const baseRain = (item.climate_conditions.rainfall_mm ?? 1200) / 12;
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const seasonalFactors = [0.6, 0.7, 0.9, 1.1, 1.3, 1.4, 1.3, 1.2, 1.0, 0.8, 0.7, 0.6];
        setChartData({
          rainfall: months.map((month, i) => ({
            month,
            historical: Math.round(baseRain * seasonalFactors[i]),
            projected: Math.round(baseRain * seasonalFactors[i] * (1 + (item.climate_conditions.rain_pct_change ?? 0) / 100)),
          })),
          soilMoisture: months.map((month, i) => ({
            month,
            moisture: Math.round(40 + 20 * seasonalFactors[i]),
          })),
        });
      }

      setShowResults(true);
    }

    if (data.projectType === 'coastal') {
      const ic = item.input_conditions;
      const fr = item.flood_risk;
      if (ic?.slr_projection_m != null) setTotalSLR(ic.slr_projection_m);
      if (ic?.include_surge != null) setIncludeStormSurge(ic.include_surge);
      if (ic?.mangrove_width_m != null) setMangroveWidth(ic.mangrove_width_m);
      setCoastalSelectedYear(item.scenario_year ?? 2050);

      // Generate storm chart data from SLR
      const slr = ic?.slr_projection_m ?? 1.0;
      const stormChartData = [
        { period: '1yr', current_depth: 0.5, future_depth: 0.5 + slr },
        { period: '10yr', current_depth: 1.2, future_depth: 1.2 + slr },
        { period: '50yr', current_depth: 2.0, future_depth: 2.0 + slr },
        { period: '100yr', current_depth: 2.8, future_depth: 2.8 + slr },
      ];

      setCoastalResults({
        avoidedLoss: 0,
        slope: null,
        stormWave: ic?.surge_m ?? 2.5,
        isUnderwater: fr?.is_underwater ?? false,
        floodDepth: fr?.flood_depth_m ?? 0,
        seaLevelRise: slr,
        includeStormSurge: ic?.include_surge ?? true,
        stormChartData,
        floodedUrbanKm2: slr > 0 ? slr * 12.5 : 0,
        urbanImpactPct: slr > 0 ? Math.min(slr * 15, 100) : 0,
      });
      setShowCoastalResults(true);
    }

    if (data.projectType === 'flood') {
      const ic = item.input_conditions;
      const ffa = item.flash_flood_analysis;
      const rf = item.rainfall_frequency;
      if (ic?.rain_intensity_increase_pct != null) {
        setTotalRainIntensity(ic.rain_intensity_increase_pct);
        setIsFloodUserOverride(true);
      }
      setFloodSelectedYear(item.scenario_year ?? 2050);

      // Extract 100yr values from rain chart data
      const rainData = rf?.rain_chart_data;
      const entry100yr = rainData?.find((d: any) => d.period === '100yr');

      setFloodResults({
        floodDepthReduction: 0,
        valueProtected: 0,
        riskIncreasePct: ffa?.risk_increase_pct ?? null,
        futureFloodAreaKm2: ffa?.future_flood_area_km2 ?? null,
        rainChartData: null,
        future100yr: entry100yr?.future_mm ?? null,
        baseline100yr: entry100yr?.baseline_mm ?? null,
      });
      setShowFloodResults(true);
    }

    if (data.projectType === 'health') {
      const pa = item.productivity_analysis;
      const mr = item.malaria_risk;
      const ei = item.economic_impact;
      const wp = item.workforce_parameters;
      const cc = item.climate_conditions;

      if (wp?.workforce_size) setWorkforceSize(wp.workforce_size);
      if (wp?.daily_wage_usd) setAverageDailyWage(wp.daily_wage_usd);
      setHealthSelectedYear(item.scenario_year ?? 2050);

      setHealthResults({
        productivity_loss_pct: pa?.productivity_loss_pct ?? 0,
        economic_loss_daily: ei?.total_economic_impact?.daily_loss_average ?? 0,
        wbgt: pa?.wbgt_estimate ?? 0,
        projected_temp: cc?.temperature_c ?? 0,
        malaria_risk: (mr?.risk_category as 'High' | 'Medium' | 'Low') ?? 'Low',
        dengue_risk: 'Low',
        workforce_size: wp?.workforce_size ?? 100,
        daily_wage: wp?.daily_wage_usd ?? 15,
      });
      setShowHealthResults(true);
    }

    // 4. Fly the map to the clicked location
    setViewState((prev) => ({
      ...prev,
      longitude: data.lng,
      latitude: data.lat,
      zoom: 8,
    }));

    toast({
      title: item.target.name,
      description: `${data.projectType.charAt(0).toUpperCase() + data.projectType.slice(1)} scenario loaded with pre-calculated results.`,
    });
  }, []);

  const handleViewStateChange = useCallback((newViewState: ViewState) => {
    setViewState(newViewState);
  }, []);

  // Health simulation handler
  const handleHealthSimulate = useCallback(async () => {
    if (!markerPosition) return;
    setIsHealthSimulating(true);
    setShowHealthResults(false);

    try {
      const tempDelta = healthTempTarget - 1.4;
      const { data: responseData, error } = await supabase.functions.invoke('predict-health', {
        body: {
          lat: markerPosition.lat,
          lon: markerPosition.lng,
          workforce_size: workforceSize,
          daily_wage: averageDailyWage,
          temp_increase: tempDelta,
        },
      });

      if (error) throw new Error(error.message || 'Health simulation failed');

      setHealthResults(responseData.data);
      setShowHealthResults(true);
    } catch (error) {
      console.error('Health simulation failed:', error);
      // Fallback
      const baseTemp = 28 + (Math.abs(markerPosition.lat) < 15 ? 4 : markerPosition.lat < 25 ? 2 : 0);
      const projTemp = baseTemp + (healthTempTarget - 1.4);
      const wbgt = projTemp * 0.7 + 8;
      const loss = Math.min(50, Math.max(0, Math.round((wbgt - 25) * 5)));
      setHealthResults({
        productivity_loss_pct: loss,
        economic_loss_daily: Math.round(workforceSize * averageDailyWage * (loss / 100)),
        wbgt: Math.round(wbgt * 10) / 10,
        projected_temp: Math.round(projTemp * 10) / 10,
        malaria_risk: Math.abs(markerPosition.lat) < 25 && projTemp >= 25 ? 'High' : 'Low',
        dengue_risk: Math.abs(markerPosition.lat) < 35 && projTemp >= 25 ? 'High' : 'Low',
        workforce_size: workforceSize,
        daily_wage: averageDailyWage,
      });
      setShowHealthResults(true);
      toast({
        title: 'Using Estimated Values',
        description: 'Could not reach health API. Showing estimated values.',
        variant: 'default',
      });
    } finally {
      setIsHealthSimulating(false);
    }
  }, [markerPosition, workforceSize, averageDailyWage, healthTempTarget]);

  const getCurrentSimulateHandler = useCallback(() => {
    if (mode === 'agriculture') return handleSimulate;
    if (mode === 'coastal') return handleCoastalSimulate;
    if (mode === 'health') return handleHealthSimulate;
    return handleFloodSimulate;
  }, [mode, handleSimulate, handleCoastalSimulate, handleFloodSimulate, handleHealthSimulate]);

  const isCurrentlySimulating =
    mode === 'agriculture'
      ? isSimulating
      : mode === 'coastal'
        ? isCoastalSimulating
        : mode === 'health'
          ? isHealthSimulating
          : isFloodSimulating;

  const showCurrentResults =
    mode === 'agriculture' ? showResults
    : mode === 'coastal' ? showCoastalResults
    : mode === 'health' ? showHealthResults
    : showFloodResults;

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
          portfolioAssets={portfolioMapAssets}
          onAtlasClick={handleAtlasClick}
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
      <div className="hidden lg:flex absolute top-4 left-6 z-40 items-center gap-2">
        <UserMenu />
        <FinancialSettingsModal />
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
            onOpenInterventionWizard={() => setShowWizard(true)}
            assetLifespan={assetLifespan}
            onAssetLifespanChange={setAssetLifespan}
            dailyRevenue={dailyRevenue}
            onDailyRevenueChange={setDailyRevenue}
            seaWallEnabled={seaWallEnabled}
            onSeaWallChange={(enabled) => {
              setSeaWallEnabled(enabled);
              if (enabled && !defensiveProjectParams) {
                setDefensiveProjectParams({ type: 'sea_wall', capex: 500000, opex: 10000, heightIncrease: 1.0 });
              }
              if (!enabled && !drainageEnabled) {
                setDefensiveProjectParams(null);
              }
            }}
            drainageEnabled={drainageEnabled}
            onDrainageChange={(enabled) => {
              setDrainageEnabled(enabled);
              if (enabled && !defensiveProjectParams) {
                setDefensiveProjectParams({ type: 'drainage', capex: 500000, opex: 10000, capacityUpgrade: 20 });
              }
              if (!enabled && !seaWallEnabled) {
                setDefensiveProjectParams(null);
              }
            }}
            onOpenDefensiveWizard={(type) => {
              setDefensiveProjectType(type);
              setShowDefensiveWizard(true);
            }}
            workforceSize={workforceSize}
            onWorkforceSizeChange={setWorkforceSize}
            averageDailyWage={averageDailyWage}
            onAverageDailyWageChange={setAverageDailyWage}
          />
        </div>
      )}

      {mode === 'portfolio' ? (
        <div className="hidden lg:block absolute top-16 left-6 bottom-20 z-30 w-80 overflow-y-auto">
          <PortfolioHeader onModeChange={handleModeChange} />
          <PortfolioPanel onAssetsChange={setPortfolioAssets} />
        </div>
      ) : mode === 'coastal' ? (
        <div className="hidden lg:block absolute bottom-32 left-6 z-30">
          <CoastalSimulationPanel
            onSimulate={handleCoastalSimulate}
            isSimulating={isCoastalSimulating}
            canSimulate={canSimulate}
            totalSLR={totalSLR}
            onTotalSLRChange={setTotalSLR}
            includeStormSurge={includeStormSurge}
            onIncludeStormSurgeChange={setIncludeStormSurge}
            selectedYear={coastalSelectedYear}
            onSelectedYearChange={setCoastalSelectedYear}
            propertyValue={propertyValue}
            onPropertyValueChange={setPropertyValue}
            dailyRevenue={dailyRevenue}
            onDailyRevenueChange={setDailyRevenue}
            assetLifespan={assetLifespan}
            onAssetLifespanChange={setAssetLifespan}
          />
        </div>
      ) : mode === 'flood' ? (
        <div className="hidden lg:block absolute bottom-32 left-6 z-30">
          <FloodSimulationPanel
            onSimulate={handleFloodSimulate}
            isSimulating={isFloodSimulating}
            canSimulate={canSimulate}
            totalRainIntensity={totalRainIntensity}
            onTotalRainIntensityChange={setTotalRainIntensity}
            selectedYear={floodSelectedYear}
            onSelectedYearChange={setFloodSelectedYear}
            isUserOverride={isFloodUserOverride}
            onUserOverrideChange={setIsFloodUserOverride}
          />
        </div>
      ) : mode === 'health' ? (
        <div className="hidden lg:block absolute bottom-32 left-6 z-30">
          <HealthSimulationPanel
            onSimulate={handleHealthSimulate}
            isSimulating={isHealthSimulating}
            canSimulate={canSimulate}
            globalTempTarget={healthTempTarget}
            onGlobalTempTargetChange={setHealthTempTarget}
            selectedYear={healthSelectedYear}
            onSelectedYearChange={setHealthSelectedYear}
          />
        </div>
      ) : mode === 'finance' ? null : (
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

      {mode !== 'portfolio' && mode !== 'finance' && (
        <div className="hidden lg:block absolute bottom-32 left-[344px] xl:left-[360px] z-30 max-w-[200px]">
          {mode === 'coastal' ? (
            <UrbanInundationCard
              visible={showCoastalResults}
              isLoading={isCoastalSimulating}
              floodedUrbanKm2={coastalResults.floodedUrbanKm2 ?? null}
              urbanImpactPct={coastalResults.urbanImpactPct ?? null}
            />
          ) : mode === 'flood' ? (
            <InfrastructureRiskCard
              visible={showFloodResults}
              isLoading={isFloodSimulating}
              floodedKm2={floodResults.futureFloodAreaKm2}
              riskPct={floodResults.riskIncreasePct}
            />
          ) : (
            <ZoneLegend
              baselineZone={baselineZone}
              currentZone={currentZone}
              mode={mode as ZoneMode}
              temperature={globalTempTarget - 1.4}
              visible={!!baselineZone && !!currentZone}
              spatialAnalysis={mode === 'agriculture' ? spatialAnalysis : null}
              isSpatialLoading={mode === 'agriculture' && isSpatialLoading}
            />
          )}
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

      {mode === 'portfolio' ? (
        <div className="absolute top-16 right-4 sm:right-6 lg:right-20 z-30 flex flex-col gap-2 sm:gap-3 sm:w-80 lg:w-80 max-h-[calc(100vh-120px)] overflow-y-auto">
          <PortfolioResultsPanel
            assets={portfolioAssets}
            visible={portfolioAssets.some(a => 'score' in a)}
          />
        </div>
      ) : mode === 'finance' ? (
        <div className="absolute top-16 right-4 sm:right-6 lg:right-20 z-30 sm:w-80 lg:w-96">
          <DealTicketCard
            financialData={atlasFinancialData}
            locationName={atlasLocationName}
          />
        </div>
      ) : (
        <div className="absolute bottom-28 sm:bottom-24 lg:bottom-32 right-4 sm:right-6 lg:right-20 left-4 sm:left-auto z-30 flex flex-col gap-2 sm:gap-3 max-w-full sm:max-w-none sm:w-80 lg:w-80">
          {mode === 'health' ? (
            <HealthResultsPanel
              visible={showHealthResults}
              isLoading={isHealthSimulating}
              results={healthResults ?? undefined}
            />
          ) : (
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
          )}

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
            portfolioVolatilityPct={mode === 'agriculture' ? results.portfolioVolatilityPct : null}
            adaptationActive={mode === 'agriculture' && projectParams !== null}
            coastalResults={mode === 'coastal' ? coastalResults : undefined}
            floodResults={mode === 'flood' ? floodResults : undefined}
            chartData={mode === 'agriculture' ? chartData : null}
            rainChange={rainChange}
            projectParams={mode === 'agriculture' ? projectParams : null}
            defensiveProjectParams={(mode === 'coastal' || mode === 'flood') ? defensiveProjectParams : null}
            assetLifespan={assetLifespan}
            dailyRevenue={dailyRevenue}
            propertyValue={mode === 'coastal' ? propertyValue : buildingValue}
          />
        </div>
      )}

      <InterventionWizardModal
        open={showWizard}
        onOpenChange={setShowWizard}
        onRunAnalysis={handleWizardRunAnalysis}
        isSimulating={isSimulating}
        cropType={cropType}
      />

      <DefensiveInfrastructureModal
        open={showDefensiveWizard}
        onOpenChange={setShowDefensiveWizard}
        projectType={defensiveProjectType}
        onDefineProject={(params) => {
          setDefensiveProjectParams(params);
          setShowDefensiveWizard(false);
          // Trigger re-simulation
          if (markerPosition) {
            if (mode === 'coastal') {
              setTimeout(() => handleCoastalSimulate(), 100);
            } else if (mode === 'flood') {
              setTimeout(() => handleFloodSimulate(), 100);
            }
          }
        }}
        isSimulating={isCoastalSimulating || isFloodSimulating}
      />

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
