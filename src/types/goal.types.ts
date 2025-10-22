/**
 * Goal Types
 * Defines data structures for financial goals
 */

import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// GOAL CATEGORIES
// ============================================================================

export const GOAL_CATEGORIES = {
    TRAVEL: 'travel',
    REAL_ESTATE: 'real-estate',
    EDUCATION: 'education',
    EMERGENCY_FUND: 'emergency-fund',
    BUSINESS: 'business',
    RETIREMENT: 'retirement',
    CUSTOM: 'custom',
} as const;

export type GoalCategory = typeof GOAL_CATEGORIES[keyof typeof GOAL_CATEGORIES];

// ============================================================================
// GOAL TYPES
// ============================================================================

export interface CreateGoalRequest {
    title: string;
    category: GoalCategory;
    targetAmount: Decimal;
    currentAmount?: Decimal;
    deadline?: string;
    description?: string;
}

export interface UpdateGoalRequest {
    title?: string;
    category?: GoalCategory;
    targetAmount?: Decimal;
    currentAmount?: Decimal;
    deadline?: string;
    description?: string;
}

export interface AddFundsRequest {
    amount: Decimal;
    note?: string;
}

export interface Goal {
    id: string;
    userId: string;
    title: string;
    category: GoalCategory;
    targetAmount: Decimal;
    currentAmount: Decimal;
    deadline: Date | null;
    description: string | null;
    progress: number; // calculated percentage (0-100)
    daysLeft: number | null; // calculated from deadline
    createdAt: Date;
    updatedAt: Date;
}

export interface GoalResponse {
    goal: Goal;
    message: string;
}

export interface GoalsListResponse {
    goals: Goal[];
    total: number;
}