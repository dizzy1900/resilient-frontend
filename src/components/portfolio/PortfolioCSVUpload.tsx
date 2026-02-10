import { useState } from 'react';
import { useCSVReader } from 'react-papaparse';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/hud/GlassCard';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface PortfolioAsset {
  Name: string;
  Lat: number;
  Lon: number;
  Value: number;
}

interface PortfolioCSVUploadProps {
  onDataParsed: (data: PortfolioAsset[]) => void;
  parsedData: PortfolioAsset[];
  onClear: () => void;
}

export const PortfolioCSVUpload = ({
  onDataParsed,
  parsedData,
  onClear,
}: PortfolioCSVUploadProps) => {
  const { CSVReader } = useCSVReader();
  const [error, setError] = useState<string | null>(null);

  const handleUploadAccepted = (results: { data: string[][] }) => {
    setError(null);
    
    try {
      const rows = results.data;
      if (rows.length < 2) {
        setError('CSV must have headers and at least one data row');
        return;
      }

      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex((h) => h === 'name' || h === 'farm_id');
      const latIdx = headers.findIndex((h) => h === 'lat');
      const lonIdx = headers.findIndex((h) => h === 'lon');
      const valueIdx = headers.findIndex((h) => h === 'value');

      if (latIdx === -1 || lonIdx === -1) {
        setError('CSV must have at least columns: Lat, Lon (optional: Name/farm_id, Value)');
        return;
      }

      // Check for maximum rows (10,000 limit enforced server-side)
      if (rows.length > 10001) {
        setError('Maximum 10,000 assets allowed per upload');
        return;
      }

      const assets: PortfolioAsset[] = [];
      const validationErrors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2 || row.every((cell) => !cell.trim())) continue;

        const name = nameIdx !== -1 ? (row[nameIdx]?.trim() || `Asset ${i}`) : `Asset ${i}`;
        const lat = parseFloat(row[latIdx]);
        const lon = parseFloat(row[lonIdx]);
        const value = valueIdx !== -1 ? parseFloat(row[valueIdx]) : 0;

        // Validate name length
        if (name.length > 200) {
          validationErrors.push(`Row ${i + 1}: Name exceeds 200 characters`);
          continue;
        }

        // Validate numeric values
        if (isNaN(lat) || isNaN(lon)) {
          validationErrors.push(`Row ${i + 1}: Invalid lat/lon values`);
          continue;
        }
        const parsedValue = isNaN(value) ? 0 : value;

        // Validate coordinate ranges
        if (lat < -90 || lat > 90) {
          validationErrors.push(`Row ${i + 1}: Latitude must be between -90 and 90`);
          continue;
        }
        if (lon < -180 || lon > 180) {
          validationErrors.push(`Row ${i + 1}: Longitude must be between -180 and 180`);
          continue;
        }

        // Validate value range
        if (parsedValue < 0) {
          validationErrors.push(`Row ${i + 1}: Value cannot be negative`);
          continue;
        }
        if (parsedValue > 999999999999) {
          validationErrors.push(`Row ${i + 1}: Value exceeds maximum allowed`);
          continue;
        }

        assets.push({
          Name: name,
          Lat: lat,
          Lon: lon,
          Value: parsedValue,
        });
      }

      if (assets.length === 0) {
        if (validationErrors.length > 0) {
          setError(`No valid data rows found. ${validationErrors[0]}`);
        } else {
          setError('No valid data rows found in CSV');
        }
        return;
      }

      // Show warning if some rows were skipped
      if (validationErrors.length > 0 && validationErrors.length <= 5) {
        console.warn('CSV validation warnings:', validationErrors);
      }

      onDataParsed(assets);
    } catch (err) {
      setError('Failed to parse CSV file');
      console.error('CSV parse error:', err);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  if (parsedData.length > 0) {
    return (
      <GlassCard className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-white">
              {parsedData.length} assets loaded
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="rounded-lg border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60 text-xs">Name</TableHead>
                <TableHead className="text-white/60 text-xs">Lat</TableHead>
                <TableHead className="text-white/60 text-xs">Lon</TableHead>
                <TableHead className="text-white/60 text-xs text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedData.slice(0, 5).map((asset, idx) => (
                <TableRow key={idx} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white text-xs font-medium">
                    {asset.Name}
                  </TableCell>
                  <TableCell className="text-white/70 text-xs tabular-nums">
                    {asset.Lat.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-white/70 text-xs tabular-nums">
                    {asset.Lon.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-emerald-400 text-xs text-right tabular-nums">
                    {formatCurrency(asset.Value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {parsedData.length > 5 && (
          <p className="text-xs text-white/40 text-center">
            ...and {parsedData.length - 5} more assets
          </p>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <CSVReader onUploadAccepted={handleUploadAccepted}>
        {({ getRootProps, acceptedFile, ProgressBar }: any) => (
          <div className="space-y-3">
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-all duration-200"
            >
              <Upload className="w-10 h-10 text-white/40 mx-auto mb-3" />
              <p className="text-sm text-white/70 mb-1">
                Drag & drop your CSV file here
              </p>
              <p className="text-xs text-white/40">
                or click to browse
              </p>
              <p className="text-[10px] text-white/30 mt-3">
                Columns: Lat, Lon (required) · Name/farm_id, Value (optional)
              </p>
            </div>

            {acceptedFile && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <FileSpreadsheet className="w-4 h-4" />
                <span>{acceptedFile.name}</span>
              </div>
            )}

            <ProgressBar />
          </div>
        )}
      </CSVReader>

      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </GlassCard>
  );
};
