/**
 * Goal Routes
 * Defines API endpoints for financial goals
 */

import { Router } from 'express';
import * as goalController from '../controllers/goal.controller';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const createGoalSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    category: z.enum([
        'travel',
        'real-estate',
        'education',
        'emergency-fund',
        'business',
        'retirement',
        'custom',
    ]),
    targetAmount: z.number().positive('Target amount must be positive'),
    currentAmount: z.number().min(0, 'Current amount cannot be negative').optional(),
    deadline: z.string().datetime().optional(),
    description: z.string().max(500, 'Description too long').optional(),
});

export const updateGoalSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    category: z.enum([
        'travel',
        'real-estate',
        'education',
        'emergency-fund',
        'business',
        'retirement',
        'custom',
    ]).optional(),
    targetAmount: z.number().positive().optional(),
    currentAmount: z.number().min(0).optional(),
    deadline: z.string().datetime().optional(),
    description: z.string().max(500).optional(),
});

export const addFundsSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    note: z.string().max(200).optional(),
});

// ============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================================

router.use(authenticate);

// ============================================================================
// GOAL ENDPOINTS
// ============================================================================

/**
 * @route POST /api/v1/goals
 * @desc Create a new financial goal
 * @access Private
 */
router.post('/', validate(createGoalSchema), goalController.createGoal);

/**
 * @route GET /api/v1/goals
 * @desc Get all financial goals for the authenticated user
 * @access Private
 */
router.get('/', goalController.getGoals);

/**
 * @route GET /api/v1/goals/:id
 * @desc Get a specific goal by ID
 * @access Private
 */
router.get('/:id', goalController.getGoalById);

/**
 * @route PATCH /api/v1/goals/:id
 * @desc Update a goal
 * @access Private
 */
router.patch('/:id', validate(updateGoalSchema), goalController.updateGoal);

/**
 * @route DELETE /api/v1/goals/:id
 * @desc Delete a goal
 * @access Private
 */
router.delete('/:id', goalController.deleteGoal);

/**
 * @route POST /api/v1/goals/:id/add-funds
 * @desc Add money to a goal
 * @access Private
 */
router.post('/:id/add-funds', validate(addFundsSchema), goalController.addFundsToGoal);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;