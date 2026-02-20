import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface LocationHeaderProps {
  isMobile?: boolean;
  onClose?: () => void;
  locationName?: string | null;
  projectType?: string | null;
  thumbnailUrl?: string | null;
  creditRating?: string | null;
}

const getCreditRatingColor = (rating: string): string => {
  const r = rating.toUpperCase();
  if (r.startsWith('A')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  if (r.startsWith('B')) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  return 'bg-red-500/20 text-red-400 border-red-500/40';
};

const formatProjectType = (type: string): string =>
  type.charAt(0).toUpperCase() + type.slice(1);

export const LocationHeader = ({
  isMobile,
  onClose,
  locationName,
  projectType,
  thumbnailUrl,
  creditRating,
}: LocationHeaderProps) => {
  const hasLocationData = locationName || thumbnailUrl;

  return (
    <>
      {hasLocationData ? (
        <div className="relative w-full h-40 overflow-hidden flex-shrink-0">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={locationName ?? 'Location preview'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white border-0 h-8 w-8 rounded-lg"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {creditRating && (
            <span
              className={cn(
                'absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                isMobile ? 'right-12' : 'right-2',
                getCreditRatingColor(creditRating)
              )}
            >
              {creditRating}
            </span>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-tight truncate">
                  {locationName}
                </p>
                {projectType && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-white/60 shrink-0" />
                    <span className="text-white/60 text-[10px] uppercase tracking-wide">
                      {formatProjectType(projectType)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">Resilient</span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
              Climate Risk Platform
            </span>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      <Separator className="bg-sidebar-border flex-shrink-0" />
    </>
  );
};
