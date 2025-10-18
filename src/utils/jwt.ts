/**
 * JWT Token Utilities
 * Handles token generation and verification for authentication
 */
import * as jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UnauthorizedError } from './errors';

// ============================================================================
// TOKEN PAYLOAD INTERFACE
// ============================================================================

export interface TokenPayload {
    userId: string;
    email: string;
    isPremium: boolean;
}

// ============================================================================
// GENERATE TOKENS
// ============================================================================

/**
 * Generate access token (short-lived, 15 minutes)
 * Sent with every API request
 */
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
        payload, 
        config.JWT_SECRET as jwt.Secret, 
        {
            expiresIn: config.JWT_EXPIRES_IN,
            issuer: 'crefin-api',
            audience: 'crefin-app',
        } as jwt.SignOptions  
    );
}

/**
 * Generate refresh token (long-lived, 7 days)
 * Used to get new access tokens
 */
export function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
        payload, 
        config.JWT_REFRESH_SECRET as jwt.Secret,  // ✅ Fixed: Use JWT_REFRESH_SECRET
        {
            expiresIn: config.JWT_REFRESH_EXPIRES_IN,
            issuer: 'crefin-api',
            audience: 'crefin-app',
        } as jwt.SignOptions  
    );
}

/**
 * Generate both tokens at once
 * Used on login/register
 */
export function generateTokenPair(payload: TokenPayload) {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
}

// ============================================================================
// VERIFY TOKENS
// ============================================================================

/**
 * Verify access token
 * Used in auth middleware
 */
export function verifyAccessToken(token: string): TokenPayload {
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET, {
            issuer: 'crefin-api',
            audience: 'crefin-app',
        }) as TokenPayload;
        
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError('Access token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError('Invalid access token');
        }
        throw new UnauthorizedError('Token verification failed');
    }
}

/**
 * Verify refresh token
 * Used in refresh endpoint
 */
export function verifyRefreshToken(token: string): TokenPayload {
    try {
        const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
            issuer: 'crefin-api',
            audience: 'crefin-app',
        }) as TokenPayload;
        
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError('Refresh token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError('Invalid refresh token');
        }
        throw new UnauthorizedError('Token verification failed');
    }
}

// ============================================================================
// EXTRACT TOKEN FROM HEADER
// ============================================================================

/**
 * Extract Bearer token from Authorization header
 * Format: "Authorization: Bearer <token>"
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    
    return parts[1];
}

// ============================================================================
// TOKEN EXPIRATION
// ============================================================================

/**
 * Get token expiration time in seconds
 */
export function getTokenExpiration(token: string): number {
    try {
        const decoded = jwt.decode(token) as any;
        return decoded.exp;
    } catch {
        return 0;
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
    const exp = getTokenExpiration(token);
    return Date.now() >= exp * 1000;
}