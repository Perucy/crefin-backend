/**
 * Income Service (Updated with Client Linking)
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
// LOG INCOME (WITH SMART CLIENT MATCHING)
// ============================================================================

/**
 * Logs income and automatically links to client if possible
 * 
 * Smart Matching Logic:
 * 1. If clientId provided → use it directly
 * 2. If only clientName provided → search for matching client
 * 3. If match found → auto-link with clientId
 * 4. If no match → just save clientName (for backward compatibility)
 */
export const logIncome = async (
  userId: string,
  data: LogIncomeRequest
): Promise<LogIncomeResponse> => {
    try {
        let clientId = data.clientId;
        let clientName = data.clientName;

        // SMART MATCHING: If no clientId but clientName provided
        if (!clientId && clientName) {
            // Try to find existing client by name (case-insensitive)
            const existingClient = await db.client.findFirst({
                where: {
                userId,
                name: {
                    equals: clientName,
                    mode: 'insensitive',  // "ABC Corp" matches "abc corp"
                },
                },
            });

            if (existingClient) {
                clientId = existingClient.id;  // Auto-link to found client!
                logger.info('Auto-linked income to existing client', {
                userId,
                clientName,
                clientId,
                });
            }
        }

        // If clientId provided but no clientName, fetch client name
        if (clientId && !clientName) {
            const client = await db.client.findUnique({
                where: { id: clientId },
            });

            if (client && client.userId === userId) {
                clientName = client.name;  // Use client's name from database
            } else {
                throw new NotFoundError('Client not found');
            }
        }

        // Create income log
        const income = await db.incomeLog.create({
            data: {
                userId,
                amount: data.amount,
                projectName: data.projectName,
                clientName: clientName,
                clientId: clientId,  // Will be null if no match found
                skill: data.skill,
                hours: data.hours,
                ratePerHour: data.ratePerHour,
                source: data.source || 'manual',
                notes: data.notes,
                loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
            },
        });

        logger.info('Income logged', {
            userId,
            incomeId: income.id,
            amount: income.amount.toString(),
            clientId: income.clientId,
            clientName: income.clientName,
        });

        return {
            income: income as IncomeLog,
            message: 'Income logged successfully',
        };
    } catch (error) {
        logger.error('Failed to log income', { userId, error });
        throw error;
    }
};

// ============================================================================
// GET INCOME HISTORY
// ============================================================================

/**
 * Fetches income history with optional filters
 * Supports filtering by both clientId and clientName
 */
export const getIncomeHistory = async (
    userId: string,
    query: GetIncomeQuery
): Promise<GetIncomeResponse> => {
    try {
        // Build WHERE clause
        const where: any = { userId };

        // Date range filter
        if (query.startDate || query.endDate) {
            where.loggedAt = {};
            if (query.startDate) {
                where.loggedAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.loggedAt.lte = new Date(query.endDate);
            }
        }

        // Skill filter
        if (query.skill) {
            where.skill = query.skill;
        }

        // Client filter (supports both ID and name)
        if (query.clientId) {
            where.clientId = query.clientId;
        } else if (query.clientName) {
            where.clientName = {
                contains: query.clientName,
                mode: 'insensitive',
            };
        }

        // Get total count
        const total = await db.incomeLog.count({ where });

        // Fetch income logs
        const incomeLogs = await db.incomeLog.findMany({
            where,
            orderBy: { loggedAt: 'desc' },
            take: query.limit || 50,
            skip: query.offset || 0,
        });

        // Calculate total amount
        const totalAmount = incomeLogs.reduce(
            (sum, log) => sum + Number(log.amount),
            0
        );
        // Calculate page number
        const limit = query.limit || 50;
        const offset = query.offset || 0;
        const page = Math.floor(offset / limit) + 1;

        logger.info('Income history fetched', { userId, total, count: incomeLogs.length });

        return {
            income: incomeLogs as IncomeLog[],
            total,
            totalAmount,
            page,
            limit,
        };
    } catch (error) {
        logger.error('Failed to fetch income history', { userId, error });
        throw error;
    }
};

// ============================================================================
// GET INCOME SUMMARY
// ============================================================================

/**
 * Generates monthly/yearly income summary with statistics
 */
export const getIncomeSummary = async (
    userId: string,
    query: IncomeSummaryQuery
): Promise<IncomeSummary> => {
    try {
        // Default to current month/year if not provided
        const now = new Date();
        const month = query.month || now.getMonth() + 1; // 1-12
        const year = query.year || now.getFullYear();

        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1); // First day of month
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

        // Fetch income logs for the period
        const incomeLogs = await db.incomeLog.findMany({
            where: {
                userId,
                loggedAt: {
                gte: startDate,
                lte: endDate,
                },
            },
        });

        // Calculate totals
        const totalIncome = incomeLogs.reduce(
            (sum, log) => sum + Number(log.amount),
            0
        );

        const totalEntries = incomeLogs.length;

        const totalHours = incomeLogs.reduce(
            (sum, log) => sum + (log.hours ? Number(log.hours) : 0),
            0
        );

        const averageRate = totalHours > 0 ? totalIncome / totalHours : 0;

        // Group by skill
        const skillMap = new Map<string, { amount: number; count: number }>();
        incomeLogs.forEach((log) => {
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

        // Group by client (include both clientId and clientName)
        const clientMap = new Map<
            string,
            { clientName: string; clientId: string | null; amount: number; count: number }
        >();

        incomeLogs.forEach((log) => {
            if (log.clientName) {
                // Use clientId as key if available, otherwise use clientName
                const key = log.clientId || log.clientName;
                const existing = clientMap.get(key);

                if (existing) {
                existing.amount += Number(log.amount);
                existing.count += 1;
                } else {
                clientMap.set(key, {
                    clientName: log.clientName,
                    clientId: log.clientId,
                    amount: Number(log.amount),
                    count: 1,
                });
                }
            }
        });

        const topClients = Array.from(clientMap.values())
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
        logger.error('Failed to get income summary', { userId, error });
        throw error;
    }
};

// ============================================================================
// DELETE INCOME
// ============================================================================

/**
 * Deletes an income log entry
 */
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
        logger.error('Failed to delete income', { userId, incomeId, error });
        throw error;
    }
};