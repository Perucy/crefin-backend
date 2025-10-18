/**
 * Response Utilities
 * Standardizes API responses across the application
 */

import { Response } from 'express';

// ============================================================================
// SUCCESS RESPONSE
// ============================================================================

/**
 * Send successful response
 * @param res - Express response object
 * @param data - Data to send (can be null)
 * @param message - Success message
 * @param statusCode - HTTP status code (default: 200)
 */

export const sendSuccess = (
    res: Response,
    data: any = null,
    message: string = 'Success',
    statusCode: number = 200
): void => {
    res.status(statusCode).json({
        success: true,
        data,
        message,
    });
};

// ============================================================================
// ERROR RESPONSE
// ============================================================================

/**
 * Send successful response
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param error - Error code/type (optional)
 */
export const sendError = (
    res: Response,
    message: string = 'Error',
    statusCode: number = 500,
    error?: string
): void => {
    const response: any = {
        success: false,
        message,
    }
    if (error) {
        response.error = error;
    }

    res.status(statusCode).json(response);
}