import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MapPin, Landmark, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

interface TemporalAnalysis {
  history: { year: number; npv: number; default_prob: number }[];
  stranded_asset_year: number | null;
}

interface LiveSiteViewCardProps {
  satellitePreview: SatellitePreview | null;
  marketIntelligence?: MarketIntelligence | null;
  temporalAnalysis?: TemporalAnalysis | null;
}

const getCreditRatingColor = (rating: string) => {
  const first = rating.charAt(0).toUpperCase();
  if (first === 'A') return 'text-emerald-500';
  if (first === 'B') return 'text-orange-500';
  return 'text-red-500';
};

export const LiveSiteViewCard = ({ satellitePreview, marketIntelligence, temporalAnalysis }: LiveSiteViewCardProps) => {
  const [open, setOpen] = useState(false);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const hasTemporalData = temporalAnalysis?.history?.some(h => h.npv !== 0) ?? false;

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

      {/* Lifecycle Trajectory Chart */}
      {hasTemporalData && temporalAnalysis && (
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Lifecycle Trajectory</h4>
          </div>
          <div className="w-full h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalAnalysis.history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="year"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'NPV']}
                />
                <Line
                  type="monotone"
                  dataKey="npv"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {temporalAnalysis.stranded_asset_year && (
            <div className="mt-2 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-[11px] text-red-400 font-medium">
                ⚠️ Projected Negative Value by {temporalAnalysis.stranded_asset_year}
              </span>
            </div>
          )}
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
