import { useCallback, useState, useEffect, useRef } from 'react';
import { MapPin, Map as MapIcon, CircleAlert as AlertCircle } from 'lucide-react';
import { Polygon, polygonToGeoJSON, createRingDifferenceGeoJSON, calculatePolygonArea } from '@/utils/polygonMath';
import { ZoneMode } from '@/utils/zoneGeneration';
import { getZoneColors } from '@/utils/zoneMorphing';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGF2aWRpemkiLCJhIjoiY21rd2dzeHN6MDFoYzNkcXYxOHZ0YXRuNCJ9.P_g5wstTHNzglNEQfHIoBg';

export type MapStyle = 'dark' | 'satellite' | 'flood';

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

const MAP_STYLES: Record<MapStyle, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  flood: 'mapbox://styles/mapbox/dark-v11',
};

export interface ZoneData {
  baselineZone: Polygon | null;
  currentZone: Polygon | null;
  temperature: number;
  mode: ZoneMode;
}

interface MapViewProps {
  onLocationSelect: (lat: number, lng: number) => void;
  markerPosition: { lat: number; lng: number } | null;
  mapStyle?: MapStyle;
  showFloodOverlay?: boolean;
  viewState?: ViewState;
  onViewStateChange?: (viewState: ViewState) => void;
  scenarioLabel?: string;
  isAdaptationScenario?: boolean;
  zoneData?: ZoneData;
}

const DEFAULT_VIEW_STATE: ViewState = {
  longitude: 37.9062,
  latitude: -0.0236,
  zoom: 5,
  pitch: 0,
  bearing: 0,
};

const ZONE_LAYERS = {
  BASELINE_SOURCE: 'baseline-zone-source',
  BASELINE_OUTLINE: 'baseline-zone-outline',
  CURRENT_SOURCE: 'current-zone-source',
  CURRENT_FILL: 'current-zone-fill',
  LOSS_SOURCE: 'loss-zone-source',
  LOSS_FILL: 'loss-zone-fill',
};

const LazyMap = ({
  onLocationSelect,
  markerPosition,
  mapStyle = 'dark',
  showFloodOverlay = false,
  viewState: externalViewState,
  onViewStateChange,
  scenarioLabel,
  isAdaptationScenario = false,
  zoneData,
}: MapViewProps) => {
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [internalViewState, setInternalViewState] = useState<ViewState>(DEFAULT_VIEW_STATE);
  const mapRef = useRef<any>(null);
  const layersAdded = useRef(false);

  const viewState = externalViewState ?? internalViewState;

  useEffect(() => {
    const loadMap = async () => {
      try {
        await import('mapbox-gl/dist/mapbox-gl.css');
        const reactMapGl = await import('react-map-gl');
        setMapComponents({
          Map: reactMapGl.Map,
          Marker: reactMapGl.Marker,
          NavigationControl: reactMapGl.NavigationControl,
          ScaleControl: reactMapGl.ScaleControl,
        });
      } catch (err) {
        console.error('Failed to load map:', err);
        setError('Failed to load map components');
      }
    };
    loadMap();
  }, []);

  const updateZoneLayers = useCallback((map: any) => {
    if (!map || !zoneData) return;

    const { baselineZone, currentZone, temperature, mode } = zoneData;
    const colors = getZoneColors(mode, temperature);

    if (!map.getSource(ZONE_LAYERS.BASELINE_SOURCE)) {
      map.addSource(ZONE_LAYERS.BASELINE_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: ZONE_LAYERS.BASELINE_OUTLINE,
        type: 'line',
        source: ZONE_LAYERS.BASELINE_SOURCE,
        paint: {
          'line-color': colors.baselineOutlineColor,
          'line-width': 2.5,
          'line-dasharray': [4, 3],
          'line-opacity': 0.85,
        },
      });
    }

    if (!map.getSource(ZONE_LAYERS.LOSS_SOURCE)) {
      map.addSource(ZONE_LAYERS.LOSS_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: ZONE_LAYERS.LOSS_FILL,
        type: 'fill',
        source: ZONE_LAYERS.LOSS_SOURCE,
        paint: {
          'fill-color': colors.lossColor,
          'fill-opacity': 0.55,
        },
      });
    }

    if (!map.getSource(ZONE_LAYERS.CURRENT_SOURCE)) {
      map.addSource(ZONE_LAYERS.CURRENT_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: ZONE_LAYERS.CURRENT_FILL,
        type: 'fill',
        source: ZONE_LAYERS.CURRENT_SOURCE,
        paint: {
          'fill-color': colors.fillColor,
          'fill-opacity': colors.fillOpacity,
        },
      });
    }

    layersAdded.current = true;

    if (baselineZone) {
      const baselineGeoJSON = polygonToGeoJSON(baselineZone);
      map.getSource(ZONE_LAYERS.BASELINE_SOURCE)?.setData(baselineGeoJSON);
      map.setPaintProperty(ZONE_LAYERS.BASELINE_OUTLINE, 'line-color', colors.baselineOutlineColor);
    } else {
      map.getSource(ZONE_LAYERS.BASELINE_SOURCE)?.setData({ type: 'FeatureCollection', features: [] });
    }

    if (currentZone) {
      const currentGeoJSON = polygonToGeoJSON(currentZone);
      map.getSource(ZONE_LAYERS.CURRENT_SOURCE)?.setData(currentGeoJSON);
      map.setPaintProperty(ZONE_LAYERS.CURRENT_FILL, 'fill-color', colors.fillColor);
      map.setPaintProperty(ZONE_LAYERS.CURRENT_FILL, 'fill-opacity', colors.fillOpacity);
    } else {
      map.getSource(ZONE_LAYERS.CURRENT_SOURCE)?.setData({ type: 'FeatureCollection', features: [] });
    }

    if (baselineZone && currentZone && temperature > 0) {
      const baseArea = calculatePolygonArea(baselineZone);
      const currentArea = calculatePolygonArea(currentZone);

      let lossGeoJSON: GeoJSON.Feature<GeoJSON.Polygon> | null = null;

      if (mode === 'flood') {
        lossGeoJSON = createRingDifferenceGeoJSON(currentZone, baselineZone);
      } else {
        if (currentArea < baseArea) {
          lossGeoJSON = createRingDifferenceGeoJSON(baselineZone, currentZone);
        }
      }

      if (lossGeoJSON) {
        map.getSource(ZONE_LAYERS.LOSS_SOURCE)?.setData(lossGeoJSON);
        map.setPaintProperty(ZONE_LAYERS.LOSS_FILL, 'fill-color', colors.lossColor);
      } else {
        map.getSource(ZONE_LAYERS.LOSS_SOURCE)?.setData({ type: 'FeatureCollection', features: [] });
      }
    } else {
      map.getSource(ZONE_LAYERS.LOSS_SOURCE)?.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [zoneData]);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (map && map.isStyleLoaded()) {
      updateZoneLayers(map);
    }
  }, [zoneData, updateZoneLayers]);

  const handleMapLoad = useCallback((event: any) => {
    const map = event.target;
    mapRef.current = { getMap: () => map };
    if (zoneData) {
      updateZoneLayers(map);
    }
  }, [zoneData, updateZoneLayers]);

  const handleClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    onLocationSelect(lat, lng);
  }, [onLocationSelect]);

  const handleMove = useCallback((evt: any) => {
    const newViewState = evt.viewState as ViewState;
    if (onViewStateChange) {
      onViewStateChange(newViewState);
    } else {
      setInternalViewState(newViewState);
    }
  }, [onViewStateChange]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary/50">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-risk mx-auto" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!MapComponents) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary/50">
        <div className="text-center space-y-3 animate-pulse">
          <MapIcon className="w-12 h-12 text-accent mx-auto" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  const { Map, Marker, NavigationControl, ScaleControl } = MapComponents;

  return (
    <Map
      {...viewState}
      onMove={handleMove}
      onClick={handleClick}
      onLoad={handleMapLoad}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={MAP_STYLES[mapStyle]}
      style={{ width: '100%', height: '100%' }}
      cursor="crosshair"
      ref={mapRef}
    >
      <NavigationControl position="top-right" showCompass={true} />
      <ScaleControl position="bottom-right" />

      {scenarioLabel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-black/60 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full border border-white/20 shadow-lg">
            {scenarioLabel}
          </div>
        </div>
      )}

      {markerPosition && (
        <Marker
          longitude={markerPosition.lng}
          latitude={markerPosition.lat}
          anchor="bottom"
        >
          <div className="relative animate-bounce">
            <MapPin
              className={`w-10 h-10 drop-shadow-lg ${
                isAdaptationScenario
                  ? "text-emerald-500"
                  : "text-risk"
              }`}
              fill={isAdaptationScenario ? "hsl(142 76% 36%)" : "hsl(24 100% 58%)"}
            />
            <div className={`absolute inset-0 w-10 h-10 rounded-full blur-xl -z-10 ${
              isAdaptationScenario
                ? "bg-emerald-500/30"
                : "bg-risk/30"
            }`} />
          </div>
        </Marker>
      )}

      {showFloodOverlay && markerPosition && !zoneData?.baselineZone && (
        <Marker
          longitude={markerPosition.lng}
          latitude={markerPosition.lat}
          anchor="center"
        >
          <div
            className="rounded-full pointer-events-none"
            style={{
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.3) 40%, rgba(59, 130, 246, 0.1) 70%, transparent 100%)',
            }}
          />
        </Marker>
      )}
    </Map>
  );
};

export const MapView = ({
  onLocationSelect,
  markerPosition,
  mapStyle = 'dark',
  showFloodOverlay = false,
  viewState,
  onViewStateChange,
  scenarioLabel,
  isAdaptationScenario = false,
  zoneData,
}: MapViewProps) => {
  return (
    <div className="relative w-full h-full">
      <LazyMap
        onLocationSelect={onLocationSelect}
        markerPosition={markerPosition}
        mapStyle={mapStyle}
        showFloodOverlay={showFloodOverlay}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        scenarioLabel={scenarioLabel}
        isAdaptationScenario={isAdaptationScenario}
        zoneData={zoneData}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/30 to-transparent" />
      </div>
    </div>
  );
};
