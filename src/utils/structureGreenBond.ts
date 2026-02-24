export interface GreenBondDeal {
  principal: number;
  coupon: number;
  tenor: number;
  rating: string;
  greenium_savings: number;
}

export const structureGreenBond = (financialData: any): GreenBondDeal => {
  const principal = financialData?.assumptions?.capex ?? 0;
  const tenor = financialData?.assumptions?.analysis_years ?? 10;
  const roi = financialData?.roi_pct ?? 0;
  const paybackYears = financialData?.payback_years ?? Infinity;

  let coupon = 5.0;
  if (paybackYears < 5) {
    coupon -= 0.5;
  }

  let rating: string;
  if (roi > 200) {
    rating = 'AAA (Prime)';
  } else if (roi > 100) {
    rating = 'BBB (Investment Grade)';
  } else {
    rating = 'B (Speculative)';
  }

  // Greenium: estimated annual savings vs conventional bond (≈0.15% of principal)
  const greenium_savings = Math.round(principal * 0.0015 * tenor);

  return { principal, coupon, tenor, rating, greenium_savings };
};
