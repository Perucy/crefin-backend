/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard data
 */

import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

// ============================================================================
// GET DASHBOARD BALANCE
// ============================================================================

export const getDashboardBalance = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const result = await dashboardService.getDashboardBalance(userId);

        sendSuccess(res, result, 'Dashboard balance retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET QUICK STATS
// ============================================================================

export const getQuickStats = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const result = await dashboardService.getQuickStats(userId);

        sendSuccess(res, result, 'Quick stats retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET DASHBOARD SUMMARY (COMBINED)
// ============================================================================

export const getDashboardSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const result = await dashboardService.getDashboardSummary(userId);

        sendSuccess(res, result, 'Dashboard summary retrieved successfully');
    } catch (error) {
        next(error);
    }
};