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

interface AtlasMarkerPinProps {
  item: AtlasItem;
  Marker: any;
  onClick: (data: AtlasClickData) => void;
}

const AtlasMarkerPin = ({ item, Marker, onClick }: AtlasMarkerPinProps) => {
  const [hovered, setHovered] = useState(false);
  const color = getMarkerColor(item);
  const Icon = getIcon(item.project_type);
  const name = item.target.name;
  const npvDisplay = getNpvDisplay(item);

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
                NPV: <span className="font-mono" style={{ color }}>{npvDisplay}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Marker>
  );
};

interface AtlasMarkersProps {
  Marker: any;
  onAtlasClick: (data: AtlasClickData) => void;
}

export const AtlasMarkers = ({ Marker, onAtlasClick }: AtlasMarkersProps) => {
  const markers = useMemo(
    () =>
      GLOBAL_ATLAS_DATA.map((item, i) => (
        <AtlasMarkerPin key={i} item={item} Marker={Marker} onClick={onAtlasClick} />
      )),
    [Marker, onAtlasClick],
  );

  return <>{markers}</>;
};
