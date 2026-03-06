import { useState, useCallback, useRef } from 'react';
import { Briefcase, Play, Loader2, Download, CheckCircle2, AlertCircle, RefreshCw, MapPinned } from 'lucide-react';
import { GlassCard } from '@/components/hud/GlassCard';
import { Button } from '@/components/ui/button';
import { PortfolioCSVUpload, PortfolioAsset } from './PortfolioCSVUpload';
import { fetchWithRetry } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import type { PortfolioAnalysisResult } from '@/types/portfolio';


function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

const GHANA_COCOA_DEMO: PortfolioAsset[] = [
  { Name: 'Kumasi Farm', Lat: 6.6885, Lon: -1.6244, Value: 120000, crop_type: 'cocoa' },
  { Name: 'Takoradi Estate', Lat: 4.8986, Lon: -1.7550, Value: 95000, crop_type: 'cocoa' },
  { Name: 'Sunyani Plot', Lat: 7.3349, Lon: -2.3266, Value: 80000, crop_type: 'cocoa' },
  { Name: 'Ahafo Plantation', Lat: 7.0833, Lon: -2.3333, Value: 150000, crop_type: 'cocoa' },
  { Name: 'Eastern Region Farm', Lat: 6.1000, Lon: -0.7500, Value: 110000, crop_type: 'cocoa' },
];

type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

interface BatchJob {
  id: string;
  status: JobStatus;
  total_assets: number;
  processed_assets: number;
  report_url: string | null;
  error_message: string | null;
}

interface PortfolioPanelProps {
  onAssetsChange?: (assets: PortfolioAsset[]) => void;
  onPortfolioResultsChange?: (data: PortfolioAnalysisResult | null) => void;
}

export const PortfolioPanel = ({ onAssetsChange, onPortfolioResultsChange }: PortfolioPanelProps) => {
  const [parsedData, setParsedData] = useState<PortfolioAsset[]>([]);
  const rawFileRef = useRef<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null);
  const handleDataParsed = useCallback((data: PortfolioAsset[]) => {
    setParsedData(data);
    setCurrentJob(null);
    onAssetsChange?.(data);
  }, [onAssetsChange]);

  const handleClear = useCallback(() => {
    setParsedData([]);
    rawFileRef.current = null;
    setCurrentJob(null);
    onAssetsChange?.([]);
  }, [onAssetsChange]);

  const handleLoadDemo = useCallback(() => {
    rawFileRef.current = null;
    setParsedData(GHANA_COCOA_DEMO);
    setCurrentJob(null);
    onAssetsChange?.(GHANA_COCOA_DEMO);
    toast({
      title: 'Demo Portfolio Loaded',
      description: '5 Ghana Cocoa farm locations loaded.',
    });
  }, [onAssetsChange]);

  const handleAnalyzePortfolio = async () => {
    if (parsedData.length === 0) return;

    setIsSubmitting(true);

    try {
      // Always reconstruct a cleaned CSV from the sanitized parsedData
      // so headers are snake_case and values are numeric (no currency symbols).
      const csvHeader = 'name,lat,lon,asset_value,crop_type';
      const csvRows = parsedData.map((a) =>
        `${escapeCsv(a.Name)},${a.Lat},${a.Lon},${a.Value},${escapeCsv(a.crop_type || 'maize')}`
      ).join('\n');
      const cleanedCsv = `${csvHeader}\n${csvRows}`;
      const cleanedBlob = new Blob([cleanedCsv], { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', cleanedBlob, 'cleaned_portfolio.csv');

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://web-production-8ff9e.up.railway.app';
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/analyze-portfolio`;
      const response = await fetchWithRetry(endpoint, { method: 'POST', body: formData });
      const payload = await response.json().catch(() => ({}));
      const resultData: PortfolioAnalysisResult = payload?.data != null ? payload.data : payload;

      if (response.ok && resultData && typeof resultData === 'object' && resultData.portfolio_summary != null) {
        const ps = resultData.portfolio_summary;
        const mappedData = {
          ...resultData,
          portfolio_summary: {
            ...ps,
            totalPortfolioValue: ps?.total_portfolio_value ?? ps?.totalPortfolioValue ?? 0,
            totalValueAtRisk: ps?.total_value_at_risk ?? ps?.totalValueAtRisk ?? 0,
            averageResilienceScore: ps?.average_resilience_score ?? ps?.averageResilienceScore ?? 0,
          },
        };
        onPortfolioResultsChange?.(mappedData);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#14b8a6', '#3b82f6'],
        });
        toast({
          title: 'Analysis Complete!',
          description: `Analyzed ${parsedData.length} assets.`,
        });
      } else {
        throw new Error((payload as { message?: string })?.message ?? `HTTP ${response.status}`);
      }
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
        rawFileRef={rawFileRef}
      />

      {parsedData.length === 0 && (
        <Button
          variant="outline"
          onClick={handleLoadDemo}
          className="w-full rounded-none border border-white/20 text-white/60 uppercase text-[10px] tracking-widest hover:bg-white hover:text-black hover:border-white transition-none py-2 px-4"
        >
          <MapPinned className="w-4 h-4 mr-2" />
          Load Demo Portfolio (Ghana Cocoa)
        </Button>
      )}

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
