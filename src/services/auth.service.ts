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

// ============================================================================
// LOGIN
// ============================================================================

export const login = async (data: LoginRequest): Promise<AuthResult> => {
    try {
        //find user
        const user = await db.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (!user) {
            throw new AuthenticationError('Invalid email or password');
        }

        //verify password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid email or password');
        }

        //update lastlogin
        await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        //generate tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            isPremium: user.isPremium,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        //store refresh token
        await storeRefreshToken(user.id, refreshToken);

        logger.info('User logged in successfully', { userId: user.id });

        return {
            success: true,
            user: sanitizeUser(user),
            token: accessToken,
            refreshToken,
            message: 'Login successful',
        }

    } catch (error) {
        logger.error('Login failed', { error, email: data.email });
        throw error;
    }
};

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

export const verifyEmail = async (token: string): Promise<AuthResult> => {
    try {
        //find user with valid token
        const user = await db.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: {
                    gt: new Date(), //token not expired
                },
            },
        });

        if (!user) {
            throw new ValidationError('Invalid or expired verification token');
        }

        //update user 
        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
            },
        });

        logger.info('Email verified successfully', { userId: user.id });

        return {
            success: true,
            user: sanitizeUser(updatedUser),
            message: 'Email verified successfully',
        };
    } catch (error) {
        logger.error('Email verification failed', { error });
        throw error;
    }
}

// ============================================================================
// RESEND VERIFICATION EMAIL
// ============================================================================

export const resendVerificationEmail = async (email: string): Promise<{ message:string }> => {
    try {
        const user = await db.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            throw new NotFoundError('User not Found');
        }

        if (user.isEmailVerified) {
            throw new ValidationError('Email already verified');
        }

        //generate new token
        const emailVerificationToken = generateRandomToken();
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken,
                emailVerificationExpires,
            },
        });

        //TODO: Send verification email
        logger.info('Verification email resent', { userId: user.id });

        return {
            message: 'Verification email sent',
        };
    } catch (error) {
        logger.error('Failed to resend verification email', { error, email });
        throw error;
    }
};

// ============================================================================
// FORGOT PASSWORD
// ============================================================================

export const forgotPassword = async (email: string): Promise<{ message: string}> => {
    try {
        const user = await db.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return {
                message: 'If the email exists, a password reset link has been sent',
            }
        }

        //generate reset token
        const passwordResetToken = generateRandomToken();
        const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

        await db.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken,
                passwordResetExpires,
            },
        });

        //TODO: Send password reset email
        logger.info('Password reset requested', { userId: user.id });

        return {
            message: 'If the email exists, a password reset link has been sent',
        };
    } catch (error) {
        logger.error('Forgot password failed', { error, email });
        throw error;
    }
};

// ============================================================================
// RESET PASSWORD
// ============================================================================

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
    try {
        // Find user with valid token
        const user = await db.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new ValidationError('Invalid or expired reset token');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and clear reset token
        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });

        // Invalidate all refresh tokens
        await redis.del(`refresh_token:${user.id}`);

        logger.info('Password reset successfully', { userId: user.id });

        return {
            message: 'Password reset successful',
        };
    } catch (error) {
        logger.error('Password reset failed', { error });
        throw error;
    }
};

// ============================================================================
// REFRESH TOKEN
// ============================================================================

export const refreshAccessToken = async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as TokenPayload;

        // Check if refresh token exists in Redis
        const isValid = await verifyRefreshToken(decoded.userId, refreshToken);

        if (!isValid) {
            throw new AuthenticationError('Invalid refresh token');
        }

        // Get latest user data
        const user = await db.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Generate new tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            isPremium: user.isPremium,
        };

        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        // Store new refresh token
        await storeRefreshToken(user.id, newRefreshToken);

        logger.info('Token refreshed', { userId: user.id });

        return {
            token: newAccessToken,
            refreshToken: newRefreshToken,
        };
    } catch (error) {
        logger.error('Token refresh failed', { error });
        throw new AuthenticationError('Invalid refresh token');
    }
};

// ============================================================================
// LOGOUT
// ============================================================================

export const logout = async (userId: string): Promise<{ message: string }> => {
    try {
        // Delete refresh token from Redis
        await redis.del(`refresh_token:${userId}`);

        logger.info('User logged out', { userId });

        return {
            message: 'Logout successful',
        };
    } catch (error) {
        logger.error('Logout failed', { error, userId });
        throw error;
    }
};