/**
 * Crefin ML API types
 */
export interface PaymentPredictionRequest {
  client_avg_payment_days: number;
  client_late_payment_rate: number;
  client_payment_std: number;
  client_total_invoices: number;
  client_payment_trend: number;
  amount: number;
  issue_date: string; // ISO format
}

export interface PaymentPredictionResponse {
  predicted_payment_days: number;
  confidence_score: number;
  predicted_payment_date: string;
  feature_importance: Record<string, number>;
}

export interface RiskScoreRequest {
  client_avg_payment_days: number;
  client_payment_std: number;
  client_late_payment_rate: number;
  client_total_invoices: number;
  client_payment_trend: number;
  days_since_last_invoice: number;
}

export interface RiskScoreResponse {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_breakdown: {
    late_payment_risk: number;
    speed_risk: number;
    consistency_risk: number;
    trend_risk: number;
    experience_risk: number;
  };
  recommendation: string;
}

export interface ClientSegmentRequest {
  client_avg_payment_days: number;
  client_payment_std: number;
  client_late_payment_rate: number;
  risk_score: number;
}

export interface ClientSegmentResponse {
  segment_id: number;
  segment_name: string;
  segment_characteristics: {
    avg_payment_days: number;
    avg_risk_score: number;
    client_count: number;
  };
  recommendation: string;
}

export interface InvoiceHistoryItem {
  issue_date: string;
  amount: number;
  payment_days: number;
}

export interface RevenueForecastRequest {
  invoice_history: InvoiceHistoryItem[];
  months_ahead: number;
}

export interface RevenueForecastResponse {
  forecasts: Array<{
    month: string;
    predicted_revenue: number;
    lower_bound: number;
    upper_bound: number;
    confidence: number;
  }>;
  insights: {
    growth_rate: number;
    trend: string;
    volatility: number;
    best_month: {
      date: string;
      revenue: number;
    };
  };
}