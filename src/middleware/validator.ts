/**
 * Validation Middleware
 * Validates request data against Zod schemas
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Middleware factory to validate request data
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Validate request body against schema
            schema.parse(req.body);
            
            // If validation passes, continue to next middleware
            next();
        } catch (error) {
            // If validation fails, send error response
            if (error instanceof ZodError) {
                // Extract validation errors
                const errors = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                logger.warn('Validation failed', {
                    path: req.path,
                    errors,
                });

                // Send 400 Bad Request with validation errors
                return sendError(
                    res,
                    'Validation failed',
                    400,
                    'VALIDATION_ERROR'
                );
            }

            // Unexpected error
            logger.error('Validation error', { error });
            return sendError(res, 'Validation error', 500);
        }
    };
};

/**
 * Middleware factory to validate query parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Validate query parameters against schema
            schema.parse(req.query);
            
            // If validation passes, continue to next middleware
            next();
        } catch (error) {
            // If validation fails, send error response
            if (error instanceof ZodError) {
                // Extract validation errors
                const errors = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                logger.warn('Query validation failed', {
                    path: req.path,
                    errors,
                });

                // Send 400 Bad Request with validation errors
                return sendError(
                    res,
                    'Validation failed',
                    400,
                    'VALIDATION_ERROR'
                );
            }

            // Unexpected error
            logger.error('Query validation error', { error });
            return sendError(res, 'Validation error', 500);
        }
    };
};