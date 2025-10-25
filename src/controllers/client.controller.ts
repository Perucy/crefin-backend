/**
 * Client Controller
 * Handles HTTP requests for client management
 */

import { Request, Response, NextFunction } from 'express';
import * as clientService from '../services/client.service';
import { sendSuccess, sendError } from '../utils/response';

// ============================================================================
// CREATE CLIENT
// ============================================================================

export const createClient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get user ID from authenticated request (set by auth middleware)
        const userId = req.user?.id;

        if (!userId) {
            return sendError(res, 'User not authenticated', 401);
        }

        // Call service to create client
        const result = await clientService.createClient(userId, req.body);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET ALL CLIENTS
// ============================================================================

export const getClients = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return sendError(res, 'User not authenticated', 401);
        }

        // Extract query parameters
        const query = {
            search: req.query.search as string,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        };

        const result = await clientService.getClients(userId, query);

        sendSuccess(res, result, 'Clients fetched successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET CLIENT BY ID
// ============================================================================

export const getClientById = async (
    req: Request,
    res: Response,
  next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return sendError(res, 'User not authenticated', 401);
        }

        // Get client ID from URL parameter
        const clientId = req.params.id;

        const result = await clientService.getClientById(userId, clientId);

        sendSuccess(res, result, 'Client fetched successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// UPDATE CLIENT
// ============================================================================

export const updateClient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return sendError(res, 'User not authenticated', 401);
        }

        const clientId = req.params.id;

        const result = await clientService.updateClient(userId, clientId, req.body);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// DELETE CLIENT
// ============================================================================

export const deleteClient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return sendError(res, 'User not authenticated', 401);
        }

        const clientId = req.params.id;

        const result = await clientService.deleteClient(userId, clientId);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};