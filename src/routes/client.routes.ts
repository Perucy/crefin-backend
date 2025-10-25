/**
 * Client Routes
 * Defines all client management API endpoints
 */

import { Router } from 'express';
import * as clientController from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validator';
import { z } from 'zod';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Validation for creating a client
 * - name: Required, min 2 characters
 * - email: Optional, must be valid email if provided
 * - phone: Optional string
 */
const createClientSchema = z.object({
    name: z.string().min(2, 'Client name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * Validation for updating a client
 * All fields optional (partial update)
 */
const updateClientSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * Validation for query parameters
 * All optional for flexibility
 */
const getClientsQuerySchema = z.object({
    search: z.string().optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),     // Must be numeric string
    offset: z.string().regex(/^\d+$/, 'Offset must be a number').optional(),
});

/**
 * @route POST /api/v1/clients
 * @desc create a new client
 * @access Private
 */
router.post('/', authenticate, validate(createClientSchema), clientController.createClient);

/**
 * @route GET /api/v1/clients
 * @desc get all clients with optional search/pagination
 * @access Private
 */
router.get('/', authenticate, validateQuery(getClientsQuerySchema), clientController.getClients);

/**
 * @route GET /api/v1/clients/:id
 * @desc get single client with income stats
 * @access Private
 */
router.get('/:id', authenticate, clientController.getClientById);

/**
 * @route PATCH /api/v1/clients/:id
 * @desc update client information
 * @access Private
 */
router.patch('/:id', authenticate, validate(updateClientSchema), clientController.updateClient);

/**
 * @route DELETE /api/v1/clients/:id
 * @desc delete a client
 * @access Private
 */
router.delete('/:id', authenticate, clientController.deleteClient);

export default router;
