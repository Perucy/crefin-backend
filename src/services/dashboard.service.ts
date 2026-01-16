/**
 * Dashboard Service
 * Aggregates financial data for dashboard overview
 */

import { db } from '../config/database';
import { DashboardBalance, QuickStats, DashboardSummary } from '../types/dashboard.types';
import { logger } from '../utils/logger';

// ============================================================================
// GET DASHBOARD BALANCE
// ============================================================================

export const getDashboardBalance = async (userId: string): Promise<DashboardBalance> => {
    try {
        // Get total income
        const incomeData = await db.incomeLog.aggregate({
            where: { userId },
            _sum: { amount: true },
        });

        // Get total expenses
        const expenseData = await db.expenseLog.aggregate({
            where: { userId },
            _sum: { amount: true },
        });

        // Get total allocated to goals
        const goalsData = await db.goal.aggregate({
            where: { userId },
            _sum: { currentAmount: true },
        });

        const totalIncome = Number(incomeData._sum.amount || 0);
        const totalExpenses = Number(expenseData._sum.amount || 0);
        const goalsAllocated = Number(goalsData._sum.currentAmount || 0);
        const totalBalance = totalIncome - totalExpenses;
        const availableBalance = totalBalance - goalsAllocated;

        logger.info('Dashboard balance retrieved', { userId });

        return {
            totalBalance,
            totalIncome,
            totalExpenses,
            availableBalance,
            goalsAllocated,
            currency: 'USD',
        };
    } catch (error) {
        logger.error('Failed to get dashboard balance', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET QUICK STATS
// ============================================================================

export const getQuickStats = async (userId: string): Promise<QuickStats> => {
    try {
        const now = new Date();
        
        // This month dates
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        // Last month dates
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Get this month's income and expenses
        const [thisMonthIncome, thisMonthExpenses] = await Promise.all([
            db.incomeLog.aggregate({
                where: {
                    userId,
                    loggedAt: { gte: thisMonthStart, lte: thisMonthEnd },
                },
                _sum: { amount: true },
            }),
            db.expenseLog.aggregate({
                where: {
                    userId,
                    loggedAt: { gte: thisMonthStart, lte: thisMonthEnd },
                },
                _sum: { amount: true },
            }),
        ]);

        // Get last month's income and expenses for comparison
        const [lastMonthIncome, lastMonthExpenses] = await Promise.all([
            db.incomeLog.aggregate({
                where: {
                    userId,
                    loggedAt: { gte: lastMonthStart, lte: lastMonthEnd },
                },
                _sum: { amount: true },
            }),
            db.expenseLog.aggregate({
                where: {
                    userId,
                    loggedAt: { gte: lastMonthStart, lte: lastMonthEnd },
                },
                _sum: { amount: true },
            }),
        ]);

        const thisIncome = Number(thisMonthIncome._sum.amount || 0);
        const thisExpenses = Number(thisMonthExpenses._sum.amount || 0);
        const lastMonthIncomeAmount = Number(lastMonthIncome._sum.amount || 0); 
        const lastMonthExpenseAmount = Number(lastMonthExpenses._sum.amount || 0);

        // Calculate percentage changes
        const incomeChange = lastMonthIncomeAmount > 0 
            ? Math.round(((thisIncome - lastMonthIncomeAmount) / lastMonthIncomeAmount) * 100) 
            : 0;
        const expenseChange = lastMonthExpenseAmount > 0 
            ? Math.round(((thisExpenses - lastMonthExpenseAmount) / lastMonthExpenseAmount) * 100) 
            : 0;


        // Get top earning skill
        const topSkillData = await db.incomeLog.groupBy({
            by: ['skill'],
            where: { userId, skill: { not: null } },
            _sum: { amount: true },
            _count: { id: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 1,
        });

        // Get top expense category
        const topExpenseData = await db.expenseLog.groupBy({
            by: ['category'],
            where: { userId },
            _sum: { amount: true },
            _count: { id: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 1,
        });

        // Get recent activity
        const [lastIncomeRecord, lastExpenseRecord, totalTransactions] = await Promise.all([
            db.incomeLog.findFirst({
                where: { userId },
                orderBy: { loggedAt: 'desc' },
                select: { loggedAt: true },
            }),
            db.expenseLog.findFirst({
                where: { userId },
                orderBy: { loggedAt: 'desc' },
                select: { loggedAt: true },
            }),
            db.incomeLog.count({ where: { userId } }).then(async (incomeCount) => {
                const expenseCount = await db.expenseLog.count({ where: { userId } });
                return incomeCount + expenseCount;
            }),
        ]);

        logger.info('Quick stats retrieved', { userId });

        return {
            thisMonth: {
                income: thisIncome,
                expenses: thisExpenses,
                profit: thisIncome - thisExpenses,
                incomeChange,
                expenseChange,
            },
            topSkill: {
                skill: topSkillData[0]?.skill || null,
                amount: Number(topSkillData[0]?._sum.amount || 0),
                count: topSkillData[0]?._count.id || 0,
            },
            topExpenseCategory: {
                category: topExpenseData[0]?.category || null,
                amount: Number(topExpenseData[0]?._sum.amount || 0),
                count: topExpenseData[0]?._count.id || 0,
            },
            recentActivity: {
                lastIncomeDate: lastIncomeRecord?.loggedAt || null,
                lastExpenseDate: lastExpenseRecord?.loggedAt || null,
                totalTransactions,
            },
        };
    } catch (error) {
        logger.error('Failed to get quick stats', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET MONTHLY REVENUE DATA (LAST 3 MONTHS)
// ============================================================================

export const getMonthlyData = async (userId: string, months: number = 3) => {
    try {
        const result = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

            const [incomeData, expenseData] = await Promise.all([
                db.incomeLog.aggregate({
                    where: {
                        userId,
                        loggedAt: { gte: startDate, lte: endDate }
                    },
                    _sum: { amount: true }
                }),
                db.expenseLog.aggregate({
                    where: {
                        userId,
                        loggedAt: { gte: startDate, lte: endDate }
                    },
                    _sum: { amount: true }
                })
            ]);

            result.push({
                month: targetDate.toLocaleString('en-US', { month: 'short' }),
                year: targetDate.getFullYear(),
                income: Number(incomeData._sum.amount || 0),
                expenses: Number(expenseData._sum.amount || 0),
            });
        }

        return result;
    } catch (error) {
        logger.error('Failed to get monthly data', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET DASHBOARD SUMMARY (COMBINED)
// ============================================================================

export const getDashboardSummary = async (userId: string): Promise<DashboardSummary> => {
    try {
        const [balance, stats, monthlyData] = await Promise.all([
            getDashboardBalance(userId),
            getQuickStats(userId),
            getMonthlyData(userId, 3), 
        ]);

        logger.info('Dashboard summary retrieved', { userId });

        return {
            balance,
            stats,
            monthlyData,  
        };
    } catch (error) {
        logger.error('Failed to get dashboard summary', { error, userId });
        throw error;
    }
};

