/**
 * Authentication Service
 * Contains all business logic for authentication
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { config } from '../config/environment';
import {
    User,
    SafeUser,
    RegisterRequest,
    LoginRequest,
    TokenPayload,
    AuthResult,
} from '../types/auth.types';
import {
    ValidationError,
    AuthenticationError,
    ConflictError,
    NotFoundError,
} from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Remove sensitive data from user object
 */
const sanitizeUser = (user: User):SafeUser => {
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = user;
    return safeUser as SafeUser;
};

/**
 * Generate JWT access token (expires in 1 hour)
 */
const generateAccessToken = (payload: TokenPayload):string => {
    return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: '1h',
    });
};

/**
 * Generate JWT refresh token (expires in 7 days)
 */
const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
};

/**
 * Generate random token for email verification or password reset
 */
const generateRandomToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Store refresh token in Redis (7 days)
 */
const storeRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
    const key = `refresh_token:${userId}`;
    await redis.setEx(key, 7 * 24 * 60 * 60, refreshToken);
}

/**
 * Verify refresh token from Redis
 */
const verifyRefreshToken = async (userId: string, refreshToken: string): Promise<boolean> => {
    const key = `refresh_token:${userId}`;
    const storedToken = await redis.get(key);
    return storedToken === refreshToken;
}

// ============================================================================
// REGISTRATION
// ============================================================================

export const register = async (data: RegisterRequest): Promise<AuthResult> => {
    try {
        // check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // hash passwd
        const hashedPassword = await bcrypt.hash(data.password, 12);

        //generate email verif token
        const emailVerificationToken = generateRandomToken();
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        //create user
        const user = await db.user.create({
            data: {
                email: data.email.toLowerCase(),
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                emailVerificationToken,
                emailVerificationExpires,
                isPremium: false,
                isEmailVerified: false,
            },
        });

        //generate tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            isPremium: user.isPremium,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // store refresh token
        await storeRefreshToken(user.id, refreshToken);

        //TODO: send verification emai (we'll add email service later)
        logger.info('User registered successfully', { userId: user.id, email: user.email });

        return {
            success: true,
            user: sanitizeUser(user),
            token: accessToken,
            refreshToken,
            message: 'Registration successful. Please verify your email.',
        };
    } catch (error) {
        logger.error('Registration failed', { error, email: data.email });
        throw error;
    }
}