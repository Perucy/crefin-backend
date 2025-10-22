/**
 * Goal Controller
 * Handles HTTP requests for financial goals
 */

import { Request, Response, NextFunction } from 'express';
import * as goalService from '../services/goal.service';
import {
    CreateGoalRequest,
    UpdateGoalRequest,
    AddFundsRequest,
} from '../types/goal.types';
import { sendSuccess } from '../utils/response';

// ============================================================================
// CREATE GOAL
// ============================================================================
export const createGoal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const data: CreateGoalRequest = req.body;

        const result = await goalService.createGoal(userId, data);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
}

// ============================================================================
// GET ALL GOALS
// ============================================================================

export const getGoals = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const result = await goalService.getGoals(userId);

        sendSuccess(res, result, 'Goals retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET GOAL BY ID
// ============================================================================

export const getGoalById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const goalId = req.params.id;

        const result = await goalService.getGoalById(userId, goalId);

        sendSuccess(res, { goal: result }, 'Goal retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// UPDATE GOAL
// ============================================================================

export const updateGoal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const goalId = req.params.id;

        // Validate request body
        const data: UpdateGoalRequest = req.body;

        const result = await goalService.updateGoal(userId, goalId, data);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// DELETE GOAL
// ============================================================================

export const deleteGoal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const goalId = req.params.id;

        const result = await goalService.deleteGoal(userId, goalId);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// ADD FUNDS TO GOAL
// ============================================================================

export const addFundsToGoal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const goalId = req.params.id;

        // Validate request body
        const data: AddFundsRequest = req.body;

        const result = await goalService.addFundsToGoal(userId, goalId, data);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};