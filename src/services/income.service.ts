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
    query: GetIncomeQuery
): Promise <GetIncomeResponse> => {
    try {
        const limit = query.limit || 50;
        const offset = query.offset || 0;

        // build where clause
        const where: any = { userId };

        if (query.startDate || query.endDate) {
            where.loggedAt = {};
            if (query.startDate) {
                where.loggedAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.loggedAt.gte = new Date(query.endDate);
            }
        }

        if (query.skill) {
            where.skill = query.skill;
        }

        if (query.clientName) {
            where.clientName = { contains: query.clientName, mode: 'insensitive' };
        }

        //get income records
        const income = await db.incomeLog.findMany({
            where,
            orderBy: { loggedAt: 'desc' },
            take: limit,
            skip: offset,
        });

        //get total count 
        const total = await db.incomeLog.count({ where });

        //calculate total amount
        const aggregation = await db.incomeLog.aggregate({
            where,
            _sum: { amount: true },
        });

        const totalAmount = Number(aggregation._sum.amount || 0);

        logger.info('Income history retrieved', { userId, count: income.length });

        return {
            income: income,
            total,
            totalAmount,
            page: Math.floor(offset / limit) + 1,
            limit,
        };

    } catch (error) {
        logger.error('Failed to get income history', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET INCOME SUMMARY
// ============================================================================
export const getIncomeSummary = async (
    userId: string,
    query: IncomeSummaryQuery
): Promise<IncomeSummary> => {
    try {
        const now = new Date();
        const month = query.month || now.getMonth() + 1;
        const year = query.year || now.getFullYear();

        // Calculate date range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get all income for period
        const income = await db.incomeLog.findMany({
            where: {
                userId,
                loggedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // Calculate totals
        const totalIncome = income.reduce((sum, log) => sum + Number(log.amount), 0);
        const totalEntries = income.length;
        const totalHours = income.reduce((sum, log) => sum + Number(log.hours || 0), 0);
        const averageRate = totalHours > 0 ? totalIncome / totalHours : 0;

        // Group by skill
        const skillMap = new Map<string, { amount: number; count: number }>();
        income.forEach((log) => {
            if (log.skill) {
                const existing = skillMap.get(log.skill) || { amount: 0, count: 0 };
                skillMap.set(log.skill, {
                    amount: existing.amount + Number(log.amount),
                    count: existing.count + 1,
                });
            }
        });

        const topSkills = Array.from(skillMap.entries())
            .map(([skill, data]) => ({ skill, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        // Group by client
        const clientMap = new Map<string, { amount: number; count: number }>();
        income.forEach((log) => {
            if (log.clientName) {
                const existing = clientMap.get(log.clientName) || { amount: 0, count: 0 };
                clientMap.set(log.clientName, {
                    amount: existing.amount + Number(log.amount),
                    count: existing.count + 1,
                });
            }
        });

        const topClients = Array.from(clientMap.entries())
            .map(([clientName, data]) => ({ clientName, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        logger.info('Income summary generated', { userId, month, year });

        return {
            period: `${year}-${String(month).padStart(2, '0')}`,
            totalIncome,
            totalEntries,
            totalHours,
            averageRate,
            topSkills,
            topClients,
        };
    } catch (error) {
        logger.error('Failed to get income summary', { error, userId });
        throw error;
    }
};

// ============================================================================
// DELETE INCOME
// ============================================================================

export const deleteIncome = async (
    userId: string,
    incomeId: string
): Promise<{ message: string }> => {
    try {
        // Verify ownership
        const income = await db.incomeLog.findUnique({
            where: { id: incomeId },
        });

        if (!income) {
            throw new NotFoundError('Income record not found');
        }

        if (income.userId !== userId) {
            throw new NotFoundError('Income record not found');
        }

        // Delete income
        await db.incomeLog.delete({
            where: { id: incomeId },
        });

        logger.info('Income deleted', { userId, incomeId });

        return {
            message: 'Income deleted successfully',
        };
    } catch (error) {
        logger.error('Failed to delete income', { error, userId, incomeId });
        throw error;
    }
};