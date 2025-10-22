/**
 * Expense Controller
 * Handles HTTP requests for expense tracking
 */

import { Request, Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service';
import { 
    LogExpenseRequest, 
    GetExpenseQuery, 
    ExpenseSummaryQuery 
} from '../types/expense.types';
import { sendSuccess } from '../utils/response';

// ============================================================================
// LOG EXPENSE
// ============================================================================

export const logExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const data: LogExpenseRequest = req.body;

        const result = await expenseService.logExpense(userId, data);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET EXPENSE HISTORY
// ============================================================================

export const getExpenseHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const query: GetExpenseQuery = {
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            category: req.query.category as string,
            isDeductible: req.query.isDeductible === 'true' ? true : 
                        req.query.isDeductible === 'false' ? false : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        };

        //get expense history
        const result = await expenseService.getExpenseHistory(userId, query);

        sendSuccess(res, result, 'Expense history retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET EXPENSE SUMMARY
// ============================================================================

export const getExpenseSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get user ID from authenticated request
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        // Extract query parameters
        const query: ExpenseSummaryQuery = {
            month: req.query.month ? parseInt(req.query.month as string) : undefined,
            year: req.query.year ? parseInt(req.query.year as string) : undefined,
        };

        // Call service to get expense summary
        const result = await expenseService.getExpenseSummary(userId, query);

        sendSuccess(res, result, 'Expense summary retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// DELETE EXPENSE
// ============================================================================

export const deleteExpense = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get user ID from authenticated request
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        // Get expense ID from URL params
        const expenseId = req.params.id;

        // Call service to delete expense
        const result = await expenseService.deleteExpense(userId, expenseId);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};