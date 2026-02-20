import { useState, useMemo } from 'react';
import { GLOBAL_ATLAS_DATA } from '@/data/globalAtlas';

type AtlasItem = (typeof GLOBAL_ATLAS_DATA)[number];

export interface AtlasClickData {
  lat: number;
  lng: number;
  projectType: string;
  cropType: string | null;
  item: AtlasItem;
}

type OverlayMode = 'default' | 'credit_rating' | 'financial_risk';

const getRiskCategory = (item: AtlasItem): string | null => {
  if ('flood_risk' in item && item.flood_risk) return (item.flood_risk as any).risk_category ?? null;
  if ('malaria_risk' in item && item.malaria_risk) return (item.malaria_risk as any).risk_category ?? null;
  if ('productivity_analysis' in item && item.productivity_analysis) return (item.productivity_analysis as any).heat_stress_category ?? null;
  return null;
};

const getMarkerColor = (item: AtlasItem, overlayMode: OverlayMode): string => {
  if (overlayMode === 'financial_risk') return '#eb796f';

  if (overlayMode === 'credit_rating') {
    const rating: string = ('market_intelligence' in item ? (item.market_intelligence as any)?.credit_rating : null) ?? '';
    if (/^(AAA|AA|A)/i.test(rating)) return '#7eb36a';
    if (/^(BBB|BB|B)/i.test(rating)) return '#eab308';
    if (/^(CCC|CC|C|D)/i.test(rating)) return '#eb796f';
    return '#7eb36a';
  }

  const npv = 'financial_analysis' in item ? (item.financial_analysis as any)?.npv_usd : null;
  const risk = getRiskCategory(item);
  if ((npv !== null && npv < 0) || risk === 'High' || risk === 'Extreme') return '#eb796f';
  if (risk === 'Moderate') return '#eab308';
  return '#7eb36a';
};

const getVaR = (item: AtlasItem): number | null => {
  const mc = 'monte_carlo_analysis' in item ? (item.monte_carlo_analysis as any) : null;
  return mc?.VaR_95 ?? null;
};

const computeVarBounds = () => {
  let min = Infinity;
  let max = -Infinity;
  for (const item of GLOBAL_ATLAS_DATA) {
    const v = getVaR(item);
    if (v !== null) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
};

const VAR_BOUNDS = computeVarBounds();

const getMarkerOpacity = (item: AtlasItem, overlayMode: OverlayMode): number => {
  if (overlayMode !== 'financial_risk') return 1;
  const v = getVaR(item);
  if (v === null) return 0.4;
  const { min, max } = VAR_BOUNDS;
  if (max === min) return 0.6;
  const normalized = (v - min) / (max - min);
  return 0.2 + normalized * 0.8;
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
  overlayMode: OverlayMode;
}

const AtlasMarkerPin = ({ item, Marker, onClick, overlayMode }: AtlasMarkerPinProps) => {
  const [hovered, setHovered] = useState(false);
  const color = getMarkerColor(item, overlayMode);
  const opacity = getMarkerOpacity(item, overlayMode);
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
        style={{ transition: 'transform 0.15s', transform: hovered ? 'scale(1.4)' : 'scale(1)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <circle
            cx="7"
            cy="7"
            r="5"
            fill={color}
            fillOpacity={opacity}
            stroke={color}
            strokeWidth="1"
          />
        </svg>

        {hovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
            <div
              style={{
                border: '1px solid var(--cb-border)',
                backgroundColor: 'var(--cb-bg)',
                padding: '4px 8px',
                whiteSpace: 'nowrap',
                fontFamily: 'monospace',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--cb-text)', fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 10, color: 'var(--cb-secondary)', marginTop: 2 }}>
                NPV: <span style={{ color, fontFamily: 'monospace' }}>{npvDisplay}</span>
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
  overlayMode?: OverlayMode;
}

export const AtlasMarkers = ({ Marker, onAtlasClick, overlayMode = 'default' }: AtlasMarkersProps) => {
  const markers = useMemo(
    () =>
      GLOBAL_ATLAS_DATA.map((item, i) => (
        <AtlasMarkerPin key={i} item={item} Marker={Marker} onClick={onAtlasClick} overlayMode={overlayMode} />
      )),
    [Marker, onAtlasClick, overlayMode],
  );

  return <>{markers}</>;
};
