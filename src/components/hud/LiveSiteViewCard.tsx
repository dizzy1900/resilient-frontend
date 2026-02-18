import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MapPin, Landmark } from 'lucide-react';

interface SatellitePreview {
  thumbnail_url: string;
  capture_date: string;
  cloud_cover: number;
  satellite_id: string;
}

interface MarketIntelligence {
  credit_rating: string;
  sector_rank?: {
    by_npv: number;
    total_in_sector: number;
  };
  percentiles?: {
    composite: number;
  };
}

interface LiveSiteViewCardProps {
  satellitePreview: SatellitePreview | null;
  marketIntelligence?: MarketIntelligence | null;
}

const getCreditRatingColor = (rating: string) => {
  const first = rating.charAt(0).toUpperCase();
  if (first === 'A') return 'text-emerald-500';
  if (first === 'B') return 'text-orange-500';
  return 'text-red-500';
};

export const LiveSiteViewCard = ({ satellitePreview, marketIntelligence }: LiveSiteViewCardProps) => {
  const [open, setOpen] = useState(false);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <GlassCard className="overflow-hidden">
        <div
          className={`relative w-full aspect-[16/9] ${satellitePreview ? 'cursor-pointer' : ''}`}
          onClick={() => satellitePreview && setOpen(true)}
        >
          {satellitePreview ? (
            <img
              src={satellitePreview.thumbnail_url}
              alt="Satellite view of site"
              className="w-full h-full object-cover transition-opacity hover:opacity-80"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center ${satellitePreview ? 'hidden' : ''}`}>
            <MapPin className="w-8 h-8 text-white/20" />
          </div>
          <Badge className="absolute top-2 left-2 bg-red-500/90 text-white border-none text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold">
            Live
          </Badge>
          {marketIntelligence?.credit_rating && (
            <Badge className="absolute top-2 right-2 bg-white border-none text-[11px] px-2 py-0.5 font-bold shadow-lg">
              <span className={getCreditRatingColor(marketIntelligence.credit_rating)}>
                {marketIntelligence.credit_rating}
              </span>
            </Badge>
          )}
        </div>
        {satellitePreview && (
          <p className="px-3 py-2 text-[10px] text-white/40 leading-relaxed">
            Sentinel-2 Satellite • Captured {formatDate(satellitePreview.capture_date)} • Cloud Cover: {(satellitePreview.cloud_cover * 100).toFixed(2)}%
          </p>
        )}
      </GlassCard>

      {/* Peer Benchmarking */}
      {marketIntelligence?.sector_rank && (
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="w-3.5 h-3.5 text-blue-400" />
            <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Peer Benchmarking</h4>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-white/40">Sector Rank</span>
              <p className="text-sm font-bold text-white tabular-nums">
                #{marketIntelligence.sector_rank.by_npv} / {marketIntelligence.sector_rank.total_in_sector}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/40">Performance</span>
              <p className="text-sm font-bold text-emerald-400 tabular-nums">
                Top {(marketIntelligence.percentiles?.composite ?? 0).toFixed(0)}%
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-black/95 overflow-hidden">
          {satellitePreview && (
            <img
              src={satellitePreview.thumbnail_url}
              alt="Satellite view of site – full screen"
              className="w-full h-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
