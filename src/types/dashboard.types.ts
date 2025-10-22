/**
 * Dashboard Types
 * Financial overview data structures
 */

// ============================================================================
// DASHBOARD INTERFACES
// ============================================================================

export interface DashboardBalance {
    totalBalance: number;           // Income - Expenses
    totalIncome: number;            // All-time income
    totalExpenses: number;          // All-time expenses
    availableBalance: number;       // Balance - goals allocated
    goalsAllocated: number;         // Total in all goals
    currency: string;
}

export interface QuickStats {
    thisMonth: {
        income: number;
        expenses: number;
        profit: number;
        incomeChange: number;       // % change from last month
        expenseChange: number;      // % change from last month
    };
    topSkill: {
        skill: string | null;
        amount: number;
        count: number;
    };
    topExpenseCategory: {
        category: string | null;
        amount: number;
        count: number;
    };
    recentActivity: {
        lastIncomeDate: Date | null;
        lastExpenseDate: Date | null;
        totalTransactions: number;
    };
}

export interface DashboardSummary {
    balance: DashboardBalance;
    stats: QuickStats;
}