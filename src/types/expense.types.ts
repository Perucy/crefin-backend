/**
 * Expense Types
 * Defines data structures for expense tracking
 */

import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// LOG EXPENSE
// ============================================================================

export interface LogExpenseRequest {
    amount: Decimal;
    category: string;
    description: string;
    isDeductible?: boolean;
    receiptUrl?: string;
    loggedAt?: Date | string;
}

export interface LogExpenseResponse {
    expense: ExpenseLog;
    message: string;
}

// ============================================================================
// EXPENSE LOG
// ============================================================================

export interface ExpenseLog {
    id: string;
    userId: string;
    amount: Decimal;
    category: string;
    description: string;
    isDeductible: boolean;
    receiptUrl: string | null;
    loggedAt: Date;
    createdAt: Date;
}

// ============================================================================
// GET EXPENSE HISTORY
// ============================================================================

export interface GetExpenseQuery {
    startDate?: string;
    endDate?: string;
    category?: string;
    isDeductible?: boolean;
    limit?: number;
    offset?: number;
}

export interface GetExpenseResponse {
    expenses: ExpenseLog[];
    total: number;
    totalAmount: number;
    deductibleAmount: number;
    page: number;
    limit: number;
}

// ============================================================================
// EXPENSE SUMMARY
// ============================================================================

export interface ExpenseSummaryQuery {
    month?: number;  // 1-12
    year?: number;   // 2024, 2025, etc.
}

export interface ExpenseSummary {
    period: string;
    totalExpenses: number;
    totalEntries: number;
    deductibleAmount: number;
    nonDeductibleAmount: number;
    byCategory: Array<{
        category: string;
        amount: number;
        count: number;
    }>;
}