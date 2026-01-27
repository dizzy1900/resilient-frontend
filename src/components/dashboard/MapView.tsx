import { useCallback, useState } from 'react';
// @ts-ignore - react-map-gl types may not be available
import Map, { Marker, NavigationControl, ScaleControl } from 'react-map-gl';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGF2aWRpemkiLCJhIjoiY21rd2dzeHN6MDFoYzNkcXYxOHZ0YXRuNCJ9.P_g5wstTHNzglNEQfHIoBg';

interface MapViewProps {
  onLocationSelect: (lat: number, lng: number) => void;
  markerPosition: { lat: number; lng: number } | null;
}

export const MapView = ({ onLocationSelect, markerPosition }: MapViewProps) => {
  const [viewState, setViewState] = useState({
    longitude: 37.9062,
    latitude: -0.0236,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  });

  const handleClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    onLocationSelect(lat, lng);
  }, [onLocationSelect]);

  return (
    <div className="relative w-full h-full">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
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
      </Map>
      
      {/* Map overlay gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/30 to-transparent" />
      </div>
    </div>
  );
};
