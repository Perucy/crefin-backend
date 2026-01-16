import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validator';
import * as incomeController from '../controllers/income.controller';
import { z } from 'zod';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const logIncomeSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    projectName: z.string().optional(),
    clientName: z.string().optional(),
    clientId: z.string().uuid('Invalid client ID').optional(),
    skill: z.string().optional(),
    hours: z.number().positive('Hours must be positive').optional(),
    ratePerHour: z.number().positive('Rate per hour must be positive').optional(),
    source: z.enum(['manual', 'voice']).optional(),
    notes: z.string().optional(),
    loggedAt: z.string()
                .transform((val) => new Date(val).toISOString())
                .optional(),
});

export const getIncomeQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    skill: z.string().optional(),
    clientName: z.string().optional(),
    clientId: z.string().uuid('Invalid client ID').optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const incomeSummarySchema = z.object({
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
// INCOME ENDPOINTS
// ============================================================================

/**
 * @route POST /api/v1/income
 * @desc Log a new income entry
 * @access Private
 */
router.post('/', authenticate, validate(logIncomeSchema), incomeController.logIncome);

/**
 * @route GET /api/v1/income
 * @desc Get income history with optional filters
 * @access Private
 */
router.get('/', authenticate, validateQuery(getIncomeQuerySchema), incomeController.getIncomeHistory);

/**
 * @route GET /api/v1/income/summary
 * @desc Get income summary for a month/year
 * @access Private
 */
router.get('/summary', authenticate, validateQuery(incomeSummarySchema), incomeController.getIncomeSummary);

/**
 * @route DELETE /api/v1/income/:id
 * @desc Delete an income entry by ID
 * @access Private
 */
router.delete('/:id', authenticate, incomeController.deleteIncome);

export default router;