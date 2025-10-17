/**
 * Authentication Middleware
 * Protects routes that require authentication
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { db } from '../config/database';

// ============================================================================
// EXTEND EXPRESS REQUEST TYPE
// ============================================================================

// Add user property to Request interface
declare global {
    namespace Express {
        interface Request {
        user?: TokenPayload & {
            id: string; // Alias for userId
        };
        }
    }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require valid JWT token
 * Attaches user data to req.user
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Extract token from Authorization header
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            throw new UnauthorizedError('No token provided');
        }
    
        // Verify token
        const payload = verifyAccessToken(token);
        
        // Check if user still exists (account might be deleted)
        const user = await db.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, isPremium: true },
        });
        
        if (!user) {
            throw new UnauthorizedError('User not found');
        }
    
        // Attach user to request
        req.user = {
        ...payload,
        id: payload.userId, // Alias
        };
    
        next();
    } catch (error) {
        next(error);
    }
}

// ============================================================================
// OPTIONAL AUTHENTICATION
// ============================================================================

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes with different behavior for logged-in users
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        
        if (token) {
            const payload = verifyAccessToken(token);
            const user = await db.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, email: true, isPremium: true },
            });
        
            if (user) {
                req.user = {
                ...payload,
                id: payload.userId,
                };
            }
        }
        
        next();
    } catch (error) {
        // Ignore errors in optional auth
        next();
    }
}
// ============================================================================
// PREMIUM USER GUARD
// ============================================================================

/**
 * Require premium subscription
 * Must be used AFTER authenticate middleware
 */
export function requirePremium(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
    }
  
    if (!req.user.isPremium) {
        return next(new ForbiddenError('Premium subscription required'));
    }
  
    next();
}
