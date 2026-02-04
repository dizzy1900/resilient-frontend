import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Play, Loader2, Download, CheckCircle2, AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/hud/GlassCard';
import { Button } from '@/components/ui/button';
import { PortfolioCSVUpload, PortfolioAsset } from './PortfolioCSVUpload';
import { supabase } from '@/integrations/supabase/clientSafe';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

interface BatchJob {
  id: string;
  status: JobStatus;
  total_assets: number;
  processed_assets: number;
  report_url: string | null;
  error_message: string | null;
}

export const PortfolioPanel = () => {
  const [parsedData, setParsedData] = useState<PortfolioAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null);
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Subscribe to realtime updates for batch_jobs
  useEffect(() => {
    if (!currentJob?.id) return;

    const channel = supabase
      .channel(`batch_job_${currentJob.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'batch_jobs',
          filter: `id=eq.${currentJob.id}`,
        },
        (payload) => {
          const updated = payload.new as BatchJob;
          setCurrentJob(updated);

          if (updated.status === 'completed') {
            // Trigger confetti celebration
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#22c55e', '#14b8a6', '#3b82f6'],
            });

            toast({
              title: 'Analysis Complete!',
              description: `Successfully analyzed ${updated.total_assets} assets.`,
            });
          } else if (updated.status === 'failed') {
            toast({
              title: 'Analysis Failed',
              description: updated.error_message || 'An error occurred during analysis.',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentJob?.id]);

  const handleDataParsed = useCallback((data: PortfolioAsset[]) => {
    setParsedData(data);
    setCurrentJob(null);
  }, []);

  const handleClear = useCallback(() => {
    setParsedData([]);
    setCurrentJob(null);
  }, []);

  const handleAnalyzePortfolio = async () => {
    if (parsedData.length === 0) return;
    if (!user || !session) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to analyze your portfolio.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare assets for server-side validation
      const assets = parsedData.map((asset) => ({
        name: asset.Name,
        lat: asset.Lat,
        lon: asset.Lon,
        value: asset.Value,
      }));

      // Call the secure edge function
      const { data, error } = await supabase.functions.invoke('submit-portfolio', {
        body: { assets },
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit portfolio');
      }

      if (!data?.success) {
        const errorMessage = data?.message || data?.details?.[0]?.message || 'Validation failed';
        throw new Error(errorMessage);
      }

      // Set the current job from the response
      setCurrentJob({
        id: data.job_id,
        status: 'pending',
        total_assets: data.assets_count,
        processed_assets: 0,
        report_url: null,
        error_message: null,
      });

      toast({
        title: 'Portfolio Analysis Started',
        description: `Analyzing ${data.assets_count} assets...`,
      });
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      toast({
        title: 'Failed to Start Analysis',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setCurrentJob(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReport = () => {
    if (currentJob?.report_url) {
      window.open(currentJob.report_url, '_blank');
    }
  };

  const getStatusDisplay = () => {
    if (!currentJob) return null;

    const statusConfig = {
      pending: {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Queued for processing...',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/20',
      },
      processing: {
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
        text: `Processing ${currentJob.processed_assets}/${currentJob.total_assets} assets...`,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/20',
      },
      completed: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: 'Analysis complete!',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      },
      failed: {
        icon: <AlertCircle className="w-4 h-4" />,
        text: currentJob.error_message || 'Analysis failed',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/20',
      },
    };

    const config = statusConfig[currentJob.status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${config.bgColor}`}>
        <span className={config.color}>{config.icon}</span>
        <span className={`text-sm ${config.color}`}>{config.text}</span>
      </div>
    );
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="space-y-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-white">Portfolio Mode</span>
          </div>
          <p className="text-xs text-white/50 mb-4">
            Sign in to upload and analyze your portfolio assets with bulk climate risk analysis.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:opacity-90"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In to Continue
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-white">Portfolio Mode</span>
        </div>
        <p className="text-xs text-white/50 mb-4">
          Upload a CSV file with your portfolio assets to run bulk climate risk analysis.
        </p>
      </GlassCard>

      <PortfolioCSVUpload
        onDataParsed={handleDataParsed}
        parsedData={parsedData}
        onClear={handleClear}
      />

      {parsedData.length > 0 && (
        <GlassCard className="p-4 space-y-4">
          {getStatusDisplay()}

          {currentJob?.status === 'completed' && currentJob.report_url && (
            <Button
              onClick={handleDownloadReport}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          )}

          {(!currentJob || currentJob.status === 'failed') && (
            <Button
              onClick={handleAnalyzePortfolio}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:opacity-90 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Analysis...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Analyze Portfolio
                </>
              )}
            </Button>
          )}
        </GlassCard>
      )}
    </div>
  );
};
