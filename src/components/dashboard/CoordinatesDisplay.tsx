import { MapPin } from 'lucide-react';

interface CoordinatesDisplayProps {
  latitude: number | null;
  longitude: number | null;
}

export const CoordinatesDisplay = ({ latitude, longitude }: CoordinatesDisplayProps) => {
  const hasCoordinates = latitude !== null && longitude !== null;

  if (!hasCoordinates) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs px-1">
        <MapPin className="w-3.5 h-3.5" />
        <span>Click map to select location</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs px-1">
      <MapPin className="w-3.5 h-3.5 text-safe" />
      <div className="flex items-center gap-2 font-mono text-muted-foreground">
        <span>{latitude?.toFixed(4)}°</span>
        <span className="text-border">|</span>
        <span>{longitude?.toFixed(4)}°</span>
      </div>
    </div>
  );
};
