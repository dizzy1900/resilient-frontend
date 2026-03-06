import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MapView, MapStyle, ViewState, ZoneData, PortfolioMapAsset, FlyToTarget } from '@/components/dashboard/MapView';
import { useScenarioStore, ScenarioParams } from '@/store/useScenarioStore';
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
import { findClosestAtlasItem } from '@/utils/atlasFallback';
import { fetchWithRetry } from '@/utils/api';
import { LeftPanel } from '@/components/layout/LeftPanel';
import { RightPanel } from '@/components/layout/RightPanel';
import { DigitalTwinOverlay } from '@/components/dashboard/DigitalTwinOverlay';
import { DigitalTwinToggle } from '@/components/dashboard/DigitalTwinToggle';
import { DrawnPolygon } from '@/components/dashboard/DrawControl';
import { useMapboxGeocoder } from '@/hooks/useMapboxGeocoder';
import { useGeolocateIP } from '@/hooks/useGeolocateIP';
import { PortfolioAnalysisResult } from '@/types/portfolio';
import { CommandPalette } from '@/components/CommandPalette';

/** Live Railway FastAPI backend for Finance module (CBA + CVaR). */
const financeBaseUrl = 'https://web-production-8ff9e.up.railway.app';
const cbaEndpoint = `${financeBaseUrl}/api/v1/finance/cba-series`;
const cvarEndpoint = `${financeBaseUrl}/api/v1/finance/cvar-simulation`;

/** Live Railway FastAPI backend for Health module (predict-health). */
const healthBaseUrl = 'https://web-production-8ff9e.up.railway.app';
const healthEndpoint = `${healthBaseUrl}/predict-health`;

/** Live Railway FastAPI backend for Polygon / Digital Twin simulation (no "data" wrapper). */
const geoBaseUrl = 'https://web-production-8ff9e.up.railway.app';
const polygonEndpoint = `${geoBaseUrl.replace(/\/+$/, '')}/simulate/polygon`;

/** Earth Observation NDVI endpoint (Google Earth Engine). */
const eoBaseUrl = 'https://web-production-8ff9e.up.railway.app';
const ndviEndpoint = `${eoBaseUrl.replace(/\/+$/, '')}/api/v1/eo/ndvi`;

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
  const [currentCrop, setCurrentCrop] = useState('Maize');
  const [proposedCrop, setProposedCrop] = useState('None');
  const [mangroveWidth, setMangroveWidth] = useState(100);
  const [propertyValue, setPropertyValue] = useState(5000000);
  const [buildingValue, setBuildingValue] = useState(5000000);
  const [greenRoofsEnabled, setGreenRoofsEnabled] = useState(false);
  const [permeablePavementEnabled, setPermeablePavementEnabled] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const markerPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ndviData, setNdviData] = useState<any[]>([]);
  const [isNdviLoading, setIsNdviLoading] = useState(false);

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
  const [baseAnnualOpex, setBaseAnnualOpex] = useState(25000);
  const [dailyRevenue, setDailyRevenue] = useState(20000);
  const [expectedDowntimeDays, setExpectedDowntimeDays] = useState(14);

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
  const [healthIntervention, setHealthIntervention] = useState<'none' | 'hvac_retrofit' | 'passive_cooling' | 'urban_cooling_center' | 'mosquito_eradication' | 'hospital_expansion'>('none');
  const [coolingCapex, setCoolingCapex] = useState(150000);
  const [coolingOpex, setCoolingOpex] = useState(15000);
  const [populationSize, setPopulationSize] = useState(100000);
  const [gdpPerCapita, setGdpPerCapita] = useState(8500);
  const [economyTier, setEconomyTier] = useState<string>('middle');
  const [customBedsPer1000, setCustomBedsPer1000] = useState<number | null>(null);
  const [isSplitMode, setIsSplitMode] = useState(false);

  // Scenario results for Digital Twin comparative analysis
  const [scenarioAgriResults, setScenarioAgriResults] = useState<typeof results | null>(null);
  const [scenarioCoastalResults, setScenarioCoastalResults] = useState<typeof coastalResults | null>(null);
  const [scenarioFloodResults, setScenarioFloodResults] = useState<typeof floodResults | null>(null);
  const [scenarioHealthResults, setScenarioHealthResults] = useState<HealthResults | null>(null);
  const scenarioStore = useScenarioStore();
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
    transitionCapex: 0 as number | null,
    riskReduction: 0,
    yieldBaseline: 0,
    yieldResilient: 0,
    yieldPotential: null as number | null,
    portfolioVolatilityPct: null as number | null,
    avoidedRevenueLoss: null as number | null,
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
    avoidedBusinessInterruption?: number | null;
    adjustedOpex?: number | null;
    opexClimatePenalty?: number | null;
    adjustedLifespan?: number | null;
  }>({
    avoidedLoss: 0,
    slope: null,
    stormWave: null,
    isUnderwater: undefined,
    floodDepth: null,
    floodedUrbanKm2: null,
    urbanImpactPct: null,
    avoidedBusinessInterruption: null,
    adjustedLifespan: null,
    opexClimatePenalty: null,
    adjustedOpex: null,
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
    avoidedBusinessInterruption: null as number | null,
    adjustedOpex: null as number | null,
    opexClimatePenalty: null as number | null,
    adjustedLifespan: null as number | null,
  });

  // Keep markerPosition ref in sync (avoids stale closures in simulate handlers)
  useEffect(() => {
    markerPositionRef.current = markerPosition;
  }, [markerPosition]);

  // Ref so payload always uses current toggle state (avoids stale closure when toggles trigger re-simulate)
  const floodInterventionRef = useRef({
    greenRoofsEnabled,
    permeablePavementEnabled,
    drainageEnabled,
  });
  useEffect(() => {
    floodInterventionRef.current = {
      greenRoofsEnabled,
      permeablePavementEnabled,
      drainageEnabled,
    };
  }, [greenRoofsEnabled, permeablePavementEnabled, drainageEnabled]);

  // Spatial analysis data from API (for Viable Growing Area card)
  const [spatialAnalysis, setSpatialAnalysis] = useState<{
    baseline_sq_km: number;
    future_sq_km: number;
    loss_pct: number;
  } | null>(null);
  const [isSpatialLoading, setIsSpatialLoading] = useState(false);
  const [priceShockData, setPriceShockData] = useState<any | null>(null);
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [portfolioResults, setPortfolioResults] = useState<PortfolioAnalysisResult | null>(null);
  const [selectedPolygon, setSelectedPolygon] = useState<DrawnPolygon | null>(null);
  const [polygonExposurePct, setPolygonExposurePct] = useState<number | null>(null);
  const [polygonTotalArea, setPolygonTotalArea] = useState<number | null>(null);
  const [polygonExposedArea, setPolygonExposedArea] = useState<number | null>(null);
  const [polygonTotalAssetValue, setPolygonTotalAssetValue] = useState<number | null>(null);
  const [polygonExposedValue, setPolygonExposedValue] = useState<number | null>(null);
  const [polygonValueAtRisk, setPolygonValueAtRisk] = useState<number | null>(null);
  const [polygonProtectedValue, setPolygonProtectedValue] = useState<number | null>(null);
  const [isPolygonSimulating, setIsPolygonSimulating] = useState(false);
  const [reverseLocationName, setReverseLocationName] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<FlyToTarget | null>(null);
  const { reverseGeocode } = useMapboxGeocoder();
  const geoIP = useGeolocateIP();
  const hasGeolocated = useRef(false);

  // Auto-center map on user's IP-based location (once)
  useEffect(() => {
    if (geoIP.loading || hasGeolocated.current) return;
    hasGeolocated.current = true;
    setViewState((prev) => ({
      ...prev,
      longitude: geoIP.longitude,
      latitude: geoIP.latitude,
      zoom: 10,
    }));
    if (geoIP.city) {
      setReverseLocationName(geoIP.city);
    } else {
      reverseGeocode(geoIP.latitude, geoIP.longitude).then((name) => {
        if (name) setReverseLocationName(name);
      });
    }
  }, [geoIP.loading, geoIP.latitude, geoIP.longitude, geoIP.city, reverseGeocode]);

  // Clone baseline params into scenario store when Digital Twin mode is enabled
  useEffect(() => {
    if (!isSplitMode) return;
    scenarioStore.setParams({
      cropType,
      globalTempTarget,
      rainChange,
      currentCrop,
      proposedCrop,
      mangroveWidth,
      propertyValue,
      totalSLR,
      includeStormSurge,
      coastalSelectedYear,
      seaWallEnabled,
      buildingValue,
      greenRoofsEnabled,
      permeablePavementEnabled,
      totalRainIntensity,
      floodSelectedYear,
      drainageEnabled,
      healthTempTarget,
      healthSelectedYear,
      healthIntervention,
      workforceSize,
      averageDailyWage,
      populationSize,
      gdpPerCapita,
      coolingCapex,
      coolingOpex,
      economyTier,
      customBedsPer1000,
      assetLifespan,
      dailyRevenue,
      expectedDowntimeDays,
      baseAnnualOpex,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSplitMode]);

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
    return portfolioAssets
      .filter((a) => !isNaN(a.Lat) && !isNaN(a.Lon))
      .map((a) => ({
        lat: a.Lat,
        lng: a.Lon,
        name: a.Name,
        value: a.Value,
      }));
  }, [mode, portfolioAssets, portfolioResults]);

  const fitBoundsTarget = useMemo(() => {
    const assets = portfolioResults?.asset_results;
    if (!assets?.length) return null;
    // Filter out any assets with NaN coordinates to prevent Mapbox crash
    const valid = assets.filter((a: any) =>
      typeof a.lat === 'number' && !isNaN(a.lat) &&
      typeof a.lon === 'number' && !isNaN(a.lon)
    );
    if (!valid.length) return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const a of valid) {
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
    setPolygonTotalArea(null);
    setPolygonExposedArea(null);
    setPolygonTotalAssetValue(null);
    setPolygonExposedValue(null);
    setPolygonValueAtRisk(null);
    setPolygonProtectedValue(null);
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

    // Build GeoJSON (close ring if needed: first point = last point)
    const ring = polygon.coordinates[0] ?? [];
    const closedRing =
      ring.length > 0 &&
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1]
        ? ring
        : [...ring, ring[0]];
    const geojson = {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'Polygon' as const, coordinates: [closedRing] },
    };

    const assetValueUsd = Number(propertyValue) || Number(buildingValue) || 5_000_000;
    const payload = {
      geojson,
      risk_type: 'flood',
      scenario_year: selectedYear,
      asset_value_usd: assetValueUsd,
    };

    setIsPolygonSimulating(true);
    fetchWithRetry(polygonEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((resData: Record<string, unknown>) => {
        // CRITICAL: This endpoint returns flat data (no "data" wrapper).
        // Geospatial / Area Metrics
        const sa = resData?.spatial_analysis as Record<string, unknown> | undefined;
        const fr = resData?.financial_risk as Record<string, unknown> | undefined;
        const totalArea = sa?.total_area_sqkm ?? 0;
        const exposedArea = sa?.exposed_area_sqkm ?? 0;
        const exposurePct = sa?.fractional_exposure_pct ?? 0;
        // Financial Risk Metrics
        const totalAssetValue = fr?.total_asset_value_usd ?? 0;
        const exposedValue = fr?.exposed_value_usd ?? 0;
        const valueAtRisk = fr?.value_at_risk_usd ?? 0;
        const protectedValue = fr?.protected_value_usd ?? 0;

        setPolygonTotalArea(Number(totalArea));
        setPolygonExposedArea(Number(exposedArea));
        setPolygonExposurePct(Number(exposurePct));
        setPolygonTotalAssetValue(Number(totalAssetValue));
        setPolygonExposedValue(Number(exposedValue));
        setPolygonValueAtRisk(Number(valueAtRisk));
        setPolygonProtectedValue(Number(protectedValue));
        setShowResults(true);
      })
      .catch((error) => {
        console.error('Polygon simulation failed:', error);
        toast({
          title: 'Polygon simulation failed',
          description: error instanceof Error ? error.message : 'Unable to reach the simulation server.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsPolygonSimulating(false);
      });
  }, [selectedYear, propertyValue, buildingValue]);

  const handlePolygonDeleted = useCallback(() => {
    setSelectedPolygon(null);
    setPolygonExposurePct(null);
    setPolygonTotalArea(null);
    setPolygonExposedArea(null);
    setPolygonTotalAssetValue(null);
    setPolygonExposedValue(null);
    setPolygonValueAtRisk(null);
    setPolygonProtectedValue(null);
  }, []);

  // Finance simulation handler — uses Railway FastAPI (cba-series + cvar-simulation)
   const handleFinanceSimulate = useCallback(async () => {
    setIsFinanceSimulating(true);
    setAtlasFinancialData(null);
    setAtlasMonteCarloData(null);

    const capex = Number(propertyValue) || 500_000;
    const annualOpex = Number(baseAnnualOpex) || 25_000;
    const lifespanYears = Number(assetLifespan) || 30;
    const discountRate = 0.08;
    const annualBaselineDamage = (capex * 0.02) || 100_000;

    const cbaPayload = {
      capex,
      annual_opex: annualOpex,
      discount_rate: discountRate,
      lifespan_years: lifespanYears,
      annual_baseline_damage: annualBaselineDamage,
      damage_reduction_pct: 0.80,
      base_insurance_premium: 50_000,
      insurance_reduction_pct: 0.25,
      standard_interest_rate: 0.06,
      greenium_discount_bps: 50.0,
      bond_tenor_years: 10,
      annual_carbon_credits: 0,
      carbon_price_per_ton: 50,
    };

    const cvarPayload = {
      asset_value: capex,
      mean_damage_pct: 0.02,
      volatility_pct: 0.05,
      num_simulations: 10_000,
    };

    try {
      const [cbaRes, cvarRes] = await Promise.all([
        fetchWithRetry(cbaEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cbaPayload),
        }),
        fetchWithRetry(cvarEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cvarPayload),
        }),
      ]);

      if (!cbaRes.ok) throw new Error(`CBA request failed: ${cbaRes.status}`);
      if (!cvarRes.ok) throw new Error(`CVaR request failed: ${cvarRes.status}`);

      const cbaData = await cbaRes.json();
      const cvarData = await cvarRes.json();

      const timeSeries = cbaData?.time_series ?? cbaData?.data?.time_series ?? [];
      const financialData = {
        assumptions: {
          capex,
          opex_annual: annualOpex,
          discount_rate_pct: discountRate * 100,
          asset_lifespan_years: lifespanYears,
        },
        time_series: Array.isArray(timeSeries) ? timeSeries : [],
        npv: cbaData?.npv ?? cbaData?.data?.npv ?? null,
        bond_metrics: cbaData?.bond_metrics ?? cbaData?.data?.bond_metrics ?? null,
        ...(cbaData?.data && typeof cbaData.data === 'object' ? cbaData.data : {}),
      };
      setAtlasFinancialData(financialData);

      const dist = cvarData?.distribution ?? cvarData?.data?.distribution ?? [];
      const metrics = cvarData?.metrics ?? cvarData?.data?.metrics ?? cvarData;
      const cvar95 = metrics?.cvar_95 ?? metrics?.cvar_95th ?? cvarData?.cvar_95 ?? cvarData?.cvar_95th;
      const cvar99 = metrics?.cvar_99 ?? metrics?.cvar_99th ?? cvarData?.cvar_99 ?? cvarData?.cvar_99th;
      const expectedAnnualLoss = metrics?.expected_annual_loss ?? cvarData?.expected_annual_loss;
      const monteCarloData = {
        distribution: Array.isArray(dist) ? dist : [],
        VaR_95: cvar95 ?? null,
        metrics: {
          npv_usd: { p5: cvar95 ?? undefined },
          expected_annual_loss: expectedAnnualLoss,
          cvar_95: cvar95,
          cvar_99: cvar99,
        },
        simulation_count: 10_000,
        ...(typeof metrics === 'object' && metrics !== null ? metrics : {}),
      };
      setAtlasMonteCarloData(monteCarloData);

      const coords = markerPositionRef.current;
      setAtlasLocationName(coords ? `${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}` : 'Finance Analysis');
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
        setAtlasMonteCarloData(null);
        toast({
          title: 'Finance Simulation Failed',
          description: error instanceof Error ? error.message : 'Unable to connect. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsFinanceSimulating(false);
    }
  }, [cropType, propertyValue, baseAnnualOpex, assetLifespan]);

  const handleGlobalTempTargetChange = useCallback((value: number) => {
    setGlobalTempTarget(value);
  }, []);

  const handleRainChangeChange = useCallback((value: number) => {
    setRainChange(value);
  }, []);

  const handleSelectedYearChange = useCallback((value: number) => {
    setSelectedYear(value);
  }, []);

  const handleSimulate = useCallback(async (coordsOverride?: { lat: number; lng: number }) => {
    const coords = coordsOverride || markerPositionRef.current;
    if (!coords || coords.lat == null || coords.lng == null) {
      console.error('[Simulate] Cannot simulate: Missing latitude or longitude.', coords);
      toast({
        title: 'Location required',
        description: 'Please select a location on the map first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSimulating(true);
    setIsSpatialLoading(true);
    setShowResults(false);
    setSpatialAnalysis(null);

    const tempDelta = globalTempTarget - 1.4;
    const agriBaseUrl = 'https://web-production-8ff9e.up.railway.app';
    const agriEndpoint = `${agriBaseUrl.replace(/\/+$/, '')}/predict-agri`;

    // Send exact UI strings for crops (no lowercase/snake_case); backend expects e.g. "Drought-Resistant Sorghum"
    // In Digital Twin mode, baseline should have NO adaptation intervention
    const baselineProposedCrop = isSplitMode ? 'None' : proposedCrop;

    const payload = {
      lat: coords.lat,
      lon: coords.lng,
      crop: cropType,
      current_crop: currentCrop,
      proposed_crop: baselineProposedCrop,
      baseline_yield_value: 500000,
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
    };

    console.log('Sending Agri Payload:', payload);

    // Fire-and-forget NDVI fetch — runs concurrently, never blocks main simulation
    (async () => {
      try {
        setIsNdviLoading(true);
        const ndviUrl = `${ndviEndpoint}?lat=${coords.lat}&lon=${coords.lng}`;
        const ndviRes = await fetchWithRetry(ndviUrl, { method: 'GET' });
        if (!ndviRes.ok) throw new Error(`NDVI HTTP ${ndviRes.status}`);
        const ndviJson = await ndviRes.json();
        const timeSeries = Array.isArray(ndviJson) ? ndviJson : (ndviJson?.data ?? []);
        setNdviData(timeSeries);
      } catch (ndviErr) {
        console.warn('[NDVI] Earth Observation fetch failed (non-blocking):', ndviErr);
      } finally {
        setIsNdviLoading(false);
      }
    })();

    fetchWithRetry(agriEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textError = await res.text();
          console.error('Received non-JSON response:', textError.substring(0, 100));
          throw new TypeError('Oops, we haven\'t got JSON!');
        }
        return res.json();
      })
      .then(async (resData) => {
        console.log('EXACT AGRI RESPONSE:', JSON.stringify(resData, null, 2));
        const raw = Array.isArray(resData) ? resData[0] : resData;
        const d = raw as Record<string, unknown>;
        const result = d?.data ?? d;
        const r = result as Record<string, unknown>;

        // Backend returns real dollar amounts and risk_reduction_pct at top level or under data
        const transitionCapex = Number(r?.transition_capex ?? d?.transition_capex ?? 0);
        const avoidedRevenueLoss = Number(r?.avoided_revenue_loss ?? d?.avoided_revenue_loss ?? r?.avoided_loss ?? d?.avoided_loss ?? 0);
        const riskReductionPct = Number(r?.risk_reduction_pct ?? d?.risk_reduction_pct ?? r?.risk_reduction ?? r?.percentage_improvement ?? 0);

        const analysis = (r?.analysis ?? r?.data) as Record<string, unknown> | undefined;
        const predictions = (r?.predictions ?? (r?.data as Record<string, unknown>)?.predictions) as Record<string, unknown> | undefined;
        const apiChartData = (r?.chart_data ?? (r?.data as Record<string, unknown>)?.chart_data) as Record<string, unknown> | undefined;

        const yieldBaseline = analysis != null && predictions != null
          ? Number((predictions?.standard_seed as Record<string, unknown>)?.predicted_yield ?? 0)
          : 0;
        const yieldResilient = analysis != null && predictions != null
          ? Number((predictions?.resilient_seed as Record<string, unknown>)?.predicted_yield ?? 0)
          : 0;
        const resilienceScore =
          analysis?.resilience_score ??
          (predictions?.resilient_seed as Record<string, unknown>)?.resilience_score ??
          r?.resilience_score ??
          null;
        const yieldPotential = resilienceScore !== null
          ? Math.min(100, Math.max(0, Number(resilienceScore)))
          : Math.min(100, Math.max(0, yieldResilient));

        if (apiChartData) {
          const months = (apiChartData.months as string[]) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const rainfallBaseline = (apiChartData.rainfall_baseline as number[]) || [];
          const rainfallProjected = (apiChartData.rainfall_projected as number[]) || [];
          const soilMoistureBaseline = (apiChartData.soil_moisture_baseline as number[]) || [];
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

        const apiSpatialAnalysis = r?.spatial_analysis as Record<string, unknown> | undefined;
        if (apiSpatialAnalysis) {
          setSpatialAnalysis({
            baseline_sq_km: Number(apiSpatialAnalysis.baseline_sq_km ?? 0),
            future_sq_km: Number(apiSpatialAnalysis.future_sq_km ?? 0),
            loss_pct: Number(apiSpatialAnalysis.loss_pct ?? 0),
          });
        }
        setIsSpatialLoading(false);

        const apiVolatility = analysis?.portfolio_volatility_pct ?? r?.portfolio_volatility_pct ?? null;
        setResults({
          avoidedLoss: Math.round(avoidedRevenueLoss * 100) / 100,
          transitionCapex,
          riskReduction: Math.round(riskReductionPct * 10) / 10,
          yieldBaseline,
          yieldResilient,
          yieldPotential,
          portfolioVolatilityPct: apiVolatility != null ? Number(apiVolatility) : Math.round(15 + (globalTempTarget - 1.4) * 10),
          avoidedRevenueLoss: avoidedRevenueLoss ?? null,
          monthlyData: mockMonthlyData,
        });
        setShowResults(true);
        setIsPanelOpen(true);

        // Fire price-shock call after successful simulation
        try {
          const priceShockEndpoint = `${agriBaseUrl.replace(/\/+$/, '')}/api/v1/finance/price-shock`;
          const stressedYield = yieldPotential ?? yieldResilient;
          const priceShockRes = await fetchWithRetry(priceShockEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              crop_type: cropType,
              baseline_yield_tons: 100,
              stressed_yield_tons: stressedYield,
            }),
          });
          if (priceShockRes.ok) {
            const psData = await priceShockRes.json();
            setPriceShockData(psData?.data ?? psData);
            console.log('Price shock data:', psData);
          }
        } catch (psErr) {
          console.warn('Price shock fetch failed (non-blocking):', psErr);
        }
      })
      .catch((error) => {
        console.error('Agriculture simulation failed:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message, error.stack);
        }
        const fallback = markerPosition ? findClosestAtlasItem(markerPosition.lat, markerPosition.lng, 'agriculture') : null;
        if (fallback) {
          const crop = (fallback as any).crop_analysis;
          setResults({
            avoidedLoss: crop?.avoided_loss_pct ?? 0,
            transitionCapex: 0,
            riskReduction: Math.round((crop?.percentage_improvement ?? 0) * 10) / 10,
            yieldBaseline: crop?.standard_yield_pct ?? 0,
            yieldResilient: crop?.resilient_yield_pct ?? 0,
            yieldPotential: crop?.resilient_yield_pct ?? null,
            portfolioVolatilityPct: null,
            avoidedRevenueLoss: null,
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
      })
      .finally(() => {
        setIsSimulating(false);
        setIsSpatialLoading(false);
      });
  }, [cropType, currentCrop, proposedCrop, globalTempTarget, rainChange, projectParams, isSplitMode]);

  const handleWizardRunAnalysis = useCallback((params: ProjectParams) => {
    setProjectParams(params);
    setShowWizard(false);
    // Trigger simulation with the new params
    if (markerPositionRef.current) {
      // Small delay to let state update
      setTimeout(() => {
        handleSimulate();
      }, 100);
    }
  }, [handleSimulate]);

  const handleCoastalSimulate = useCallback(async () => {
    const coords = markerPositionRef.current;
    if (!coords) {
      toast({
        title: 'Location required',
        description: 'Please select a location on the map first.',
        variant: 'destructive',
      });
      return;
    }

    const safeOpex = parseFloat(String(baseAnnualOpex).replace(/,/g, '')) || 25000;
    const safeLifespan = parseInt(String(assetLifespan), 10) || 30;

    setIsCoastalSimulating(true);

    // In Digital Twin mode, baseline should have NO mangrove intervention
    const baselineMangroveWidth = isSplitMode ? 0 : mangroveWidth;

    const payload = {
      lat: coords.lat,
      lon: coords.lng,
      base_annual_opex: safeOpex,
      initial_lifespan_years: safeLifespan,
      mangrove_width: baselineMangroveWidth,
      sea_level_rise: totalSLR,
      slr_projection: totalSLR,
      include_storm_surge: includeStormSurge,
    };

    const coastalBaseUrl = 'https://web-production-8ff9e.up.railway.app';
    const coastalEndpoint = `${coastalBaseUrl.replace(/\/+$/, '')}/predict-coastal`;

    fetchWithRetry(coastalEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textError = await res.text();
          console.error('Received non-JSON response:', textError.substring(0, 100));
          throw new TypeError('Oops, we haven\'t got JSON!');
        }
        return res.json();
      })
      .then((data) => {
        console.log('Parsed API Data:', data);
        try {
          const raw = data as Record<string, unknown>;
          const d = (raw.data ?? raw) as Record<string, unknown>;
          const slr = Number(d.sea_level_rise ?? d.slr_projection ?? totalSLR) ?? totalSLR;
          const stormChartData = (d.storm_chart_data as Array<{ period: string; current_depth: number; future_depth: number }>) ?? generateFallbackStormChartData(slr);
          setCoastalResults({
            avoidedLoss: Number(d.avoided_loss ?? 0),
            slope: d.slope != null ? Number(d.slope) : null,
            stormWave: d.storm_wave != null ? Number(d.storm_wave) : d.surge_m != null ? Number(d.surge_m) : null,
            isUnderwater: Boolean(d.is_underwater),
            floodDepth: d.flood_depth_m != null ? Number(d.flood_depth_m) : null,
            seaLevelRise: slr,
            includeStormSurge: includeStormSurge,
            stormChartData: Array.isArray(stormChartData) ? stormChartData : generateFallbackStormChartData(slr),
            floodedUrbanKm2: d.flooded_urban_km2 != null ? Number(d.flooded_urban_km2) : null,
            urbanImpactPct: d.urban_impact_pct != null ? Number(d.urban_impact_pct) : null,
            avoidedBusinessInterruption: d.avoided_business_interruption != null ? Number(d.avoided_business_interruption) : null,
            adjustedOpex: d.adjusted_opex != null ? Number(d.adjusted_opex) : null,
            opexClimatePenalty: d.opex_climate_penalty != null ? Number(d.opex_climate_penalty) : null,
            adjustedLifespan: d.adjusted_lifespan != null ? Number(d.adjusted_lifespan) : null,
          });
        } catch (e) {
          console.error('Coastal results mapping error:', e);
        }
        setShowCoastalResults(true);
        setIsPanelOpen(true);
      })
      .catch((err) => {
        console.error('Simulation failed:', err);
        toast({
          title: 'Simulation failed',
          description: err instanceof Error ? err.message : 'Coastal simulation failed.',
          variant: 'destructive',
        });
        setIsPanelOpen(true);
      })
      .finally(() => {
        setIsCoastalSimulating(false);
      });
  }, [baseAnnualOpex, assetLifespan, mangroveWidth, totalSLR, includeStormSurge, isSplitMode]);

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
    const coords = markerPositionRef.current;
    if (!coords) {
      toast({
        title: 'Location required',
        description: 'Please select a location on the map first.',
        variant: 'destructive',
      });
      return;
    }

    const safeOpex = parseFloat(String(baseAnnualOpex).replace(/,/g, '')) || 25000;
    const safeLifespan = parseInt(String(assetLifespan), 10) || 30;
    const safePropertyValue = parseFloat(String(propertyValue).replace(/,/g, '')) || 5_000_000;

    // Backend requires rain_intensity in range [10, 150] (e.g. mm/hr)
    const calculatedRain = typeof totalRainIntensity === 'number' && !Number.isNaN(totalRainIntensity) ? totalRainIntensity : 50;
    const safeRain = Math.max(10, Math.min(150, calculatedRain));

    // Read current toggle state from ref so we send actual UI state (avoids stale closure when toggles trigger re-simulate)
    const { greenRoofsEnabled: gr, permeablePavementEnabled: pp, drainageEnabled: du } = floodInterventionRef.current;

    // In Digital Twin mode, baseline should have NO flood interventions
    const interventionType = isSplitMode ? 'none'
      : gr ? 'green_roof' : pp ? 'permeable_pavement' : du ? 'drainage_upgrade' : 'none';
    const baselineGR = isSplitMode ? false : gr;
    const baselinePP = isSplitMode ? false : pp;

    setIsFloodSimulating(true);

    const payload = {
      lat: coords.lat,
      lon: coords.lng,
      rain_intensity: safeRain,
      current_imperviousness: 0.7,
      intervention_type: interventionType,
      base_annual_opex: safeOpex,
      initial_lifespan_years: safeLifespan,
      asset_value_usd: safePropertyValue,
      green_roofs: baselineGR,
      permeable_pavement: baselinePP,
      rain_intensity_pct: totalRainIntensity,
      slope_pct: 2,
    };

    console.log('Sending Flood Payload:', payload);

    const floodBaseUrl = 'https://web-production-8ff9e.up.railway.app';
    const floodEndpoint = `${floodBaseUrl.replace(/\/+$/, '')}/predict-flood`;

    fetchWithRetry(floodEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textError = await res.text();
          console.error('Received non-JSON response:', textError.substring(0, 100));
          throw new TypeError('Oops, we haven\'t got JSON!');
        }
        return res.json();
      })
      .then((resData) => {
        console.log('EXACT FLOOD RESPONSE:', JSON.stringify(resData, null, 2));
        const data = (resData as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
        const d = data ?? (resData as Record<string, unknown>);
        const rainChartData = d.rain_chart_data as Array<{ month: string; historical: number; projected: number }> | undefined;
        const entry100yr = Array.isArray(rainChartData)
          ? (rainChartData as any[]).find((e: any) => e.period === '100yr')
          : (d.rain_frequency as Record<string, unknown>) != null
            ? (d.rain_frequency as Record<string, unknown>).rain_chart_data
            : null;
        const rf = (d.rain_frequency ?? d.rainfall_frequency) as Record<string, unknown> | undefined;
        const rc = rf?.rain_chart_data as Array<{ period?: string; baseline_mm?: number; future_mm?: number }> | undefined;
        const e100 = Array.isArray(rc) ? rc.find((x) => x.period === '100yr') : null;

        type FloodResponse = { data?: { analysis?: { avoided_depth_cm?: number }; avoided_loss?: number; adjusted_opex?: number; asset_depreciation?: { adjusted_lifespan?: number } } };
        const depth = (resData as FloodResponse)?.data?.analysis?.avoided_depth_cm ?? 0;
        const avoidedLoss = (resData as FloodResponse)?.data?.avoided_loss ?? 0;
        const newOpex = (resData as FloodResponse)?.data?.adjusted_opex ?? baseAnnualOpex ?? 0;
        const newLifespan = (resData as FloodResponse)?.data?.asset_depreciation?.adjusted_lifespan ?? 0;

        setFloodResults({
          floodDepthReduction: depth,
          valueProtected: Math.round(avoidedLoss),
          riskIncreasePct: d.risk_increase_pct != null ? Number(d.risk_increase_pct) : null,
          futureFloodAreaKm2: d.future_flood_area_km2 != null ? Number(d.future_flood_area_km2) : null,
          rainChartData: Array.isArray(rainChartData) ? rainChartData : null,
          future100yr: e100?.future_mm ?? (entry100yr as { future_mm?: number } | undefined)?.future_mm ?? null,
          baseline100yr: e100?.baseline_mm ?? (entry100yr as { baseline_mm?: number } | undefined)?.baseline_mm ?? null,
          avoidedBusinessInterruption: d.avoided_business_interruption != null ? Math.round(Number(d.avoided_business_interruption)) : null,
          adjustedOpex: Math.round(Number(newOpex)) || 0,
          opexClimatePenalty: d.opex_climate_penalty != null ? Number(d.opex_climate_penalty) : null,
          adjustedLifespan: newLifespan,
        });
        setShowFloodResults(true);
        setIsPanelOpen(true);
      })
      .catch((err) => {
        console.error('Simulation failed:', err);
        toast({
          title: 'Simulation failed',
          description: err instanceof Error ? err.message : 'Flood simulation failed.',
          variant: 'destructive',
        });
        setIsPanelOpen(true);
      })
      .finally(() => {
        setIsFloodSimulating(false);
      });
  }, [baseAnnualOpex, assetLifespan, propertyValue, totalRainIntensity, toast, isSplitMode]);

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
        transitionCapex: null,
        avoidedRevenueLoss: null,
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
        avoidedBusinessInterruption: null,
        adjustedOpex: null,
        opexClimatePenalty: null,
        adjustedLifespan: null,
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

  // Hover-gated viewport sync: only the actively-hovered map dispatches updates
  const activeMapPane = useRef<'left' | 'right' | null>(null);

  const handleViewStateChange = useCallback((newViewState: ViewState) => {
    setViewState(newViewState);
  }, []);

  const handleLeftViewStateChange = useCallback((newViewState: ViewState) => {
    if (activeMapPane.current === 'right') return; // ignore echoed updates
    setViewState(newViewState);
  }, []);

  const handleRightViewStateChange = useCallback((newViewState: ViewState) => {
    if (activeMapPane.current === 'left') return; // ignore echoed updates
    setViewState(newViewState);
  }, []);

  // Health simulation handler — uses Railway FastAPI /predict-health
  const handleHealthSimulate = useCallback(async () => {
    const coords = markerPositionRef.current;
    if (!coords) {
      toast({
        title: 'Location required',
        description: 'Please select a location on the map first.',
        variant: 'destructive',
      });
      return;
    }
    setIsHealthSimulating(true);
    setShowHealthResults(false);

    // In Digital Twin mode, baseline should have NO health intervention
    const formattedIntervention = isSplitMode ? 'none' : healthIntervention;

    const healthTempDelta = healthTempTarget - 1.4;
    const payload: Record<string, unknown> = {
      lat: coords.lat,
      lon: coords.lng,
      workforce_size: workforceSize ?? 100,
      daily_wage: averageDailyWage ?? 50,
      intervention_type: formattedIntervention,
      intervention_capex: coolingCapex,
      intervention_annual_opex: coolingOpex,
      population_size: populationSize,
      gdp_per_capita_usd: gdpPerCapita,
      economy_tier: economyTier,
      temp_increase: Math.round(healthTempDelta * 10) / 10,
    };
    if (customBedsPer1000 != null) {
      payload.user_beds_per_1000 = customBedsPer1000;
    }

    fetchWithRetry(healthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Health simulation failed: ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textError = await res.text();
          console.error('Health API non-JSON:', textError.substring(0, 100));
          throw new TypeError('Health API did not return JSON');
        }
        return res.json();
      })
      .then((resData: { status?: string; data?: Record<string, unknown> }) => {
        const data = resData?.data ?? {};
        const heat = (data?.heat_stress_analysis ?? {}) as Record<string, unknown>;
        const malaria = (data?.malaria_risk_analysis ?? {}) as Record<string, unknown>;
        const totalEconomic = (data?.economic_impact as Record<string, unknown> | undefined)?.total_economic_impact as Record<string, unknown> | undefined;
        const heatStressImpact = (data?.economic_impact as Record<string, unknown> | undefined)?.heat_stress_impact as Record<string, unknown> | undefined;

        const wbgtVal = Number(heat?.wbgt_estimate ?? heat?.wbgt ?? 0);
        const productivityLoss = Number(heat?.productivity_loss_pct ?? heat?.productivity_loss ?? 0);
        const heatStressCategory = (heat?.heat_stress_category ?? '') as string;

        const malariaRiskScore = Number(malaria?.risk_score ?? 0);
        const malariaRiskCategory = (malaria?.risk_category ?? 'Low') as string;

        const annualLoss = Number(totalEconomic?.annual_loss ?? 0);
        const dailyLossAverage = Number(totalEconomic?.daily_loss_average ?? 0);
        const affectedWorkers = Number(heatStressImpact?.affected_workers ?? 0);

        const economicDaily = dailyLossAverage > 0 ? dailyLossAverage : (annualLoss > 0 ? annualLoss / 365 : 0);

        const malariaRisk = (['High', 'Medium', 'Low'].includes(malariaRiskCategory) ? malariaRiskCategory : 'Low') as 'High' | 'Medium' | 'Low';
        const workforce = workforceSize ?? 100;
        const dailyWage = averageDailyWage ?? 50;

        // Debug: log the raw API response
        console.log("HEALTH API RESPONSE:", JSON.stringify(data, null, 2));

        // Extract nested intervention analysis matching backend contract
        const interventionRaw = data?.intervention_analysis as Record<string, unknown> | undefined;
        let interventionAnalysis: import('@/components/hud/HealthResultsPanel').InterventionAnalysis | undefined;
        if (interventionRaw) {
          const wbgtAdj = interventionRaw.wbgt_adjustment as Record<string, unknown> | undefined;
          const econImpact = interventionRaw.economic_impact as Record<string, unknown> | undefined;
          const finAnalysis = interventionRaw.financial_analysis as Record<string, unknown> | undefined;

          interventionAnalysis = {
            intervention_type: String(interventionRaw.intervention_type ?? formattedIntervention),
            // Nested structure for RightPanel JSX
            wbgt_adjustment: {
              adjusted_wbgt: Number(wbgtAdj?.adjusted_wbgt ?? wbgtVal),
            },
            economic_impact: {
              avoided_annual_economic_loss_usd: Number(econImpact?.avoided_annual_economic_loss_usd ?? 0),
            },
            financial_analysis: {
              payback_period_years: finAnalysis?.payback_period_years != null ? Number(finAnalysis.payback_period_years) : null,
              npv_10yr_at_10pct_discount: Number(finAnalysis?.npv_10yr_at_10pct_discount ?? 0),
            },
            // Legacy flat fields for backwards compat
            adjusted_wbgt: Number(wbgtAdj?.adjusted_wbgt ?? wbgtVal),
            adjusted_productivity_loss_pct: Number(wbgtAdj?.adjusted_productivity_loss_pct ?? productivityLoss),
            avoided_annual_loss: Number(econImpact?.avoided_annual_economic_loss_usd ?? 0),
            payback_period_years: finAnalysis?.payback_period_years != null ? Number(finAnalysis.payback_period_years) : null,
            npv_10yr: Number(finAnalysis?.npv_10yr_at_10pct_discount ?? 0),
            capex: Number(interventionRaw.capex ?? coolingCapex),
            annual_opex: Number(interventionRaw.annual_opex ?? coolingOpex),
          };
        }

        // Extract public health DALY analysis
        const publicHealthRaw = data?.public_health_analysis as Record<string, unknown> | undefined;

        // Extract infrastructure stress test
        const infraRaw = data?.infrastructure_stress_test as Record<string, unknown> | undefined;

        setHealthResults({
          productivity_loss_pct: Math.min(100, Math.max(0, productivityLoss)),
          economic_loss_daily: Math.round(economicDaily),
          wbgt: Math.round(wbgtVal * 10) / 10,
          projected_temp: Math.round(wbgtVal * 10) / 10,
          malaria_risk: malariaRisk,
          dengue_risk: 'Low',
          workforce_size: workforce,
          daily_wage: dailyWage,
          intervention_analysis: interventionAnalysis,
          public_health_analysis: publicHealthRaw ? {
            dalys_averted: Number(publicHealthRaw.dalys_averted ?? 0),
            economic_value_preserved_usd: Number(publicHealthRaw.economic_value_preserved_usd ?? 0),
            monetization: {
              value_per_daly_usd: Number((publicHealthRaw.monetization as Record<string, unknown> | undefined)?.value_per_daly_usd ?? 0),
            },
          } : undefined,
          infrastructure_stress_test: infraRaw ? {
            available_beds: Number(infraRaw.available_beds ?? 0),
            surge_admissions: Number(infraRaw.surge_admissions ?? 0),
            bed_deficit: Number(infraRaw.bed_deficit ?? 0),
            capacity_breach: Boolean(infraRaw.capacity_breach),
            infrastructure_bond_capex: Number(infraRaw.infrastructure_bond_capex ?? 0),
          } : undefined,
        });
        setShowHealthResults(true);
        setIsPanelOpen(true);
      })
      .catch((error) => {
        console.error('Health simulation failed:', error);
        if (error instanceof Error) {
          console.error('Health error details:', error.message, error.stack);
        }
        const baseTemp = 28 + (Math.abs(markerPosition.lat) < 15 ? 4 : markerPosition.lat < 25 ? 2 : 0);
        const projTemp = baseTemp + (healthTempTarget - 1.4);
        const wbgt = projTemp * 0.7 + 8;
        const loss = Math.min(50, Math.max(0, Math.round((wbgt - 25) * 5)));
        const workforce = workforceSize ?? 100;
        const dailyWage = averageDailyWage ?? 50;
        setHealthResults({
          productivity_loss_pct: loss,
          economic_loss_daily: Math.round(workforce * dailyWage * (loss / 100)),
          wbgt: Math.round(wbgt * 10) / 10,
          projected_temp: Math.round(projTemp * 10) / 10,
          malaria_risk: Math.abs(markerPosition.lat) < 25 && projTemp >= 25 ? 'High' : 'Low',
          dengue_risk: Math.abs(markerPosition.lat) < 35 && projTemp >= 25 ? 'High' : 'Low',
          workforce_size: workforce,
          daily_wage: dailyWage,
        });
        setShowHealthResults(true);
        setIsPanelOpen(true);
        toast({
          title: 'Live API failed, falling back to cached Atlas data',
          description: 'Showing estimated health values from local calculations.',
        });
      })
      .finally(() => {
        setIsHealthSimulating(false);
      });
  }, [workforceSize, averageDailyWage, healthTempTarget, healthIntervention, coolingCapex, coolingOpex, populationSize, gdpPerCapita, economyTier, customBedsPer1000, isSplitMode]);

  /** Fire a scenario API call concurrently when in Digital Twin mode. */
   const fireScenarioCall = useCallback(async (coordsOverride?: { lat: number; lng: number }) => {
    const coords = coordsOverride || markerPositionRef.current;
    if (!coords || coords.lat == null || coords.lng == null || !isSplitMode) {
      if (!coords || coords.lat == null || coords.lng == null) console.error('[DT Scenario] Missing lat/lon', coords);
      return;
    }
    const sp = scenarioStore.params;

    if (mode === 'agriculture') {
      const agriEndpoint = 'https://web-production-8ff9e.up.railway.app/predict-agri';
      const tempDelta = sp.globalTempTarget - 1.4;
      const payload = {
        lat: coords.lat, lon: coords.lng, crop: sp.cropType,
        current_crop: sp.currentCrop, proposed_crop: sp.proposedCrop,
        baseline_yield_value: 500000, temp_increase: Math.round(tempDelta * 10) / 10,
        rain_change: sp.rainChange,
      };
      console.log('[DT Scenario] Sending Agri Payload:', payload);
      try {
        const res = await fetchWithRetry(agriEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Agri scenario HTTP ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError('Agri scenario API did not return JSON');
        }
        const resData = await res.json();
        console.log('[DT Scenario] Agri Response:', JSON.stringify(resData, null, 2));
        const raw = Array.isArray(resData) ? resData[0] : resData;
        const d = raw as Record<string, unknown>;
        const r = (d?.data ?? d) as Record<string, unknown>;
        const transitionCapex = Number(r?.transition_capex ?? d?.transition_capex ?? 0);
        const avoidedRevenueLoss = Number(r?.avoided_revenue_loss ?? d?.avoided_revenue_loss ?? r?.avoided_loss ?? d?.avoided_loss ?? 0);
        const riskReductionPct = Number(r?.risk_reduction_pct ?? d?.risk_reduction_pct ?? 0);
        const resilienceScore = r?.resilience_score ?? null;
        const predictions = r?.predictions as Record<string, unknown> | undefined;
        const yieldResilient = predictions ? Number((predictions?.resilient_seed as Record<string, unknown>)?.predicted_yield ?? 0) : 0;
        const yieldPotential = resilienceScore !== null ? Math.min(100, Math.max(0, Number(resilienceScore))) : Math.min(100, Math.max(0, yieldResilient));
        setScenarioAgriResults({
          avoidedLoss: Math.round(avoidedRevenueLoss * 100) / 100,
          transitionCapex,
          riskReduction: Math.round(riskReductionPct * 10) / 10,
          yieldBaseline: 0,
          yieldResilient,
          yieldPotential,
          portfolioVolatilityPct: null,
          avoidedRevenueLoss: avoidedRevenueLoss ?? null,
          monthlyData: mockMonthlyData,
        });
      } catch (err) {
        console.error('[DT Scenario] Agri scenario call failed:', err);
        setScenarioAgriResults(null);
      }
    }

    if (mode === 'coastal') {
      const coastalEndpoint = 'https://web-production-8ff9e.up.railway.app/predict-coastal';
      const payload = {
        lat: coords.lat, lon: coords.lng,
        base_annual_opex: Number(sp.baseAnnualOpex) || 25000,
        initial_lifespan_years: Number(sp.assetLifespan) || 30,
        mangrove_width: sp.mangroveWidth, sea_level_rise: sp.totalSLR,
        slr_projection: sp.totalSLR, include_storm_surge: sp.includeStormSurge,
      };
      try {
        const res = await fetchWithRetry(coastalEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        const raw = data as Record<string, unknown>;
        const d = (raw.data ?? raw) as Record<string, unknown>;
        setScenarioCoastalResults({
          avoidedLoss: Number(d.avoided_loss ?? 0), slope: d.slope != null ? Number(d.slope) : null,
          stormWave: d.storm_wave != null ? Number(d.storm_wave) : d.surge_m != null ? Number(d.surge_m) : null,
          isUnderwater: Boolean(d.is_underwater), floodDepth: d.flood_depth_m != null ? Number(d.flood_depth_m) : null,
          seaLevelRise: Number(d.sea_level_rise ?? d.slr_projection ?? sp.totalSLR),
          includeStormSurge: sp.includeStormSurge,
          adjustedOpex: d.adjusted_opex != null ? Number(d.adjusted_opex) : null,
          opexClimatePenalty: d.opex_climate_penalty != null ? Number(d.opex_climate_penalty) : null,
          adjustedLifespan: d.adjusted_lifespan != null ? Number(d.adjusted_lifespan) : null,
          avoidedBusinessInterruption: d.avoided_business_interruption != null ? Number(d.avoided_business_interruption) : null,
        });
      } catch (err) {
        console.error('[DT Scenario] Coastal scenario call failed:', err);
        setScenarioCoastalResults(null);
      }
    }

    if (mode === 'flood') {
      const floodEndpoint = 'https://web-production-8ff9e.up.railway.app/predict-flood';
      // Mirror exact safety parsing from single-view handleFloodSimulate
      const calculatedRain = typeof sp.totalRainIntensity === 'number' && !Number.isNaN(sp.totalRainIntensity) ? sp.totalRainIntensity : 50;
      const safeRain = Math.max(10, Math.min(150, calculatedRain));
      const safeOpex = parseFloat(String(sp.baseAnnualOpex).replace(/,/g, '')) || 25000;
      const safeLifespan = parseInt(String(sp.assetLifespan), 10) || 30;
      const safePropertyValue = parseFloat(String(sp.buildingValue).replace(/,/g, '')) || 5_000_000;
      const interventionType = sp.greenRoofsEnabled ? 'green_roof' : sp.permeablePavementEnabled ? 'permeable_pavement' : sp.drainageEnabled ? 'drainage_upgrade' : 'none';
      const payload = {
        lat: coords.lat,
        lon: coords.lng,
        rain_intensity: safeRain,
        current_imperviousness: 0.7,
        intervention_type: interventionType,
        base_annual_opex: safeOpex,
        initial_lifespan_years: safeLifespan,
        asset_value_usd: safePropertyValue,
        green_roofs: sp.greenRoofsEnabled,
        permeable_pavement: sp.permeablePavementEnabled,
        rain_intensity_pct: sp.totalRainIntensity,
        slope_pct: 2,
      };
      console.log('[DT Scenario] Sending Flood Payload:', payload);
      try {
        const res = await fetchWithRetry(floodEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Flood scenario HTTP ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError('Flood scenario API did not return JSON');
        }
        const resData = await res.json();
        console.log('[DT Scenario] Flood Response:', JSON.stringify(resData, null, 2));
        const data = (resData as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
        const d = data ?? (resData as Record<string, unknown>);
        type FR = { data?: { analysis?: { avoided_depth_cm?: number }; avoided_loss?: number; adjusted_opex?: number; asset_depreciation?: { adjusted_lifespan?: number } } };
        const depth = (resData as FR)?.data?.analysis?.avoided_depth_cm ?? 0;
        const avoidedLoss = (resData as FR)?.data?.avoided_loss ?? 0;
        setScenarioFloodResults({
          floodDepthReduction: depth,
          valueProtected: Math.round(avoidedLoss),
          riskIncreasePct: d.risk_increase_pct != null ? Number(d.risk_increase_pct) : null,
          futureFloodAreaKm2: d.future_flood_area_km2 != null ? Number(d.future_flood_area_km2) : null,
          rainChartData: null,
          future100yr: null,
          baseline100yr: null,
          avoidedBusinessInterruption: d.avoided_business_interruption != null ? Math.round(Number(d.avoided_business_interruption)) : null,
          adjustedOpex: (resData as FR)?.data?.adjusted_opex ?? null,
          opexClimatePenalty: d.opex_climate_penalty != null ? Number(d.opex_climate_penalty) : null,
          adjustedLifespan: (resData as FR)?.data?.asset_depreciation?.adjusted_lifespan ?? null,
        });
      } catch (err) {
        console.error('[DT Scenario] Flood scenario call failed:', err);
        setScenarioFloodResults(null);
      }
    }

    if (mode === 'health') {
      const scenarioTempDelta = sp.healthTempTarget - 1.4;
      const payload: Record<string, unknown> = {
        lat: coords.lat, lon: coords.lng,
        workforce_size: sp.workforceSize ?? 100, daily_wage: sp.averageDailyWage ?? 50,
        intervention_type: sp.healthIntervention, intervention_capex: sp.coolingCapex,
        intervention_annual_opex: sp.coolingOpex, population_size: sp.populationSize,
        gdp_per_capita_usd: sp.gdpPerCapita, economy_tier: sp.economyTier,
        temp_increase: Math.round(scenarioTempDelta * 10) / 10,
      };
      if (sp.customBedsPer1000 != null) payload.user_beds_per_1000 = sp.customBedsPer1000;
      try {
        const res = await fetchWithRetry(healthEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const resData = await res.json();
        const data = resData?.data ?? {};
        const heat = (data?.heat_stress_analysis ?? {}) as Record<string, unknown>;
        const malaria = (data?.malaria_risk_analysis ?? {}) as Record<string, unknown>;
        const totalEconomic = (data?.economic_impact as Record<string, unknown> | undefined)?.total_economic_impact as Record<string, unknown> | undefined;
        const wbgtVal = Number(heat?.wbgt_estimate ?? heat?.wbgt ?? 0);
        const productivityLoss = Number(heat?.productivity_loss_pct ?? 0);
        const dailyLossAverage = Number(totalEconomic?.daily_loss_average ?? 0);
        const annualLoss = Number(totalEconomic?.annual_loss ?? 0);
        const economicDaily = dailyLossAverage > 0 ? dailyLossAverage : (annualLoss > 0 ? annualLoss / 365 : 0);
        const malariaRiskCategory = (malaria?.risk_category ?? 'Low') as string;
        const interventionRaw = data?.intervention_analysis as Record<string, unknown> | undefined;
        let interventionAnalysis: import('@/components/hud/HealthResultsPanel').InterventionAnalysis | undefined;
        if (interventionRaw) {
          const wbgtAdj = interventionRaw.wbgt_adjustment as Record<string, unknown> | undefined;
          const econImpact = interventionRaw.economic_impact as Record<string, unknown> | undefined;
          const finAnalysis = interventionRaw.financial_analysis as Record<string, unknown> | undefined;
          interventionAnalysis = {
            intervention_type: String(interventionRaw.intervention_type ?? sp.healthIntervention),
            wbgt_adjustment: { adjusted_wbgt: Number(wbgtAdj?.adjusted_wbgt ?? wbgtVal) },
            economic_impact: { avoided_annual_economic_loss_usd: Number(econImpact?.avoided_annual_economic_loss_usd ?? 0) },
            financial_analysis: { payback_period_years: finAnalysis?.payback_period_years != null ? Number(finAnalysis.payback_period_years) : null, npv_10yr_at_10pct_discount: Number(finAnalysis?.npv_10yr_at_10pct_discount ?? 0) },
            adjusted_wbgt: Number(wbgtAdj?.adjusted_wbgt ?? wbgtVal),
            adjusted_productivity_loss_pct: Number(wbgtAdj?.adjusted_productivity_loss_pct ?? productivityLoss),
            avoided_annual_loss: Number(econImpact?.avoided_annual_economic_loss_usd ?? 0),
            payback_period_years: finAnalysis?.payback_period_years != null ? Number(finAnalysis.payback_period_years) : null,
            npv_10yr: Number(finAnalysis?.npv_10yr_at_10pct_discount ?? 0),
            capex: Number(interventionRaw.capex ?? sp.coolingCapex), annual_opex: Number(interventionRaw.annual_opex ?? sp.coolingOpex),
          };
        }
        const publicHealthRaw = data?.public_health_analysis as Record<string, unknown> | undefined;
        const infraRaw = data?.infrastructure_stress_test as Record<string, unknown> | undefined;
        setScenarioHealthResults({
          productivity_loss_pct: Math.min(100, Math.max(0, productivityLoss)),
          economic_loss_daily: Math.round(economicDaily),
          wbgt: Math.round(wbgtVal * 10) / 10, projected_temp: Math.round(wbgtVal * 10) / 10,
          malaria_risk: (['High', 'Medium', 'Low'].includes(malariaRiskCategory) ? malariaRiskCategory : 'Low') as 'High' | 'Medium' | 'Low',
          dengue_risk: 'Low', workforce_size: sp.workforceSize, daily_wage: sp.averageDailyWage,
          intervention_analysis: interventionAnalysis,
          public_health_analysis: publicHealthRaw ? {
            dalys_averted: Number(publicHealthRaw.dalys_averted ?? 0),
            economic_value_preserved_usd: Number(publicHealthRaw.economic_value_preserved_usd ?? 0),
            monetization: { value_per_daly_usd: Number((publicHealthRaw.monetization as Record<string, unknown> | undefined)?.value_per_daly_usd ?? 0) },
          } : undefined,
          infrastructure_stress_test: infraRaw ? {
            available_beds: Number(infraRaw.available_beds ?? 0), surge_admissions: Number(infraRaw.surge_admissions ?? 0),
            bed_deficit: Number(infraRaw.bed_deficit ?? 0), capacity_breach: Boolean(infraRaw.capacity_breach),
            infrastructure_bond_capex: Number(infraRaw.infrastructure_bond_capex ?? 0),
          } : undefined,
        });
      } catch (err) {
        console.error('[DT Scenario] Health scenario call failed:', err);
        setScenarioHealthResults(null);
      }
    }
  }, [isSplitMode, mode, scenarioStore.params]);

  const getCurrentSimulateHandler = useCallback(() => {
    // Wrap handlers: when in split mode, fire both baseline + scenario concurrently
    const baseHandler =
      mode === 'agriculture' ? handleSimulate
      : mode === 'coastal' ? handleCoastalSimulate
      : mode === 'health' ? handleHealthSimulate
      : handleFloodSimulate;

    if (!isSplitMode) return baseHandler;

    return async () => {
      await Promise.all([baseHandler(), fireScenarioCall()]);
    };
  }, [mode, isSplitMode, handleSimulate, handleCoastalSimulate, handleFloodSimulate, handleHealthSimulate, fireScenarioCall]);

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

  /** Advanced /agri compare handler — sets mode, twin, crops, location, year, then auto-simulates. */
  const handleAgriCompare = useCallback((payload: { crop1: string; crop2: string; location: string; coords: { lat: number; lng: number }; year: number }) => {
    // 1. Route to Agriculture
    setMode('agriculture');

    // 2. Enable Digital Twin
    setIsSplitMode(true);

    // 3. Set baseline crop (crop1)
    const crop1Lower = payload.crop1.toLowerCase();
    setCropType(crop1Lower);
    setCurrentCrop(payload.crop1);

    // 4. Set scenario crop (crop2) + year via scenario store
    scenarioStore.patch({
      cropType: payload.crop2.toLowerCase(),
      currentCrop: payload.crop2,
      proposedCrop: 'None',
      globalTempTarget: 1.4, // will be overridden by year calc below
    });

    // Calculate temp target from year using SSP3-7.0 anchors
    const yearNum = payload.year;
    let tempTarget = 1.4;
    if (yearNum <= 2026) tempTarget = 1.4;
    else if (yearNum <= 2030) tempTarget = 1.4 + (yearNum - 2026) * (1.5 - 1.4) / (2030 - 2026);
    else if (yearNum <= 2050) tempTarget = 1.5 + (yearNum - 2030) * (2.1 - 1.5) / (2050 - 2030);
    else tempTarget = 2.1;
    scenarioStore.patch({ globalTempTarget: Math.round(tempTarget * 100) / 100 });

    // 5. Map navigation — set marker + flyTo with smooth transition
    setMarkerPosition({ lat: payload.coords.lat, lng: payload.coords.lng });
    setViewState(prev => ({
      ...prev,
      longitude: payload.coords.lng,
      latitude: payload.coords.lat,
      zoom: 6,
      transitionDuration: 1200,
    }));
    setReverseLocationName(payload.location.charAt(0).toUpperCase() + payload.location.slice(1));

    // 6. Auto-trigger simulation — wait 1500ms for camera to land, then fire with fresh coords
    const freshCoords = { lat: payload.coords.lat, lng: payload.coords.lng };
    setTimeout(() => {
      Promise.all([handleSimulate(freshCoords), fireScenarioCall(freshCoords)]).catch(console.error);
    }, 1500);
  }, [scenarioStore, handleSimulate, fireScenarioCall]);

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--cb-bg)' }}>
      <CommandPalette
        onChangeMode={handleModeChange}
        onToggleTwin={() => setIsSplitMode(prev => !prev)}
        currentMode={mode}
        isSplitMode={isSplitMode}
        onAgriCompare={handleAgriCompare}
      />
      <div className="absolute inset-0">
        {isSplitMode ? (
          <DigitalTwinOverlay
            leftLabel="BASELINE (2026)"
            rightLabel="SCENARIO (2050)"
            leftMap={
              <div
                className="w-full h-full"
                onPointerEnter={() => { activeMapPane.current = 'left'; }}
                onPointerLeave={() => { if (activeMapPane.current === 'left') activeMapPane.current = null; }}
              >
                <MapView
                  onLocationSelect={handleLocationSelect}
                  markerPosition={markerPosition}
                  mapStyle={mapStyle}
                  showFloodOverlay={showFloodOverlay}
                  viewState={viewState}
                  onViewStateChange={handleLeftViewStateChange}
                  flyToTarget={flyToTarget}
                  zoneData={zoneData}
                  portfolioAssets={portfolioMapAssets}
                  onAtlasClick={handleAtlasClick}
                  atlasOverlay={atlasOverlay}
                  fitBoundsTarget={fitBoundsTarget}
                  usePortfolioAccentStyle={!!portfolioResults}
                />
              </div>
            }
            rightMap={
              <div
                className="w-full h-full"
                onPointerEnter={() => { activeMapPane.current = 'right'; }}
                onPointerLeave={() => { if (activeMapPane.current === 'right') activeMapPane.current = null; }}
              >
                <MapView
                  onLocationSelect={handleLocationSelect}
                  markerPosition={markerPosition}
                  mapStyle={mapStyle}
                  showFloodOverlay={showFloodOverlay}
                  viewState={viewState}
                  onViewStateChange={handleRightViewStateChange}
                  flyToTarget={flyToTarget}
                  scenarioLabel="With Adaptation"
                  isAdaptationScenario={true}
                  zoneData={zoneData}
                />
              </div>
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

      <DigitalTwinToggle isSplitMode={isSplitMode} onToggle={() => setIsSplitMode(!isSplitMode)} hasSecondaryPanel={mode === 'portfolio'} />

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
        expectedDowntimeDays={expectedDowntimeDays}
        onExpectedDowntimeDaysChange={setExpectedDowntimeDays}
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
        currentCrop={currentCrop}
        onCurrentCropChange={setCurrentCrop}
        proposedCrop={proposedCrop}
        onProposedCropChange={setProposedCrop}
        transitionCapex={results.transitionCapex}
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
        onFloodSimulate={isSplitMode ? async () => { await Promise.all([handleFloodSimulate(), fireScenarioCall()]); } : handleFloodSimulate}
        isFloodSimulating={isFloodSimulating}
        totalSLR={totalSLR}
        onTotalSLRChange={setTotalSLR}
        includeStormSurge={includeStormSurge}
        onIncludeStormSurgeChange={setIncludeStormSurge}
        coastalSelectedYear={coastalSelectedYear}
        onCoastalSelectedYearChange={setCoastalSelectedYear}
        onCoastalSimulate={isSplitMode ? async () => { await Promise.all([handleCoastalSimulate(), fireScenarioCall()]); } : handleCoastalSimulate}
        isCoastalSimulating={isCoastalSimulating}
        healthTempTarget={healthTempTarget}
        onHealthTempTargetChange={setHealthTempTarget}
        healthSelectedYear={healthSelectedYear}
        onHealthSelectedYearChange={setHealthSelectedYear}
        onHealthSimulate={isSplitMode ? async () => { await Promise.all([handleHealthSimulate(), fireScenarioCall()]); } : handleHealthSimulate}
        isHealthSimulating={isHealthSimulating}
        healthIntervention={healthIntervention}
        onHealthInterventionChange={setHealthIntervention}
        coolingCapex={coolingCapex}
        onCoolingCapexChange={setCoolingCapex}
        coolingOpex={coolingOpex}
        onCoolingOpexChange={setCoolingOpex}
        populationSize={populationSize}
        onPopulationSizeChange={setPopulationSize}
        gdpPerCapita={gdpPerCapita}
        onGdpPerCapitaChange={setGdpPerCapita}
        economyTier={economyTier}
        onEconomyTierChange={setEconomyTier}
        customBedsPer1000={customBedsPer1000}
        onCustomBedsPer1000Change={setCustomBedsPer1000}
        onPortfolioResultsChange={setPortfolioResults}
        coastalAdjustedLifespan={coastalResults.adjustedLifespan ?? undefined}
        floodAdjustedLifespan={floodResults.adjustedLifespan ?? undefined}
        baseAnnualOpex={baseAnnualOpex}
        onBaseAnnualOpexChange={setBaseAnnualOpex}
        coastalAdjustedOpex={coastalResults.adjustedOpex ?? undefined}
        floodAdjustedOpex={floodResults.adjustedOpex ?? undefined}
      />

      {/* Desktop Right Panel — simulation results */}
      <RightPanel
        visible={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        mode={mode}
        locationName={atlasLocationName || reverseLocationName || 'Unknown Location'}
        latitude={markerPosition?.lat ?? null}
        longitude={markerPosition?.lng ?? null}
        isLoading={isCurrentlySimulating || (mode === 'finance' && isFinanceSimulating) || isPolygonSimulating}
        showResults={showCurrentResults || showHealthResults || polygonExposurePct != null}
        agricultureResults={
          mode === 'agriculture'
            ? {
                avoidedLoss: results.avoidedLoss,
                transitionCapex: results.transitionCapex,
                riskReduction: results.riskReduction,
                yieldPotential: results.yieldPotential,
                avoidedRevenueLoss: results.avoidedRevenueLoss,
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
        ndviData={mode === 'agriculture' ? ndviData : undefined}
        isNdviLoading={mode === 'agriculture' && isNdviLoading}
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
        polygonTotalArea={polygonTotalArea}
        polygonExposedArea={polygonExposedArea}
        polygonTotalAssetValue={polygonTotalAssetValue}
        polygonExposedValue={polygonExposedValue}
        polygonValueAtRisk={polygonValueAtRisk}
        polygonProtectedValue={polygonProtectedValue}
        portfolioResults={portfolioResults}
        priceShockData={mode === 'agriculture' ? priceShockData : undefined}
        isSplitMode={isSplitMode}
        scenarioAgriResults={mode === 'agriculture' && scenarioAgriResults ? {
          avoidedLoss: scenarioAgriResults.avoidedLoss,
          transitionCapex: scenarioAgriResults.transitionCapex,
          riskReduction: scenarioAgriResults.riskReduction,
          yieldPotential: scenarioAgriResults.yieldPotential,
          avoidedRevenueLoss: scenarioAgriResults.avoidedRevenueLoss,
          monthlyData: scenarioAgriResults.monthlyData,
        } : undefined}
        scenarioCoastalResults={mode === 'coastal' ? scenarioCoastalResults ?? undefined : undefined}
        scenarioFloodResults={mode === 'flood' ? scenarioFloodResults ?? undefined : undefined}
        scenarioHealthResults={scenarioHealthResults}
      />

      {/* Portfolio left panel content (desktop) */}
      {mode === 'portfolio' && (
        <div
          className="hidden md:flex absolute top-0 left-[360px] h-full flex-col z-20 border-r overflow-y-auto"
          style={{ width: 280, backgroundColor: 'var(--cb-bg)', borderColor: 'var(--cb-border)' }}
        >
          <PortfolioHeader onModeChange={handleModeChange} />
          <PortfolioPanel onAssetsChange={setPortfolioAssets} onPortfolioResultsChange={setPortfolioResults} />
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
          expectedDowntimeDays,
          onExpectedDowntimeDaysChange: setExpectedDowntimeDays,
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
          currentCrop,
          onCurrentCropChange: setCurrentCrop,
          proposedCrop,
          onProposedCropChange: setProposedCrop,
          transitionCapex: results.transitionCapex,
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
          healthIntervention,
          onHealthInterventionChange: setHealthIntervention,
          coolingCapex,
          onCoolingCapexChange: setCoolingCapex,
          coolingOpex,
          onCoolingOpexChange: setCoolingOpex,
          populationSize,
          onPopulationSizeChange: setPopulationSize,
          gdpPerCapita,
          onGdpPerCapitaChange: setGdpPerCapita,
          economyTier,
          onEconomyTierChange: setEconomyTier,
          customBedsPer1000,
          onCustomBedsPer1000Change: setCustomBedsPer1000,
          onPortfolioResultsChange: setPortfolioResults,
          propertyValue,
          onPropertyValueChange: setPropertyValue,
          selectedYear,
          coastalAdjustedLifespan: coastalResults?.adjustedLifespan ?? undefined,
          floodAdjustedLifespan: floodResults?.adjustedLifespan ?? undefined,
          baseAnnualOpex,
          onBaseAnnualOpexChange: setBaseAnnualOpex,
          coastalAdjustedOpex: coastalResults?.adjustedOpex ?? undefined,
          floodAdjustedOpex: floodResults?.adjustedOpex ?? undefined,
        }}
        rightPanelContentProps={{
          locationName: atlasLocationName,
          latitude: markerPosition?.lat ?? null,
          longitude: markerPosition?.lng ?? null,
          isLoading: isCurrentlySimulating || (mode === 'finance' && isFinanceSimulating),
          showResults: showCurrentResults || showHealthResults,
          agricultureResults: mode === 'agriculture' ? {
            avoidedLoss: results.avoidedLoss,
            transitionCapex: results.transitionCapex,
            riskReduction: results.riskReduction,
            yieldPotential: results.yieldPotential,
            avoidedRevenueLoss: results.avoidedRevenueLoss,
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
          ndviData: mode === 'agriculture' ? ndviData : undefined,
          isNdviLoading: mode === 'agriculture' && isNdviLoading,
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
          polygonTotalArea,
          polygonExposedArea,
          polygonTotalAssetValue,
          polygonExposedValue,
          polygonValueAtRisk,
          polygonProtectedValue,
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
