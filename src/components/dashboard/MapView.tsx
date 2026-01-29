import { useCallback, useState, useEffect } from 'react';
import { MapPin, Map as MapIcon, AlertCircle } from 'lucide-react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGF2aWRpemkiLCJhIjoiY21rd2dzeHN6MDFoYzNkcXYxOHZ0YXRuNCJ9.P_g5wstTHNzglNEQfHIoBg';

export type MapStyle = 'dark' | 'satellite' | 'flood';

const MAP_STYLES: Record<MapStyle, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  flood: 'mapbox://styles/mapbox/dark-v11',
};

interface MapViewProps {
  onLocationSelect: (lat: number, lng: number) => void;
  markerPosition: { lat: number; lng: number } | null;
  mapStyle?: MapStyle;
  showFloodOverlay?: boolean;
}

// Lazy load the map to prevent SSR issues
const LazyMap = ({ onLocationSelect, markerPosition, mapStyle = 'dark', showFloodOverlay = false }: MapViewProps) => {
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 37.9062,
    latitude: -0.0236,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    const loadMap = async () => {
      try {
        // Import mapbox-gl CSS
        await import('mapbox-gl/dist/mapbox-gl.css');
        // Import react-map-gl
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

  const handleClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    onLocationSelect(lat, lng);
  }, [onLocationSelect]);

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
      onMove={(evt: any) => setViewState(evt.viewState)}
      onClick={handleClick}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={MAP_STYLES[mapStyle]}
      style={{ width: '100%', height: '100%' }}
      cursor="crosshair"
    >
      <NavigationControl position="top-right" showCompass={true} />
      <ScaleControl position="bottom-right" />
      
      {markerPosition && (
        <Marker
          longitude={markerPosition.lng}
          latitude={markerPosition.lat}
          anchor="bottom"
        >
          <div className="relative animate-bounce">
            <MapPin className="w-10 h-10 text-risk drop-shadow-lg" fill="hsl(24 100% 58%)" />
            <div className="absolute inset-0 w-10 h-10 bg-risk/30 rounded-full blur-xl -z-10" />
          </div>
        </Marker>
      )}

      {/* Flood risk heatmap overlay */}
      {showFloodOverlay && markerPosition && (
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

export const MapView = ({ onLocationSelect, markerPosition, mapStyle = 'dark', showFloodOverlay = false }: MapViewProps) => {
  return (
    <div className="relative w-full h-full">
      <LazyMap 
        onLocationSelect={onLocationSelect} 
        markerPosition={markerPosition} 
        mapStyle={mapStyle}
        showFloodOverlay={showFloodOverlay}
      />
      
      {/* Map overlay gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/30 to-transparent" />
      </div>
    </div>
  );
};