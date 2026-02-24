import { DollarSign, TrendingDown, ShieldAlert, Gauge, AlertTriangle, Info } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface TemporalPoint {
  year: number;
  npv: number;
  default_prob?: number;
}

interface RiskFinanceTabProps {
  baselineNpv?: number | null;
  varAt95?: number | null;
  defaultProbability?: number | null;
  driverImpactPct?: number | null;
  temporalHistory?: TemporalPoint[] | null;
  strandedAssetYear?: number | null;
}

const formatCurrency = (val: number): string => {
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `${val < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${val < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
};

const formatYAxis = (val: number): string => {
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `${val < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${val < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return `$${val}`;
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sidebar border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueClass?: string;
}

const StatCard = ({ icon, label, value, sub, valueClass }: StatCardProps) => (
  <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col gap-1.5">
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">
        {label}
      </span>
    </div>
    <span className={`text-base font-bold leading-tight ${valueClass ?? 'text-foreground'}`}>
      {value}
    </span>
    {sub && <div className="mt-0.5">{sub}</div>}
  </div>
);

export const RiskFinanceTab = ({
  baselineNpv,
  varAt95,
  defaultProbability,
  driverImpactPct,
  temporalHistory,
  strandedAssetYear,
}: RiskFinanceTabProps) => {
  const hasData = baselineNpv != null || varAt95 != null || defaultProbability != null;

  const allZeroNpv =
    !temporalHistory ||
    temporalHistory.length === 0 ||
    temporalHistory.every((p) => p.npv === 0);

  if (!hasData) {
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Risk & Finance
        </h3>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a location on the map to view financial risk metrics and scenario analysis.
          </p>
        </div>
      </div>
    );
  }

  const defProb = defaultProbability ?? 0;
  const varNegative = varAt95 != null && varAt95 < 0;

  return (
    <div className="space-y-5">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Vital Stats
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<DollarSign className="w-3 h-3" />}
          label="Baseline NPV"
          value={baselineNpv != null ? formatCurrency(baselineNpv) : '—'}
          valueClass={
            baselineNpv != null && baselineNpv < 0
              ? 'text-red-400'
              : 'text-emerald-400'
          }
        />

        <StatCard
          icon={<TrendingDown className="w-3 h-3" />}
          label="VaR (95%)"
          value={varAt95 != null ? formatCurrency(varAt95) : '—'}
          valueClass={varNegative ? 'text-red-400' : 'text-foreground'}
        />

        <StatCard
          icon={<ShieldAlert className="w-3 h-3" />}
          label="Default Prob."
          value={`${defProb.toFixed(1)}%`}
          valueClass={defProb > 10 ? 'text-red-400' : defProb > 3 ? 'text-amber-400' : 'text-foreground'}
          sub={
            <div className="w-full h-1 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  defProb > 10 ? 'bg-red-400' : defProb > 3 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(defProb, 100)}%` }}
              />
            </div>
          }
        />

        <StatCard
          icon={<Gauge className="w-3 h-3" />}
          label="Sensitivity"
          value={driverImpactPct != null ? `${driverImpactPct.toFixed(1)}%` : '—'}
          valueClass={
            driverImpactPct != null && driverImpactPct > 30
              ? 'text-red-400'
              : driverImpactPct != null && driverImpactPct > 15
              ? 'text-amber-400'
              : 'text-foreground'
          }
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          4D Lifecycle — NPV Trajectory
        </h3>

        {allZeroNpv ? (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            Temporal NPV projection not applicable for this asset class.
          </p>
        ) : (
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={temporalHistory!}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="npv"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {strandedAssetYear != null && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-xs font-semibold text-red-400">
              Projected Stranded Asset by {strandedAssetYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
