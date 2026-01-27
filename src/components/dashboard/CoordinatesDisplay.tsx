import { MapPin, Navigation } from 'lucide-react';

interface CoordinatesDisplayProps {
  latitude: number | null;
  longitude: number | null;
}

export const CoordinatesDisplay = ({ latitude, longitude }: CoordinatesDisplayProps) => {
  const hasCoordinates = latitude !== null && longitude !== null;

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium text-muted-foreground">Selected Coordinates</span>
      </div>
      
      {hasCoordinates ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground block mb-1">Latitude</span>
            <span className="text-lg font-semibold text-white tabular-nums">
              {latitude?.toFixed(6)}
            </span>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground block mb-1">Longitude</span>
            <span className="text-lg font-semibold text-white tabular-nums">
              {longitude?.toFixed(6)}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground bg-secondary/30 rounded-lg p-4">
          <Navigation className="w-5 h-5" />
          <span className="text-sm">Click on the map to select a location</span>
        </div>
      )}
    </div>
  );
};
