/**
 * Expense Service
 * Business logic for expense tracking
 */

import { db } from '../config/database';
import {
    LogExpenseRequest,
    LogExpenseResponse,
    GetExpenseQuery,
    GetExpenseResponse,
    ExpenseSummaryQuery,
    ExpenseSummary,
    ExpenseLog,
} from '../types/expense.types';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// LOG EXPENSE
// ============================================================================
export const logExpense = async (
    userId: string,
    data: LogExpenseRequest
): Promise<LogExpenseResponse> => {
    try {
        const expense = await db.expenseLog.create({
            data: {
                userId,
                amount: data.amount,
                category: data.category,
                description: data.description,
                isDeductible: data.isDeductible !== undefined ? data.isDeductible : true,
                receiptUrl: data.receiptUrl,
                loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
            },
        });

        logger.info('Expense logged', { userId, expenseId: expense.id, amount: expense.amount });

        return {
            expense,
            message: 'Expense logged successfully',
        };
    } catch (error) {
        logger.error('Failed to log expense', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET EXPENSE HISTORY
// ============================================================================

export const getExpenseHistory = async (
    userId: string,
    query: GetExpenseQuery
): Promise<GetExpenseResponse> => {
    try {
        const limit = query.limit || 50;
        const offset = query.offset || 0;

        // Build where clause
        const where: any = { userId };

        if (query.startDate || query.endDate) {
            where.loggedAt = {};
            if (query.startDate) {
                where.loggedAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.loggedAt.lte = new Date(query.endDate);
            }
        }

        if (query.category) {
            where.category = query.category;
        }

        if (query.isDeductible !== undefined) {
            where.isDeductible = 
                query.isDeductible === true || 
                (typeof query.isDeductible === 'string' && query.isDeductible === 'true');
        }

        // Get expense records
        const expenses = await db.expenseLog.findMany({
            where,
            orderBy: { loggedAt: 'desc' },
            take: limit,
            skip: offset,
        });

        // Get total count
        const total = await db.expenseLog.count({ where });

        // Calculate amounts
        const aggregation = await db.expenseLog.aggregate({
            where,
            _sum: { amount: true },
        });

        const deductibleAggregation = await db.expenseLog.aggregate({
            where: { ...where, isDeductible: true },
            _sum: { amount: true },
        });

        const totalAmount = Number(aggregation._sum.amount || 0);
        const deductibleAmount = Number(deductibleAggregation._sum.amount || 0);

        logger.info('Expense history retrieved', { userId, count: expenses.length });

        return {
            expenses: expenses as ExpenseLog[],
            total,
            totalAmount,
            deductibleAmount,
            page: Math.floor(offset / limit) + 1,
            limit,
        };
    } catch (error) {
        logger.error('Failed to get expense history', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET EXPENSE SUMMARY
// ============================================================================

export const getExpenseSummary = async (
    userId: string,
    query: ExpenseSummaryQuery
): Promise<ExpenseSummary> => {
    try {
        const now = new Date();
        const month = query.month || now.getMonth() + 1;
        const year = query.year || now.getFullYear();

        // Calculate date range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get all expenses for period
        const expenses = await db.expenseLog.findMany({
            where: {
                userId,
                loggedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // Calculate totals
        const totalExpenses = expenses.reduce((sum, log) => sum + Number(log.amount), 0);
        const totalEntries = expenses.length;
        const deductibleAmount = expenses
            .filter((log) => log.isDeductible)
            .reduce((sum, log) => sum + Number(log.amount), 0);
        const nonDeductibleAmount = totalExpenses - deductibleAmount;

        // Group by category
        const categoryMap = new Map<string, { amount: number; count: number }>();
        expenses.forEach((log) => {
            const existing = categoryMap.get(log.category) || { amount: 0, count: 0 };
            categoryMap.set(log.category, {
                amount: existing.amount + Number(log.amount),
                count: existing.count + 1,
            });
        });

        const byCategory = Array.from(categoryMap.entries())
            .map(([category, data]) => ({ category, ...data }))
            .sort((a, b) => b.amount - a.amount);

        logger.info('Expense summary generated', { userId, month, year });

        return {
            period: `${year}-${String(month).padStart(2, '0')}`,
            totalExpenses,
            totalEntries,
            deductibleAmount,
            nonDeductibleAmount,
            byCategory,
        };
    } catch (error) {
        logger.error('Failed to get expense summary', { error, userId });
        throw error;
    }
};

// ============================================================================
// DELETE EXPENSE
// ============================================================================

export const deleteExpense = async (
    userId: string,
    expenseId: string
): Promise<{ message: string }> => {
    try {
        // Verify ownership
        const expense = await db.expenseLog.findUnique({
            where: { id: expenseId },
        });

        if (!expense) {
            throw new NotFoundError('Expense record not found');
        }

        if (expense.userId !== userId) {
            throw new NotFoundError('Expense record not found');
        }

        // Delete expense
        await db.expenseLog.delete({
            where: { id: expenseId },
        });

        logger.info('Expense deleted', { userId, expenseId });

        return {
            message: 'Expense deleted successfully',
        };
    } catch (error) {
        logger.error('Failed to delete expense', { error, userId, expenseId });
        throw error;
    }
};