import { useState, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MapView, MapStyle } from "@/components/dashboard/MapView";
import { DashboardMode } from "@/components/dashboard/ModeSelector";
import { toast } from "@/hooks/use-toast";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockMonthlyData = [
  { month: "Jan", value: 45 },
  { month: "Feb", value: 52 },
  { month: "Mar", value: 78 },
  { month: "Apr", value: 85 },
  { month: "May", value: 92 },
  { month: "Jun", value: 88 },
  { month: "Jul", value: 65 },
  { month: "Aug", value: 55 },
  { month: "Sep", value: 48 },
  { month: "Oct", value: 42 },
  { month: "Nov", value: 38 },
  { month: "Dec", value: 35 },
];

// API Endpoints
const COASTAL_API_URL = "https://web-production-8ff9e.up.railway.app/predict-coastal";
const FLOOD_API_URL = "https://web-production-8ff9e.up.railway.app/predict-flood";

const Index = () => {
  const [mode, setMode] = useState<DashboardMode>("agriculture");
  const [cropType, setCropType] = useState("maize");
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

  const [floodResults, setFloodResults] = useState({
    floodDepthReduction: 0,
    valueProtected: 0,
  });

  // Determine map style based on mode
  const mapStyle: MapStyle = mode === "coastal" ? "satellite" : mode === "flood" ? "flood" : "dark";
  const showFloodOverlay = mode === "flood" && markerPosition !== null;

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!markerPosition) return;

    setIsSimulating(true);
    setShowResults(false);

    try {
      const response = await fetch("https://primary-production-679e.up.railway.app/webhook/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      const result = Array.isArray(responseData) ? responseData[0] : responseData;
      const analysis = result?.data?.analysis;
      const predictions = result?.data?.predictions;

      if (!analysis || !predictions) {
        throw new Error("Invalid response format from simulation API");
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
      console.error("Simulation failed:", error);
      toast({
        title: "Simulation Failed",
        description:
          error instanceof Error ? error.message : "Unable to connect to the simulation server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  }, [markerPosition, cropType]);

  const handleCoastalSimulate = useCallback(
    async (width: number) => {
      if (!markerPosition) return;

      setIsCoastalSimulating(true);

      try {
        const response = await fetch(COASTAL_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lat: markerPosition.lat,
            lon: markerPosition.lng,
            mangrove_width: width,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Coastal API response:", JSON.stringify(responseData, null, 2));

        const data = responseData.data;
        const rawSlope = data.slope;
        const rawStormWave = data.storm_wave;
        const rawAvoidedLoss = data.avoided_loss;

        console.log(
          "Parsed coastal data - slope:",
          rawSlope,
          "stormWave:",
          rawStormWave,
          "avoided_loss:",
          rawAvoidedLoss,
        );

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
        console.error("Coastal simulation failed:", error);
        setCoastalResults({
          avoidedLoss: Math.round(propertyValue * (width / 500) * 0.5),
          slope: null,
          stormWave: null,
        });
        setShowCoastalResults(true);
        toast({
          title: "Using Estimated Values",
          description: "Could not reach the coastal simulation API. Showing estimated values.",
          variant: "default",
        });
      } finally {
        setIsCoastalSimulating(false);
      }
    },
    [markerPosition, propertyValue],
  );

  const getInterventionType = useCallback(() => {
    // Derive a toolkit list from our current UI toggles so we can reuse
    // the backend team's robust string-matching logic.
    const selectedToolkits: string[] = [
      ...(greenRoofsEnabled ? ["Install Green Roofs"] : []),
      ...(permeablePavementEnabled ? ["Permeable Pavement"] : []),
    ];

    // Check what's actually in selectedToolkits
    console.log("🔍 Selected toolkits:", selectedToolkits);

    if (!selectedToolkits || selectedToolkits.length === 0) {
      console.log("⚠️ No toolkit selected, using green_roof as default");
      return "green_roof";
    }

    // Convert to lowercase for comparison
    const toolkitsLower = selectedToolkits.map((t) => t.toLowerCase());

    // Check for green roofs
    if (toolkitsLower.some((t) => t.includes("green") && t.includes("roof"))) {
      console.log("✅ Using: green_roof");
      return "green_roof";
    }

    // Check for permeable pavement
    if (toolkitsLower.some((t) => t.includes("permeable") || t.includes("pavement"))) {
      console.log("✅ Using: permeable_pavement");
      return "permeable_pavement";
    }

    // Check for bioswales
    if (toolkitsLower.some((t) => t.includes("bioswale"))) {
      console.log("✅ Using: bioswales");
      return "bioswales";
    }

    // Check for rain gardens
    if (toolkitsLower.some((t) => t.includes("rain") && t.includes("garden"))) {
      console.log("✅ Using: rain_gardens");
      return "rain_gardens";
    }

    // Default to green_roof if nothing matches
    console.log("⚠️ No match found, defaulting to green_roof");
    return "green_roof";
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

      console.log("🚀 Flood simulation - Sending to:", FLOOD_API_URL);
      console.log("📦 Payload:", payload);

      const response = await fetch(FLOOD_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("✅ Flood API response:", JSON.stringify(responseData, null, 2));

      // Extract values using the correct response path
      const analysis = responseData.data?.analysis || responseData.analysis || responseData;
      const avoidedLoss = analysis.avoided_loss ?? 0;
      const floodDepthReduction = analysis.avoided_depth_cm ?? 0;
      const percentageImprovement = analysis.percentage_improvement ?? 0;

      console.log("💰 Avoided Loss:", avoidedLoss);
      console.log("📏 Depth Reduction:", floodDepthReduction, "cm");
      console.log("📈 Improvement:", percentageImprovement, "%");

      setFloodResults({
        floodDepthReduction: Math.round(floodDepthReduction * 10) / 10,
        valueProtected: Math.round(avoidedLoss * 100) / 100,
      });
      setShowFloodResults(true);
    } catch (error) {
      console.error("❌ Flood simulation failed:", error);
      // Fallback calculation for demo
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
        title: "Using Estimated Values",
        description: "Could not reach the flood simulation API. Showing estimated values.",
        variant: "default",
      });
    } finally {
      setIsFloodSimulating(false);
    }
  }, [markerPosition, buildingValue, greenRoofsEnabled, permeablePavementEnabled, getInterventionType]);

  // Trigger flood simulation when toggles change
  const handleGreenRoofsChange = useCallback((enabled: boolean) => {
    setGreenRoofsEnabled(enabled);
    if (markerPosition) {
      // Trigger simulation after state updates
      setTimeout(() => {
        handleFloodSimulate();
      }, 100);
    }
  }, [markerPosition, handleFloodSimulate]);

  const handlePermeablePavementChange = useCallback((enabled: boolean) => {
    setPermeablePavementEnabled(enabled);
    if (markerPosition) {
      setTimeout(() => {
        handleFloodSimulate();
      }, 100);
    }
  }, [markerPosition, handleFloodSimulate]);

  const handleMangroveWidthChange = useCallback((value: number) => {
    setMangroveWidth(value);
  }, []);

  const handleMangroveWidthChangeEnd = useCallback(
    (value: number) => {
      if (markerPosition) {
        handleCoastalSimulate(value);
      }
    },
    [markerPosition, handleCoastalSimulate],
  );

  const handleModeChange = useCallback((newMode: DashboardMode) => {
    setMode(newMode);
    setShowResults(false);
    setShowCoastalResults(false);
    setShowFloodResults(false);
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

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
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
          buildingValue={buildingValue}
          onBuildingValueChange={setBuildingValue}
          greenRoofsEnabled={greenRoofsEnabled}
          onGreenRoofsChange={handleGreenRoofsChange}
          permeablePavementEnabled={permeablePavementEnabled}
          onPermeablePavementChange={handlePermeablePavementChange}
          onFloodSimulate={handleFloodSimulate}
          isFloodSimulating={isFloodSimulating}
          showFloodResults={showFloodResults}
          floodResults={floodResults}
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
          showFloodOverlay={showFloodOverlay}
        />
      </main>
    </div>
  );
};

export default Index;
