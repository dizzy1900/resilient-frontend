/** Single asset result from POST /api/v1/analyze-portfolio */
export interface PortfolioAssetResult {
  lat: number;
  lon: number;
  name?: string;
  value?: number;
  value_at_risk?: number;
  resilience_score?: number;
}

/** Aggregate summary from analyze-portfolio response (snake_case from API, camelCase from mapper) */
export interface PortfolioSummary {
  total_portfolio_value?: number;
  total_value_at_risk?: number;
  average_resilience_score?: number;
  totalPortfolioValue?: number;
  totalValueAtRisk?: number;
  averageResilienceScore?: number;
}

/** Full JSON response from POST /api/v1/analyze-portfolio */
export interface PortfolioAnalysisResult {
  asset_results?: PortfolioAssetResult[];
  portfolio_summary?: PortfolioSummary;
}

/** Map backend snake_case to frontend camelCase so UI panels display correct values */
export function mapPortfolioAnalysisResult(resultData: PortfolioAnalysisResult): PortfolioAnalysisResult {
  const raw = resultData?.portfolio_summary;
  const portfolio_summary: PortfolioSummary = {
    ...raw,
    totalPortfolioValue: raw?.total_portfolio_value ?? raw?.totalPortfolioValue ?? 0,
    totalValueAtRisk: raw?.total_value_at_risk ?? raw?.totalValueAtRisk ?? 0,
    averageResilienceScore: raw?.average_resilience_score ?? raw?.averageResilienceScore ?? 0,
  };
  return {
    ...resultData,
    portfolio_summary,
  };
}
