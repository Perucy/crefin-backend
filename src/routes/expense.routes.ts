/**
 * Expense Routes
 * Defines API endpoints for expense tracking
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validator';
import * as expenseController from '../controllers/expense.controller';
import { z } from 'zod';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const logExpenseSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    isDeductible: z.boolean().optional(),
    receiptUrl: z.string().url('Invalid receipt URL').optional(),
    loggedAt: z.string().datetime().optional().or(z.date().optional()),
});

export const getExpenseQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    category: z.string().optional(),
    isDeductible: z.enum(['true', 'false']).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const expenseSummarySchema = z.object({
    month: z.string()
        .regex(/^([1-9]|1[0-2])$/, 'Month must be between 1 and 12')
        .transform(Number)
        .optional(),
    year: z.string()
        .regex(/^\d{4}$/, 'Year must be a 4-digit number')
        .transform(Number)
        .optional(),
});

// ============================================================================
// EXPENSE ENDPOINTS
// ============================================================================

/**
 * @route POST /api/v1/expenses
 * @desc Log a new expense
 * @access Private
 */
router.post('/', authenticate, validate(logExpenseSchema), expenseController.logExpense);

/**
 * @route GET /api/v1/expenses
 * @desc Get expense history with optional filters
 * @access Private
 */
router.get('/', authenticate, validateQuery(getExpenseQuerySchema), expenseController.getExpenseHistory);

/**
 * @route GET /api/v1/expenses/summary
 * @desc Get expense summary for a month/year
 * @access Private
 */
router.get('/summary', authenticate, validateQuery(expenseSummarySchema), expenseController.getExpenseSummary);

/**
 * @route DELETE /api/v1/expenses/:id
 * @desc Delete an expense by ID
 * @access Private
 */
router.delete('/:id', authenticate, expenseController.deleteExpense);

export default router;