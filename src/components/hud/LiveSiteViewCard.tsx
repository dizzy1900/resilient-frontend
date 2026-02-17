import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';

interface SatellitePreview {
  thumbnail_url: string;
  capture_date: string;
  cloud_cover: number;
  satellite_id: string;
}

interface LiveSiteViewCardProps {
  satellitePreview: SatellitePreview | null;
}

export const LiveSiteViewCard = ({ satellitePreview }: LiveSiteViewCardProps) => {
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
        </div>
        {satellitePreview && (
          <p className="px-3 py-2 text-[10px] text-white/40 leading-relaxed">
            Sentinel-2 Satellite • Captured {formatDate(satellitePreview.capture_date)} • Cloud Cover: {(satellitePreview.cloud_cover * 100).toFixed(2)}%
          </p>
        )}
      </GlassCard>

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
