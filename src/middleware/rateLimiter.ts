/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per user/IP
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/environment';
import { RateLimitError } from '../utils/errors';

// ============================================================================
// STANDARD RATE LIMITER
// ============================================================================

/**
 * Standard rate limiter for all API routes
 * Free users: 100 requests per 15 minutes
 * Premium users: No limit (skip check)
 */
export const rateLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
    max: config.RATE_LIMIT_MAX_REQUESTS,    // 100 requests
    
    // Skip rate limiting for premium users
    skip: (req: Request) => {
        return (req as any).user?.isPremium || false;
    },
    
    // Custom error message
    handler: (req: Request, res: Response) => {
        const minutes = Math.ceil(config.RATE_LIMIT_WINDOW_MS / 60000);
        throw new RateLimitError(
            `Too many requests. Try again in ${minutes} minutes.`
        );
    },
    
    // Return rate limit info in headers
    standardHeaders: true,  // RateLimit-* headers
    legacyHeaders: false,   // X-RateLimit-* headers (old)
});

// ============================================================================
// AUTH RATE LIMITER (Stricter)
// ============================================================================

/**
 * Stricter rate limiter for auth endpoints
 * 5 requests per 15 minutes (prevent brute force)
 */
export const authRateLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: 5,
    
    handler: (req: Request, res: Response) => {
        throw new RateLimitError(
            'Too many authentication attempts. Try again in 15 minutes.'
        );
    },
    
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================================================
// AI RATE LIMITER (More Expensive)
// ============================================================================

/**
 * Rate limiter for AI/ML endpoints
 * Free: 10 per hour, Premium: 100 per hour
 */
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    
    // Dynamic limit based on user type
    max: (req: Request) => {
        return (req as any).user?.isPremium ? 100 : 10;
    },
    
    handler: (req: Request, res: Response) => {
        const user = (req as any).user;
        const limit = user?.isPremium ? 100 : 10;
        throw new RateLimitError(
            `AI analysis limit reached (${limit}/hour). ${
                user?.isPremium
                ? 'Try again later.'
                : 'Upgrade to Premium for 10x more requests.'
            }`
        );
    },
    
    standardHeaders: true,
    legacyHeaders: false,
});
