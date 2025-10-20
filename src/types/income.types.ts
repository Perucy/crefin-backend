/**
 * Income Types
 * Defines data structures for income tracking
 */

import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// LOG INCOME
// ============================================================================
export interface LogIncomeRequest {
    amount: Decimal;
    projectName?: string;
    clientName?: string;
    skill?: string;
    hours?: Decimal;
    ratePerHour?: Decimal;
    source?: 'manual' | 'voice';
    notes?: string;
    loggedAt?: Date | string;
}

export interface LogIncomeResponse {
    income: IncomeLog;
    message: string;
}

// ============================================================================
// INCOME LOG
// ============================================================================

export interface IncomeLog {
    id: string;
    userId: string;
    amount: Decimal;
    projectName: string | null;
    clientName: string | null;
    skill: string | null;
    hours: Decimal | null;
    ratePerHour: Decimal | null;
    source: string;
    notes: string | null;
    loggedAt: Date;
    createdAt: Date;
}

// ============================================================================
// GET INCOME HISTORY
// ============================================================================

export interface GetIncomeQuery {
    startDate?: string;
    endDate?: string;
    skill?: string;
    clientName?: string;
    limit?: number;
    offset?: number;
}

export interface GetIncomeResponse {
    income: IncomeLog[];
    total: number;
    totalAmount: number;
    page: number;
    limit: number;
}

// ============================================================================
// INCOME SUMMARY
// ============================================================================

export interface IncomeSummaryQuery {
  month?: number;  // 1-12
  year?: number;   // 2024, 2025, etc.
}

export interface IncomeSummary {
    period: string;
    totalIncome: number;
    totalEntries: number;
    totalHours: number;
    averageRate: number;
    topSkills: Array<{
        skill: string;
        amount: number;
        count: number;
    }>;
    topClients: Array<{
        clientName: string;
        amount: number;
        count: number;
    }>;
}