/** Single asset result from POST /api/v1/analyze-portfolio */
export interface PortfolioAssetResult {
  lat: number;
  lon: number;
  name?: string;
  value?: number;
  value_at_risk?: number;
  resilience_score?: number;
}

/** Aggregate summary from analyze-portfolio response */
export interface PortfolioSummary {
  total_portfolio_value?: number;
  total_value_at_risk?: number;
  average_resilience_score?: number;
}

/** Full JSON response from POST /api/v1/analyze-portfolio */
export interface PortfolioAnalysisResult {
  asset_results?: PortfolioAssetResult[];
  portfolio_summary?: PortfolioSummary;
}
