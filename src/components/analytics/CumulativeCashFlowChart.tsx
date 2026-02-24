import { useMemo } from 'react';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';

interface CumulativeCashFlowChartProps {
  capex: number;
  opex: number;
  yieldBenefit: number;
  cropPrice: number;
  discountRate?: number;
}

interface CashFlowDataPoint {
  year: number;
  cumulative: number;
}

export const CumulativeCashFlowChart = ({
  capex,
  opex,
  yieldBenefit,
  cropPrice,
  discountRate = 15,
}: CumulativeCashFlowChartProps) => {
  const { data, npv, roi, paybackYear } = useMemo(() => {
    const baselineYieldTonnes = 1.0;
    const additionalYield = baselineYieldTonnes * (yieldBenefit / 100);
    const annualRevenueBenefit = additionalYield * cropPrice;
    const annualNetBenefit = annualRevenueBenefit - opex;
    const r = discountRate / 100;

    const points: CashFlowDataPoint[] = [];
    let cumulative = -capex;
    let npvTotal = -capex;
    let payback: number | null = null;

    points.push({ year: 0, cumulative });

    for (let y = 1; y <= 10; y++) {
      cumulative += annualNetBenefit;
      npvTotal += annualNetBenefit / Math.pow(1 + r, y);
      points.push({ year: y, cumulative: Math.round(cumulative) });

      if (payback === null && cumulative >= 0) {
        const prevCum = points[y - 1].cumulative;
        payback = y - 1 + Math.abs(prevCum) / annualNetBenefit;
      }
    }

    const totalReturn = cumulative;
    const roiPct = capex > 0 ? ((totalReturn) / capex) * 100 : 0;

    return {
      data: points,
      npv: Math.round(npvTotal),
      roi: Math.round(roiPct),
      paybackYear: payback !== null ? Math.round(payback * 10) / 10 : null,
    };
  }, [capex, opex, yieldBenefit, cropPrice, discountRate]);

  const minValue = Math.min(...data.map(d => d.cumulative));
  const maxValue = Math.max(...data.map(d => d.cumulative));
  const yMin = Math.floor(minValue / 500) * 500 - 500;
  const yMax = Math.ceil(maxValue / 500) * 500 + 500;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 border border-white/10 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-0.5">NPV</p>
          <p className={`text-sm font-bold tabular-nums ${npv >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${npv.toLocaleString()}
          </p>
        </div>
        <div className="p-2.5 border border-white/10 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-0.5">ROI</p>
          <p className={`text-sm font-bold tabular-nums ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {roi}%
          </p>
        </div>
        <div className="p-2.5 border border-white/10 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Payback</p>
          <p className="text-sm font-bold tabular-nums text-amber-400">
            {paybackYear !== null ? `${paybackYear}yr` : 'N/A'}
          </p>
        </div>
      </div>

      <div className="border border-white/10 p-3">
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b8b8b" stopOpacity={0.15} />
                <stop offset="50%" stopColor="#8b8b8b" stopOpacity={0} />
                <stop offset="50%" stopColor="#eb796f" stopOpacity={0} />
                <stop offset="100%" stopColor="#eb796f" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Year', position: 'insideBottom', offset: -2, fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace' }}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 13, 13, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0px',
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: '10px',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cumulative']}
              labelFormatter={(label) => `Year ${label}`}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 2" />
            {paybackYear !== null && (
              <ReferenceLine
                x={Math.ceil(paybackYear)}
                stroke="#eb796f"
                strokeDasharray="4 2"
                label={{
                  value: 'Payback',
                  position: 'top',
                  fill: '#eb796f',
                  fontSize: 9,
                  fontFamily: 'monospace',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="cumulative"
              fill="url(#cashFlowGradient)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#ebebeb"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#ebebeb', stroke: '#ebebeb', strokeWidth: 1 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
