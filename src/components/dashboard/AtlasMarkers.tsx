import { useState, useMemo } from 'react';
import { Leaf, Waves, Droplet, Cross } from 'lucide-react';
import { GLOBAL_ATLAS_DATA } from '@/data/globalAtlas';

type AtlasItem = (typeof GLOBAL_ATLAS_DATA)[number];

export interface AtlasClickData {
  lat: number;
  lng: number;
  projectType: string;
  cropType: string | null;
  item: AtlasItem;
}

const getIcon = (projectType: string) => {
  switch (projectType) {
    case 'agriculture': return Leaf;
    case 'coastal': return Waves;
    case 'flood': return Droplet;
    case 'health': return Cross;
    default: return Droplet;
  }
};

const getRiskCategory = (item: AtlasItem): string | null => {
  if ('flood_risk' in item && item.flood_risk) return (item.flood_risk as any).risk_category ?? null;
  if ('malaria_risk' in item && item.malaria_risk) return (item.malaria_risk as any).risk_category ?? null;
  if ('productivity_analysis' in item && item.productivity_analysis) return (item.productivity_analysis as any).heat_stress_category ?? null;
  return null;
};

const getMarkerColor = (item: AtlasItem): string => {
  const npv = 'financial_analysis' in item ? (item.financial_analysis as any)?.npv_usd : null;
  const risk = getRiskCategory(item);

  if ((npv !== null && npv < 0) || risk === 'High' || risk === 'Extreme') return '#EF4444';
  if (risk === 'Moderate') return '#FACC15';
  return '#4ADE80';
};

const getNpvDisplay = (item: AtlasItem): string => {
  if ('financial_analysis' in item && item.financial_analysis) {
    const npv = (item.financial_analysis as any).npv_usd;
    if (npv >= 1_000_000) return `$${(npv / 1_000_000).toFixed(1)}M`;
    if (npv >= 1_000) return `$${(npv / 1_000).toFixed(0)}K`;
    return `$${npv.toFixed(0)}`;
  }
  const risk = getRiskCategory(item);
  return risk ?? 'N/A';
};

interface AtlasMarkerPinWithOverlayProps {
  item: AtlasItem;
  Marker: any;
  onClick: (data: AtlasClickData) => void;
  color: string;
  overlayLabel: string;
  overlayType: MapOverlay;
}

const OVERLAY_LABELS: Record<MapOverlay, string> = {
  NPV: 'NPV',
  RATING: 'Risk',
  WATER: 'Rainfall',
};

const AtlasMarkerPinWithOverlay = ({ item, Marker, onClick, color, overlayLabel, overlayType }: AtlasMarkerPinWithOverlayProps) => {
  const [hovered, setHovered] = useState(false);
  const Icon = getIcon(item.project_type);
  const name = item.target.name;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick({
      lat: item.location.lat,
      lng: item.location.lon,
      projectType: item.project_type,
      cropType: item.target.crop_type,
      item,
    });
  };

  return (
    <Marker
      longitude={item.location.lon}
      latitude={item.location.lat}
      anchor="center"
      onClick={handleClick}
    >
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
      >
        {/* Pin */}
        <div
          className="flex items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-150"
          style={{
            width: 28,
            height: 28,
            backgroundColor: `${color}22`,
            borderColor: color,
            transform: hovered ? 'scale(1.3)' : 'scale(1)',
          }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2.5} />
        </div>

        {/* Tooltip */}
        {hovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
            <div className="bg-black/85 backdrop-blur-md text-white text-[10px] leading-tight px-2.5 py-1.5 rounded-lg border border-white/10 shadow-xl whitespace-nowrap">
              <div className="font-semibold text-[11px]">{name}</div>
              <div className="text-white/70 mt-0.5">
                {OVERLAY_LABELS[overlayType]}: <span className="font-mono" style={{ color }}>{overlayLabel}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Marker>
  );
};

export type SectorFilter = 'ALL' | 'AGRICULTURE' | 'COASTAL' | 'FLOOD';
export type MapOverlay = 'NPV' | 'RATING' | 'WATER';

interface AtlasMarkersProps {
  Marker: any;
  onAtlasClick: (data: AtlasClickData) => void;
  sectorFilter?: SectorFilter;
  mapOverlay?: MapOverlay;
}

const getWaterStressColor = (item: AtlasItem): string => {
  const rainfall = 'climate_conditions' in item ? (item.climate_conditions as any)?.rainfall_mm : null;
  if (rainfall === null || rainfall === undefined) return '#4ADE80';
  if (rainfall < 500) return '#EF4444';
  if (rainfall < 1200) return '#FACC15';
  return '#4ADE80';
};

const getRatingColor = (item: AtlasItem): string => {
  const risk = getRiskCategory(item);
  if (risk === 'High' || risk === 'Extreme') return '#EF4444';
  if (risk === 'Moderate') return '#FACC15';
  return '#4ADE80';
};

const getOverlayColor = (item: AtlasItem, overlay: MapOverlay): string => {
  if (overlay === 'RATING') return getRatingColor(item);
  if (overlay === 'WATER') return getWaterStressColor(item);
  return getMarkerColor(item);
};

const getOverlayLabel = (item: AtlasItem, overlay: MapOverlay): string => {
  if (overlay === 'RATING') {
    const risk = getRiskCategory(item);
    return risk ?? 'N/A';
  }
  if (overlay === 'WATER') {
    const rainfall = 'climate_conditions' in item ? (item.climate_conditions as any)?.rainfall_mm : null;
    if (rainfall === null || rainfall === undefined) return 'N/A';
    return `${Math.round(rainfall)} mm`;
  }
  return getNpvDisplay(item);
};

export const AtlasMarkers = ({ Marker, onAtlasClick, sectorFilter = 'ALL', mapOverlay = 'NPV' }: AtlasMarkersProps) => {
  const markers = useMemo(() => {
    const filtered = sectorFilter === 'ALL'
      ? GLOBAL_ATLAS_DATA
      : GLOBAL_ATLAS_DATA.filter((item) => item.project_type === sectorFilter.toLowerCase());

    return filtered.map((item, i) => {
      const color = getOverlayColor(item, mapOverlay);
      const overlayLabel = getOverlayLabel(item, mapOverlay);
      return (
        <AtlasMarkerPinWithOverlay
          key={`${sectorFilter}-${mapOverlay}-${i}`}
          item={item}
          Marker={Marker}
          onClick={onAtlasClick}
          color={color}
          overlayLabel={overlayLabel}
          overlayType={mapOverlay}
        />
      );
    });
  }, [Marker, onAtlasClick, sectorFilter, mapOverlay]);

  return <>{markers}</>;
};
