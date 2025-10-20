/**
 * Income Service
 * Business logic for income tracking
 */
import { db } from '../config/database';
import {
    LogIncomeRequest,
    LogIncomeResponse,
    GetIncomeQuery,
    GetIncomeResponse,
    IncomeSummaryQuery,
    IncomeSummary,
    IncomeLog,
} from '../types/income.types';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// LOG INCOME
// ============================================================================
export const logIncome = async (
    userId: string,
    data: LogIncomeRequest
): Promise<LogIncomeResponse> => {
    try {
        const income = await db.incomeLog.create({
            data: {
                userId,
                amount: data.amount,
                projectName: data.projectName,
                clientName: data.clientName,
                skill: data.skill,
                hours: data.hours,
                ratePerHour: data.ratePerHour,
                source: data.source || 'manual',
                notes: data.notes,
                loggedAt: data.loggedAt ? new Date(data.loggedAt): new Date(),
            },
        });

        logger.info('Income logged', { userId, incomeId: income.id, amount: income.amount.toString() });

        return {
            income,
            message: 'Income Logged successfully!'
        };
    } catch (error) {
        logger.error('Failed to log income', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET INCOME HISTORY
// ============================================================================
export const getIncomeHistory = async (
    userId: string,
    data: GetIncomeQuery
): Promise <GetIncomeResponse> => {
    try {
        const limit = query.limit

    } catch (error) {
        logger.error('Failed to get income history', { error, userId });
        throw error;
    }
}