/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent JSON responses
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

export function errorHandler(
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction) {

    //log error with details
    logger.error('Error occurred:', {
        message: err.message,
        stack: config.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    //handle custom API errors
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
                ...(config.NODE_ENV === 'development' && { stack: err.stack }),
            },
        });
    }
    // Handle Prisma database errors
    if (err.name === 'PrismaClientKnownRequestError') {
        return handlePrismaError(err as any, res);
    }
    
    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input',
                details: (err as any).issues,
            },
        });
    }

    // Handle unknown errors (500)
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: config.NODE_ENV === 'development'
                ? err.message
                : 'An unexpected error occurred',
            ...(config.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
}

// ============================================================================
// PRISMA ERROR HANDLER
// ============================================================================

function handlePrismaError(err: any, res: Response) {
    const { code, meta } = err;
    
    switch (code) {
        case 'P2002': // Unique constraint violation
        return res.status(409).json({
            success: false,
            error: {
                code: 'CONFLICT',
                message: `${meta?.target?.[0] || 'Field'} already exists`,
            },
        });
        
        case 'P2025': // Record not found
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Record not found',
            },
        });
        
        case 'P2003': // Foreign key constraint failed
        return res.status(400).json({
            success: false,
            error: {
                code: 'BAD_REQUEST',
                message: 'Invalid reference',
            },
        });
        
        default:
            return res.status(500).json({
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Database operation failed',
                },
            });
    }
}

// ============================================================================
// ASYNC HANDLER WRAPPER
// ============================================================================

/**
 * Wraps async route handlers to catch errors automatically
 * No need for try-catch in every route!
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};