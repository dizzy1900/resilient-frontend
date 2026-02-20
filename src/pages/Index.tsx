import { useState, useCallback, useMemo, useEffect } from 'react';
import { MapView, MapStyle, ViewState, ZoneData, PortfolioMapAsset, FlyToTarget } from '@/components/dashboard/MapView';
import { AtlasClickData } from '@/components/dashboard/AtlasMarkers';
import { DashboardMode } from '@/components/dashboard/ModeSelector';
import { HealthResults } from '@/components/hud/HealthResultsPanel';
import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel';
import { PortfolioAsset } from '@/components/portfolio/PortfolioCSVUpload';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { InterventionWizardModal, ProjectParams } from '@/components/hud/InterventionWizardModal';
import { DefensiveInfrastructureModal, DefensiveProjectParams } from '@/components/hud/DefensiveInfrastructureModal';
import { toast } from '@/hooks/use-toast';
import { Polygon } from '@/utils/polygonMath';
import { generateIrregularZone, ZoneMode } from '@/utils/zoneGeneration';
import { calculateZoneAtTemperature } from '@/utils/zoneMorphing';
import { supabase } from '@/integrations/supabase/clientSafe';
import { findClosestAtlasItem } from '@/utils/atlasFallback';
import { LeftPanel } from '@/components/layout/LeftPanel';
import { RightPanel } from '@/components/layout/RightPanel';
import { DigitalTwinOverlay } from '@/components/dashboard/DigitalTwinOverlay';
import { DigitalTwinToggle } from '@/components/dashboard/DigitalTwinToggle';
import { DrawnPolygon } from '@/components/dashboard/DrawControl';
import { useMapboxGeocoder } from '@/hooks/useMapboxGeocoder';
import { PortfolioAnalysisResult } from '@/types/portfolio';

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
  const [isFinanceSimulating, setIsFinanceSimulating] = useState(false);
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
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'controls' | 'data'>('controls');
  // Finance mode: track current atlas item's financial data
  const [atlasFinancialData, setAtlasFinancialData] = useState<any>(null);
  const [atlasLocationName, setAtlasLocationName] = useState<string | null>(null);
  const [atlasMonteCarloData, setAtlasMonteCarloData] = useState<any>(null);
  const [atlasExecutiveSummary, setAtlasExecutiveSummary] = useState<string | null>(null);
  const [atlasSensitivityData, setAtlasSensitivityData] = useState<{
    primary_driver: string;
    driver_impact_pct: number;
    baseline_npv?: number;
    sensitivity_ranking?: { driver: string; shocked_npv: number; impact_pct: number }[];
  } | null>(null);
  const [atlasAdaptationStrategy, setAtlasAdaptationStrategy] = useState<any>(null);
  const [atlasSatellitePreview, setAtlasSatellitePreview] = useState<any>(null);
  const [atlasMarketIntelligence, setAtlasMarketIntelligence] = useState<any>(null);
  const [atlasTemporalAnalysis, setAtlasTemporalAnalysis] = useState<any>(null);
  const [atlasAdaptationPortfolio, setAtlasAdaptationPortfolio] = useState<any>(null);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 37.9062,
    latitude: -0.0236,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  });

  const [selectedYear, setSelectedYear] = useState(2026);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [atlasOverlay, setAtlasOverlay] = useState<'default' | 'credit_rating' | 'financial_risk'>('default');

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
  const [portfolioResults, setPortfolioResults] = useState<PortfolioAnalysisResult | null>(null);
  const [selectedPolygon, setSelectedPolygon] = useState<DrawnPolygon | null>(null);
  const [polygonExposurePct, setPolygonExposurePct] = useState<number | null>(null);
  const [reverseLocationName, setReverseLocationName] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<FlyToTarget | null>(null);
  const { reverseGeocode } = useMapboxGeocoder();

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
    if (mode !== 'portfolio') return [];
    const fromApi = portfolioResults?.asset_results;
    if (fromApi?.length) {
      return fromApi.map((a) => ({
        lat: a.lat,
        lng: a.lon,
        name: a.name ?? `Asset`,
        value: a.value ?? a.value_at_risk ?? 0,
        resilienceScore: a.resilience_score,
      }));
    }
    if (portfolioAssets.length === 0) return [];
    return portfolioAssets.map((a) => ({
      lat: a.Lat,
      lng: a.Lon,
      name: a.Name,
      value: a.Value,
    }));
  }, [mode, portfolioAssets, portfolioResults]);

  const fitBoundsTarget = useMemo(() => {
    const assets = portfolioResults?.asset_results;
    if (!assets?.length) return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const a of assets) {
      minLat = Math.min(minLat, a.lat);
      maxLat = Math.max(maxLat, a.lat);
      minLng = Math.min(minLng, a.lon);
      maxLng = Math.max(maxLng, a.lon);
    }
    const pad = 0.1;
    const sw: [number, number] = [minLng - pad, minLat - pad];
    const ne: [number, number] = [maxLng + pad, maxLat + pad];
    return [sw, ne] as [[number, number], [number, number]];
  }, [portfolioResults]);

  useEffect(() => {
    if (portfolioResults != null && mode === 'portfolio') setIsPanelOpen(true);
  }, [portfolioResults, mode]);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
    setShowHealthResults(false);
    setIsPanelOpen(true);
    setMobileSheetOpen(true);
    setMobileTab('data');
    setReverseLocationName(null);
    reverseGeocode(lat, lng).then((name) => {
      if (name) setReverseLocationName(name);
    });
  }, [reverseGeocode]);

  const handleLocationSearch = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
    setShowHealthResults(false);
    setIsPanelOpen(true);
    setMobileSheetOpen(true);
    setMobileTab('data');
    // Directly update controlled viewState for guaranteed camera movement
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom: 12,
    }));
    setReverseLocationName(null);
    reverseGeocode(lat, lng).then((name) => {
      if (name) setReverseLocationName(name);
    });
  }, [reverseGeocode]);

  const handlePolygonCreated = useCallback((polygon: DrawnPolygon) => {
    setSelectedPolygon(polygon);
    setPolygonExposurePct(null);
    const coords = polygon.coordinates[0];
    if (coords.length > 0) {
      let sumLng = 0, sumLat = 0;
      for (const c of coords) {
        sumLng += c[0];
        sumLat += c[1];
      }
      const centroidLat = sumLat / coords.length;
      const centroidLng = sumLng / coords.length;
      setMarkerPosition({ lat: centroidLat, lng: centroidLng });
      setIsPanelOpen(true);
    }
  }, []);

  const handlePolygonDeleted = useCallback(() => {
    setSelectedPolygon(null);
    setPolygonExposurePct(null);
  }, []);

  // Finance simulation handler
  const handleFinanceSimulate = useCallback(async () => {
    if (!markerPosition) return;
    setIsFinanceSimulating(true);
    setAtlasFinancialData(null); // Clear to show loading

    try {
      let polygonPromise: Promise<any> | null = null;
      if (selectedPolygon) {
        polygonPromise = supabase.functions.invoke('simulate-polygon', {
          body: {
            geometry: selectedPolygon,
            mode: 'finance',
            crop: cropType,
          },
        });
      }

      const { data: responseData, error } = await supabase.functions.invoke('simulate-finance', {
        body: {
          lat: markerPosition.lat,
          lon: markerPosition.lng,
          crop: cropType,
        },
      });

      if (polygonPromise) {
        try {
          const { data: polyData } = await polygonPromise;
          const exposure = polyData?.fractional_exposure_pct ?? polyData?.data?.fractional_exposure_pct;
          if (exposure != null) setPolygonExposurePct(Math.round(exposure * 10) / 10);
        } catch { /* polygon call is best-effort */ }
      }

      if (error) throw new Error(error.message || 'Finance simulation failed');

      const result = Array.isArray(responseData) ? responseData[0] : responseData;
      const financialAnalysis = result?.financial_analysis ?? result?.data?.financial_analysis ?? result;

      setAtlasFinancialData(financialAnalysis);
      setAtlasLocationName(`${markerPosition.lat.toFixed(2)}, ${markerPosition.lng.toFixed(2)}`);
      setIsPanelOpen(true);
    } catch (error) {
      console.error('Finance simulation failed:', error);
      if (error instanceof Error) {
        console.error('Finance error details:', error.message, error.stack);
      }

      const fallback = markerPosition ? findClosestAtlasItem(markerPosition.lat, markerPosition.lng, 'agriculture') : null;
      if (fallback) {
        const item = fallback as any;
        setAtlasFinancialData(item.financial_analysis ?? null);
        setAtlasLocationName(item.target?.name ?? `${markerPosition!.lat.toFixed(2)}, ${markerPosition!.lng.toFixed(2)}`);
        setAtlasMonteCarloData(item.monte_carlo_analysis ?? null);
        setAtlasExecutiveSummary(item.executive_summary ?? null);
        setAtlasSensitivityData(item.sensitivity_analysis ?? null);
        setAtlasAdaptationStrategy(item.adaptation_strategy ?? null);
        setAtlasSatellitePreview(item.satellite_preview ?? null);
        setAtlasMarketIntelligence(item.market_intelligence ?? null);
        setAtlasTemporalAnalysis(item.temporal_analysis ?? null);
        setAtlasAdaptationPortfolio(item.adaptation_portfolio ?? null);
        setIsPanelOpen(true);
        toast({
          title: 'Live API failed, falling back to cached Atlas data',
          description: `Showing pre-calculated financial data from ${item.target?.name ?? 'nearest location'}.`,
        });
      } else {
        setAtlasFinancialData(null);
        toast({
          title: 'Finance Simulation Failed',
          description: error instanceof Error ? error.message : 'Unable to connect. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsFinanceSimulating(false);
    }
  }, [markerPosition, cropType, selectedPolygon]);

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
      setIsPanelOpen(true);
    } catch (error) {
      console.error('Agriculture simulation failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }

      const fallback = markerPosition ? findClosestAtlasItem(markerPosition.lat, markerPosition.lng, 'agriculture') : null;
      if (fallback) {
        const crop = (fallback as any).crop_analysis;
        setResults({
          avoidedLoss: crop?.avoided_loss_pct ?? 0,
          riskReduction: Math.round((crop?.percentage_improvement ?? 0) * 100),
          yieldBaseline: crop?.standard_yield_pct ?? 0,
          yieldResilient: crop?.resilient_yield_pct ?? 0,
          yieldPotential: crop?.resilient_yield_pct ?? null,
          portfolioVolatilityPct: null,
          monthlyData: mockMonthlyData,
        });
        if ((fallback as any).climate_conditions) {
          const cc = (fallback as any).climate_conditions;
          const baseRain = (cc.rainfall_mm ?? 1200) / 12;
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const sf = [0.6, 0.7, 0.9, 1.1, 1.3, 1.4, 1.3, 1.2, 1.0, 0.8, 0.7, 0.6];
          setChartData({
            rainfall: months.map((m, i) => ({ month: m, historical: Math.round(baseRain * sf[i]), projected: Math.round(baseRain * sf[i] * (1 + (cc.rain_pct_change ?? 0) / 100)) })),
            soilMoisture: months.map((m, i) => ({ month: m, moisture: Math.round(40 + 20 * sf[i]) })),
          });
        }
        setShowResults(true);
        setIsPanelOpen(true);
        toast({
          title: 'Live API failed, falling back to cached Atlas data',
          description: `Showing pre-calculated results from ${(fallback as any).target?.name ?? 'nearest location'}.`,
        });
      } else {
        toast({
          title: 'Simulation Failed',
          description: error instanceof Error ? error.message : 'Unable to connect to the simulation server.',
          variant: 'destructive',
        });
      }
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

        let polygonPromise: Promise<any> | null = null;
        if (selectedPolygon) {
          polygonPromise = supabase.functions.invoke('simulate-polygon', {
            body: {
              geometry: selectedPolygon,
              mode: 'coastal',
              sea_level_rise: totalSLR,
              mangrove_width: mangroveWidth,
            },
          });
        }

        const { data: responseData, error } = await supabase.functions.invoke('simulate-coastal', {
          body: {
            lat: markerPosition.lat,
            lon: markerPosition.lng,
            mangrove_width: mangroveWidth,
            slr_projection: totalSLR,
            include_storm_surge: includeStormSurge,
          },
        });

        if (polygonPromise) {
          try {
            const { data: polyData } = await polygonPromise;
            const exposure = polyData?.fractional_exposure_pct ?? polyData?.data?.fractional_exposure_pct;
            if (exposure != null) setPolygonExposurePct(Math.round(exposure * 10) / 10);
          } catch { /* polygon call is best-effort */ }
        }

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
        setIsPanelOpen(true);
      } catch (error) {
        console.error('Coastal simulation failed:', error);
        if (error instanceof Error) {
          console.error('Coastal error details:', error.message, error.stack);
        }
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
        setIsPanelOpen(true);
        toast({
          title: 'Live API failed, falling back to cached Atlas data',
          description: 'Showing estimated coastal values from local calculations.',
        });
      } finally {
        setIsCoastalSimulating(false);
      }
    },
    [markerPosition, propertyValue, mangroveWidth, totalSLR, includeStormSurge, selectedPolygon]
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
        rain_intensity: 100 + totalRainIntensity,
        current_imperviousness: 0.7,
        intervention_type,
        slope_pct: 2.0,
        lat: markerPosition.lat,
        lon: markerPosition.lng,
        rain_intensity_pct: totalRainIntensity,
      };

      let polygonPromise: Promise<any> | null = null;
      if (selectedPolygon) {
        polygonPromise = supabase.functions.invoke('simulate-polygon', {
          body: {
            geometry: selectedPolygon,
            mode: 'flood',
            rain_intensity: payload.rain_intensity,
            rain_intensity_pct: totalRainIntensity,
            current_imperviousness: 0.7,
            intervention_type,
          },
        });
      }

      const { data: responseData, error } = await supabase.functions.invoke('simulate-flood', {
        body: payload,
      });

      if (polygonPromise) {
        try {
          const { data: polyData } = await polygonPromise;
          const exposure = polyData?.fractional_exposure_pct ?? polyData?.data?.fractional_exposure_pct;
          if (exposure != null) setPolygonExposurePct(Math.round(exposure * 10) / 10);
        } catch { /* polygon call is best-effort */ }
      }

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
      setIsPanelOpen(true);
    } catch (error) {
      console.error('Flood simulation failed:', error);
      if (error instanceof Error) {
        console.error('Flood error details:', error.message, error.stack);
      }
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
      setIsPanelOpen(true);
      toast({
        title: 'Live API failed, falling back to cached Atlas data',
        description: 'Showing estimated flood values from local calculations.',
      });
    } finally {
      setIsFloodSimulating(false);
    }
  }, [markerPosition, buildingValue, greenRoofsEnabled, permeablePavementEnabled, getInterventionType, totalRainIntensity, selectedPolygon]);

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
    setFloodSelectedYear(2026);
    setTotalRainIntensity(9);
    setIsFloodUserOverride(false);
    setIsPanelOpen(false);
  }, []);

  const handleAtlasClick = useCallback((data: AtlasClickData) => {
    const item = data.item as any;

    // 1. Set marker position
    setMarkerPosition({ lat: data.lat, lng: data.lng });
    setIsPanelOpen(true);

    // Store financial data for Finance mode
    setAtlasFinancialData(item.financial_analysis ?? null);
    setAtlasLocationName(item.target?.name ?? null);
    setAtlasMonteCarloData(item.monte_carlo_analysis ?? null);
    setAtlasExecutiveSummary(item.executive_summary ?? null);
    setAtlasSensitivityData(item.sensitivity_analysis ?? null);
    setAtlasAdaptationStrategy(item.adaptation_strategy ?? null);
    setAtlasSatellitePreview(item.satellite_preview ?? null);
    setAtlasMarketIntelligence(item.market_intelligence ?? null);
    setAtlasTemporalAnalysis(item.temporal_analysis ?? null);
    setAtlasAdaptationPortfolio(item.adaptation_portfolio ?? null);

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
      if (error instanceof Error) {
        console.error('Health error details:', error.message, error.stack);
      }
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
        title: 'Live API failed, falling back to cached Atlas data',
        description: 'Showing estimated health values from local calculations.',
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
    <div className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--cb-bg)' }}>
      <div className="absolute inset-0">
        {isSplitMode ? (
          <DigitalTwinOverlay
            leftMap={
              <MapView
                onLocationSelect={handleLocationSelect}
                markerPosition={markerPosition}
                mapStyle={mapStyle}
                showFloodOverlay={showFloodOverlay}
                viewState={viewState}
                onViewStateChange={handleViewStateChange}
                flyToTarget={flyToTarget}
                scenarioLabel="Baseline"
                zoneData={zoneData}
                portfolioAssets={portfolioMapAssets}
                onAtlasClick={handleAtlasClick}
                atlasOverlay={atlasOverlay}
                fitBoundsTarget={fitBoundsTarget}
                usePortfolioAccentStyle={!!portfolioResults}
              />
            }
            rightMap={
              <MapView
                onLocationSelect={handleLocationSelect}
                markerPosition={markerPosition}
                mapStyle={mapStyle}
                showFloodOverlay={showFloodOverlay}
                viewState={viewState}
                onViewStateChange={handleViewStateChange}
                flyToTarget={flyToTarget}
                scenarioLabel="With Adaptation"
                isAdaptationScenario={true}
                zoneData={zoneData}
              />
            }
          />
        ) : (
          <MapView
            onLocationSelect={handleLocationSelect}
            markerPosition={markerPosition}
            mapStyle={mapStyle}
            showFloodOverlay={showFloodOverlay}
            viewState={viewState}
            onViewStateChange={handleViewStateChange}
            flyToTarget={flyToTarget}
            zoneData={zoneData}
            portfolioAssets={portfolioMapAssets}
            onAtlasClick={handleAtlasClick}
            atlasOverlay={atlasOverlay}
            fitBoundsTarget={fitBoundsTarget}
            usePortfolioAccentStyle={!!portfolioResults}
            drawEnabled={true}
            onPolygonCreated={handlePolygonCreated}
            onPolygonDeleted={handlePolygonDeleted}
          />
        )}
      </div>

      <DigitalTwinToggle isSplitMode={isSplitMode} onToggle={() => setIsSplitMode(!isSplitMode)} />

      {/* Desktop Left Panel */}
      <LeftPanel
        mode={mode}
        onModeChange={handleModeChange}
        latitude={markerPosition?.lat ?? null}
        longitude={markerPosition?.lng ?? null}
        hasPolygon={selectedPolygon !== null}
        locationName={reverseLocationName}
        onLocationSearch={handleLocationSearch}
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
          if (!enabled && !drainageEnabled) setDefensiveProjectParams(null);
        }}
        drainageEnabled={drainageEnabled}
        onDrainageChange={(enabled) => {
          setDrainageEnabled(enabled);
          if (enabled && !defensiveProjectParams) {
            setDefensiveProjectParams({ type: 'drainage', capex: 500000, opex: 10000, capacityUpgrade: 20 });
          }
          if (!enabled && !seaWallEnabled) setDefensiveProjectParams(null);
        }}
        onOpenDefensiveWizard={(type) => {
          setDefensiveProjectType(type);
          setShowDefensiveWizard(true);
        }}
        workforceSize={workforceSize}
        onWorkforceSizeChange={setWorkforceSize}
        averageDailyWage={averageDailyWage}
        onAverageDailyWageChange={setAverageDailyWage}
        isSplitMode={isSplitMode}
        onToggleSplitMode={() => setIsSplitMode(!isSplitMode)}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        isPlaying={isTimelinePlaying}
        onPlayToggle={() => setIsTimelinePlaying((prev) => !prev)}
        isFinanceSimulating={isFinanceSimulating}
        onFinanceSimulate={handleFinanceSimulate}
        atlasOverlay={atlasOverlay}
        onAtlasOverlayChange={setAtlasOverlay}
        globalTempTarget={globalTempTarget}
        onGlobalTempTargetChange={handleGlobalTempTargetChange}
        rainChange={rainChange}
        onRainChangeChange={handleRainChangeChange}
        onAgricultureSimulate={getCurrentSimulateHandler()}
        isAgricultureSimulating={isCurrentlySimulating}
        yieldPotential={showResults ? results.yieldPotential : null}
        totalRainIntensity={totalRainIntensity}
        onTotalRainIntensityChange={setTotalRainIntensity}
        floodSelectedYear={floodSelectedYear}
        onFloodSelectedYearChange={setFloodSelectedYear}
        isFloodUserOverride={isFloodUserOverride}
        onFloodUserOverrideChange={setIsFloodUserOverride}
        onFloodSimulate={handleFloodSimulate}
        isFloodSimulating={isFloodSimulating}
        totalSLR={totalSLR}
        onTotalSLRChange={setTotalSLR}
        includeStormSurge={includeStormSurge}
        onIncludeStormSurgeChange={setIncludeStormSurge}
        coastalSelectedYear={coastalSelectedYear}
        onCoastalSelectedYearChange={setCoastalSelectedYear}
        onCoastalSimulate={handleCoastalSimulate}
        isCoastalSimulating={isCoastalSimulating}
        healthTempTarget={healthTempTarget}
        onHealthTempTargetChange={setHealthTempTarget}
        healthSelectedYear={healthSelectedYear}
        onHealthSelectedYearChange={setHealthSelectedYear}
        onHealthSimulate={handleHealthSimulate}
        isHealthSimulating={isHealthSimulating}
        onPortfolioResultsChange={setPortfolioResults}
      />

      {/* Desktop Right Panel — simulation results */}
      <RightPanel
        visible={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        mode={mode}
        locationName={atlasLocationName}
        latitude={markerPosition?.lat ?? null}
        longitude={markerPosition?.lng ?? null}
        isLoading={isCurrentlySimulating || (mode === 'finance' && isFinanceSimulating)}
        showResults={showCurrentResults || showHealthResults}
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
        healthResults={healthResults}
        mangroveWidth={mangroveWidth}
        greenRoofsEnabled={greenRoofsEnabled}
        permeablePavementEnabled={permeablePavementEnabled}
        tempIncrease={globalTempTarget - 1.4}
        rainChange={rainChange}
        baselineZone={baselineZone}
        currentZone={currentZone}
        globalTempTarget={globalTempTarget}
        spatialAnalysis={mode === 'agriculture' ? spatialAnalysis : null}
        isSpatialLoading={mode === 'agriculture' && isSpatialLoading}
        cropType={cropType}
        portfolioAssets={portfolioAssets}
        atlasFinancialData={atlasFinancialData}
        atlasMonteCarloData={atlasMonteCarloData}
        atlasExecutiveSummary={atlasExecutiveSummary}
        atlasSensitivityData={atlasSensitivityData}
        atlasAdaptationStrategy={atlasAdaptationStrategy}
        atlasSatellitePreview={atlasSatellitePreview}
        atlasMarketIntelligence={atlasMarketIntelligence}
        atlasTemporalAnalysis={atlasTemporalAnalysis}
        atlasAdaptationPortfolio={atlasAdaptationPortfolio}
        isFinanceSimulating={isFinanceSimulating}
        chartData={mode === 'agriculture' ? chartData : null}
        projectParams={mode === 'agriculture' ? projectParams : null}
        defensiveProjectParams={(mode === 'coastal' || mode === 'flood') ? defensiveProjectParams : null}
        assetLifespan={assetLifespan}
        dailyRevenue={dailyRevenue}
        propertyValue={mode === 'coastal' ? propertyValue : buildingValue}
        polygonExposurePct={polygonExposurePct}
        portfolioResults={portfolioResults}
      />

      {/* Portfolio left panel content (desktop) */}
      {mode === 'portfolio' && (
        <div
          className="hidden md:flex absolute top-0 left-[360px] h-full flex-col z-20 border-r overflow-y-auto"
          style={{ width: 280, backgroundColor: 'var(--cb-bg)', borderColor: 'var(--cb-border)' }}
        >
          <PortfolioHeader onModeChange={handleModeChange} />
          <PortfolioPanel onAssetsChange={setPortfolioAssets} />
        </div>
      )}

      <MobileBottomSheet
        isOpen={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        mode={mode}
        onModeChange={handleModeChange}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        isPlaying={isTimelinePlaying}
        onPlayToggle={() => setIsTimelinePlaying((p) => !p)}
        isSplitMode={isSplitMode}
        modeContentProps={{
          cropType,
          onCropChange: setCropType,
          localMangroveWidth: mangroveWidth,
          handleMangroveChange: (v: number[]) => handleMangroveWidthChange(v[0]),
          canSimulate,
          seaWallEnabled,
          onSeaWallChange: (enabled) => {
            setSeaWallEnabled(enabled);
            if (enabled && !defensiveProjectParams) {
              setDefensiveProjectParams({ type: 'sea_wall', capex: 500000, opex: 10000, heightIncrease: 1.0 });
            }
            if (!enabled && !drainageEnabled) setDefensiveProjectParams(null);
          },
          drainageEnabled,
          onDrainageChange: (enabled) => {
            setDrainageEnabled(enabled);
            if (enabled && !defensiveProjectParams) {
              setDefensiveProjectParams({ type: 'drainage', capex: 500000, opex: 10000, capacityUpgrade: 20 });
            }
            if (!enabled && !seaWallEnabled) setDefensiveProjectParams(null);
          },
          onOpenDefensiveWizard: (type) => {
            setDefensiveProjectType(type);
            setShowDefensiveWizard(true);
          },
          buildingValue,
          onBuildingValueChange: setBuildingValue,
          dailyRevenue,
          onDailyRevenueChange: setDailyRevenue,
          assetLifespan,
          onAssetLifespanChange: setAssetLifespan,
          greenRoofsEnabled,
          onGreenRoofsChange: handleGreenRoofsChange,
          permeablePavementEnabled,
          onPermeablePavementChange: handlePermeablePavementChange,
          workforceSize,
          onWorkforceSizeChange: setWorkforceSize,
          averageDailyWage,
          onAverageDailyWageChange: setAverageDailyWage,
          onOpenInterventionWizard: () => setShowWizard(true),
          isFinanceSimulating,
          onFinanceSimulate: handleFinanceSimulate,
          globalTempTarget,
          onGlobalTempTargetChange: handleGlobalTempTargetChange,
          rainChange,
          onRainChangeChange: handleRainChangeChange,
          onAgricultureSimulate: getCurrentSimulateHandler(),
          isAgricultureSimulating: isCurrentlySimulating,
          yieldPotential: showResults ? results.yieldPotential : null,
          totalRainIntensity,
          onTotalRainIntensityChange: setTotalRainIntensity,
          floodSelectedYear,
          onFloodSelectedYearChange: setFloodSelectedYear,
          isFloodUserOverride,
          onFloodUserOverrideChange: setIsFloodUserOverride,
          onFloodSimulate: handleFloodSimulate,
          isFloodSimulating,
          totalSLR,
          onTotalSLRChange: setTotalSLR,
          includeStormSurge,
          onIncludeStormSurgeChange: setIncludeStormSurge,
          coastalSelectedYear,
          onCoastalSelectedYearChange: setCoastalSelectedYear,
          onCoastalSimulate: handleCoastalSimulate,
          isCoastalSimulating,
          healthTempTarget,
          onHealthTempTargetChange: setHealthTempTarget,
          healthSelectedYear,
          onHealthSelectedYearChange: setHealthSelectedYear,
          onHealthSimulate: handleHealthSimulate,
          isHealthSimulating,
          onPortfolioResultsChange: setPortfolioResults,
          propertyValue,
          onPropertyValueChange: setPropertyValue,
          selectedYear,
        }}
        rightPanelContentProps={{
          locationName: atlasLocationName,
          latitude: markerPosition?.lat ?? null,
          longitude: markerPosition?.lng ?? null,
          isLoading: isCurrentlySimulating || (mode === 'finance' && isFinanceSimulating),
          showResults: showCurrentResults || showHealthResults,
          agricultureResults: mode === 'agriculture' ? {
            avoidedLoss: results.avoidedLoss,
            riskReduction: results.riskReduction,
            yieldPotential: results.yieldPotential,
            monthlyData: results.monthlyData,
          } : undefined,
          coastalResults: mode === 'coastal' ? coastalResults : undefined,
          floodResults: mode === 'flood' ? floodResults : undefined,
          healthResults,
          mangroveWidth,
          greenRoofsEnabled,
          permeablePavementEnabled,
          tempIncrease: globalTempTarget - 1.4,
          rainChange,
          baselineZone,
          currentZone,
          globalTempTarget,
          spatialAnalysis: mode === 'agriculture' ? spatialAnalysis : null,
          isSpatialLoading: mode === 'agriculture' && isSpatialLoading,
          cropType,
          portfolioAssets,
          atlasFinancialData,
          atlasMonteCarloData,
          atlasExecutiveSummary,
          atlasSensitivityData,
          atlasAdaptationStrategy,
          atlasSatellitePreview,
          atlasMarketIntelligence,
          atlasTemporalAnalysis,
          atlasAdaptationPortfolio,
          isFinanceSimulating,
          chartData: mode === 'agriculture' ? chartData : null,
          projectParams: mode === 'agriculture' ? projectParams : null,
          defensiveProjectParams: (mode === 'coastal' || mode === 'flood') ? defensiveProjectParams : null,
          assetLifespan,
          dailyRevenue,
          propertyValue: mode === 'coastal' ? propertyValue : buildingValue,
          polygonExposurePct,
          portfolioResults,
        }}
      />

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
          if (markerPosition) {
            if (mode === 'coastal') setTimeout(() => handleCoastalSimulate(), 100);
            else if (mode === 'flood') setTimeout(() => handleFloodSimulate(), 100);
          }
        }}
        isSimulating={isCoastalSimulating || isFloodSimulating}
      />
    </div>
  );
};

export default Index;
