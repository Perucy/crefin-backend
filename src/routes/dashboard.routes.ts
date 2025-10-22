/**
 * Dashboard Routes
 * Defines API endpoints for dashboard data
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// ============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================================

router.use(authenticate);

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/dashboard/balance
 * @desc Get total balance and financial overview
 * @access Private
 */
router.get('/balance', dashboardController.getDashboardBalance);

/**
 * @route GET /api/v1/dashboard/stats
 * @desc Get quick statistics (this month, top skill, top expense, etc.)
 * @access Private
 */
router.get('/stats', dashboardController.getQuickStats);

/**
 * @route GET /api/v1/dashboard
 * @desc Get complete dashboard summary (balance + stats combined)
 * @access Private
 */
router.get('/', dashboardController.getDashboardSummary);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;