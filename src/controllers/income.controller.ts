/**
 * Income Controller
 * Handles HTTP requests for expense tracking
 */
import { Request, Response, NextFunction } from 'express';
import * as incomeService from '../services/income.service';
import {
    LogIncomeRequest,
    GetIncomeQuery, 
    IncomeSummaryQuery
} from '../types/income.types';
import { sendSuccess } from '../utils/response';

// ============================================================================
// LOG INCOME
// ============================================================================
export const logIncome = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const data: LogIncomeRequest = req.body;

        const result = await incomeService.logIncome(userId, data);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET INCOME HISTORY
// ============================================================================
export const getIncomeHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const query: GetIncomeQuery = {
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            skill: req.query.skill as string,
            clientName: req.query.clientName as string,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        };

        //get income history
        const result = await incomeService.getIncomeHistory(userId, query);

        sendSuccess(res, result, 'Income history retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET INCOME SUMMARY
// ============================================================================
export const getIncomeSummary = async (
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
        const query: IncomeSummaryQuery = {
            month: req.query.month ? parseInt(req.query.month as string) : undefined,
            year: req.query.year ? parseInt(req.query.year as string) : undefined,
        };

        //get income summary
        const result = await incomeService.getIncomeSummary(userId, query);

        sendSuccess(res, result, 'Income summary retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// DELETE INCOME
// ============================================================================
export const deleteIncome = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const incomeId = req.params.id;

        const result = await incomeService.deleteIncome(userId, incomeId);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};
