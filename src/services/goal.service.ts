/**
 * Goal Service
 * Business logic for financial goal tracking
 */

import { db } from '../config/database';
import {
    CreateGoalRequest,
    UpdateGoalRequest,
    AddFundsRequest,
    Goal,
    GoalResponse,
    GoalsListResponse,
} from '../types/goal.types';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// CREATE GOAL
// ============================================================================
export const createGoal = async (
    userId: string,
    data: CreateGoalRequest
): Promise<GoalResponse> => {
    try {
        const goal = await db.goal.create({
            data: {
                userId,
                title: data.title,
                category: data.category,
                targetAmount: data.targetAmount,
                currentAmount: data.currentAmount || 0,
                deadline: data.deadline ? new Date(data.deadline) : null,
                description: data.description || null,
            }
        });

        logger.info('Goal created', { userId, goalId: goal.id, title: goal.title });

        return {
            goal: formatGoal(goal),
            message: 'Goal created successfully',
        };
    } catch (error) {
        logger.error('Failed to create goal', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET ALL GOALS
// ============================================================================

export const getGoals = async (userId: string): Promise<GoalsListResponse> => {
    try {
        const goals = await db.goal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        logger.info('Goals retrieved', { userId, count: goals.length });

        return {
            goals: goals.map(formatGoal),
            total: goals.length,
        };
    } catch (error) {
        logger.error('Failed to get goals', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET GOAL BY ID
// ============================================================================

export const getGoalById = async (userId: string, goalId: string): Promise<Goal> => {
    try {
        const goal = await db.goal.findUnique({
            where: { id: goalId },
        });

        if (!goal) {
            throw new NotFoundError('Goal not found');
        }

        if (goal.userId !== userId) {
            throw new NotFoundError('Goal not found');
        }

        logger.info('Goal retrieved', { userId, goalId });

        return formatGoal(goal);
    } catch (error) {
        logger.error('Failed to get goal', { error, userId, goalId });
        throw error;
    }
};

// ============================================================================
// UPDATE GOAL
// ============================================================================

export const updateGoal = async (
    userId: string,
    goalId: string,
    data: UpdateGoalRequest
): Promise<GoalResponse> => {
    try {
        // Verify ownership
        const existingGoal = await db.goal.findUnique({
            where: { id: goalId },
        });

        if (!existingGoal) {
            throw new NotFoundError('Goal not found');
        }

        if (existingGoal.userId !== userId) {
            throw new NotFoundError('Goal not found');
        }

        // Update goal
        const goal = await db.goal.update({
            where: { id: goalId },
            data: {
                title: data.title,
                category: data.category,
                targetAmount: data.targetAmount,
                currentAmount: data.currentAmount,
                deadline: data.deadline ? new Date(data.deadline) : undefined,
                description: data.description,
            },
        });

        logger.info('Goal updated', { userId, goalId });

        return {
            goal: formatGoal(goal),
            message: 'Goal updated successfully',
        };
    } catch (error) {
        logger.error('Failed to update goal', { error, userId, goalId });
        throw error;
    }
};

// ============================================================================
// DELETE GOAL
// ============================================================================

export const deleteGoal = async (
    userId: string,
    goalId: string
): Promise<{ message: string }> => {
    try {
        // Verify ownership
        const goal = await db.goal.findUnique({
            where: { id: goalId },
        });

        if (!goal) {
            throw new NotFoundError('Goal not found');
        }

        if (goal.userId !== userId) {
            throw new NotFoundError('Goal not found');
        }

        // Delete goal
        await db.goal.delete({
            where: { id: goalId },
        });

        logger.info('Goal deleted', { userId, goalId });

        return {
            message: 'Goal deleted successfully',
        };
    } catch (error) {
        logger.error('Failed to delete goal', { error, userId, goalId });
        throw error;
    }
};

// ============================================================================
// ADD FUNDS TO GOAL
// ============================================================================

export const addFundsToGoal = async (
    userId: string,
    goalId: string,
    data: AddFundsRequest
): Promise<GoalResponse> => {
    try {
        // Verify ownership
        const existingGoal = await db.goal.findUnique({
            where: { id: goalId },
        });

        if (!existingGoal) {
            throw new NotFoundError('Goal not found');
        }

        if (existingGoal.userId !== userId) {
            throw new NotFoundError('Goal not found');
        }

        // Convert Decimal to number, add funds, then back to Decimal
        const currentAmount = Number(existingGoal.currentAmount);
        const targetAmount = Number(existingGoal.targetAmount);
        const newAmount = currentAmount + Number(data.amount);

        // Check if adding funds would exceed target
        if (newAmount > targetAmount) {
            throw new BadRequestError(
                `Adding $${data.amount} would exceed target amount of $${targetAmount}`
            );
        }


        // Update goal with new amount
        const goal = await db.goal.update({
            where: { id: goalId },
            data: {
                currentAmount: newAmount,
            },
        });

        logger.info('Funds added to goal', {
            userId,
            goalId,
            amount: data.amount,
            newTotal: newAmount,
        });

        return {
            goal: formatGoal(goal),
            message: `$${data.amount} added to goal successfully`,
        };
    } catch (error) {
        logger.error('Failed to add funds to goal', { error, userId, goalId });
        throw error;
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format goal from database with calculated fields
 */
function formatGoal(goal: any): Goal {
    const current = goal.currentAmount;
    const target = goal.targetAmount;
    const progress = Math.min(Math.round((current / target) * 100), 100);

    let daysLeft: number | null = null;
    if (goal.deadline) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const diffTime = deadline.getTime() - now.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
        id: goal.id,
        userId: goal.userId,
        title: goal.title,
        category: goal.category,
        targetAmount: target,
        currentAmount: current,
        deadline: goal.deadline,
        description: goal.description,
        progress: progress,
        daysLeft: daysLeft,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
    };
};