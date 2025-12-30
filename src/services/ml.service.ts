/**
 * ML Service - Connects to FastAPI ML API
 * Provides payment predictions, risk scoring, segmentation, and forecasting
 */
import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import { 
    PaymentPredictionRequest,
    PaymentPredictionResponse,
    RiskScoreRequest,
    RiskScoreResponse,
    ClientSegmentRequest,
    ClientSegmentResponse,
    RevenueForecastRequest,
    RevenueForecastResponse
} from '../types/ml.types';

// ML API base URL
const ML_API_URL = config.ML_API_URL;

// axios instancwe with timeout
const mlClient = axios.create({
    baseURL: ML_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================================================
// PAYMENT PREDICTION
// ============================================================================
export const predictPaymentTime = async (
    data: PaymentPredictionRequest
): Promise <PaymentPredictionResponse | null> => {
    try {
        const response = await mlClient.post<PaymentPredictionResponse>(
            '/api/ml/predict/payment-time', data
        );

        logger.info('Payment prediction successful', {
            action: 'ml_predict_payment',
            predicted_days: response.data.predicted_payment_days,
            confidence: response.data.confidence_score,
        });

        return response.data;
    } catch (error: any) {
        logger.error('Payment prediction failed', {
            action: 'ml_predict_payment',
            error: error.message,
            status: error.response?.status,
        });
        return null;
    }
}

// ============================================================================
// RISK SCORING
// ============================================================================

export const calculateRiskScore = async (
  data: RiskScoreRequest
): Promise<RiskScoreResponse | null> => {
  try {
    const response = await mlClient.post<RiskScoreResponse>(
      '/api/ml/clients/risk-score',
      data
    );

    logger.info('Risk score calculated', {
      action: 'ml_risk_score',
      risk_score: response.data.risk_score,
      risk_level: response.data.risk_level,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Risk score calculation failed', {
      action: 'ml_risk_score',
      error: error.message,
      status: error.response?.status,
    });
    return null;
  }
};

// ============================================================================
// CLIENT SEGMENTATION
// ============================================================================

export const predictClientSegment = async (
  data: ClientSegmentRequest
): Promise<ClientSegmentResponse | null> => {
  try {
    const response = await mlClient.post<ClientSegmentResponse>(
      '/api/ml/clients/segment',
      data
    );

    logger.info('Client segment predicted', {
      action: 'ml_client_segment',
      segment_id: response.data.segment_id,
      segment_name: response.data.segment_name,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Client segmentation failed', {
      action: 'ml_client_segment',
      error: error.message,
      status: error.response?.status,
    });
    return null;
  }
};

// ============================================================================
// REVENUE FORECASTING
// ============================================================================

export const forecastRevenue = async (
  data: RevenueForecastRequest
): Promise<RevenueForecastResponse | null> => {
  try {
    const response = await mlClient.post<RevenueForecastResponse>(
      '/api/ml/forecast/revenue',
      data
    );

    logger.info('Revenue forecast generated', {
      action: 'ml_revenue_forecast',
      months: data.months_ahead,
      growth_rate: response.data.insights.growth_rate,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Revenue forecasting failed', {
      action: 'ml_revenue_forecast',
      error: error.message,
      status: error.response?.status,
    });
    return null;
  }
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const checkMLServiceHealth = async (): Promise<boolean> => {
    try {
        const response = await mlClient.get('/health');
        return response.data.status === 'healthy';
    } catch (error: any) {
        logger.error('ML service health check failed', {
        action: 'ml_health_check',
        error: error.message,
        });
        return false;
    }
};
