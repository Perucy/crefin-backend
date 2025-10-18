/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import {
    RegisterRequest,
    LoginRequest,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
} from '../types/auth.types';
import { sendSuccess, sendError } from '../utils/response';

// ============================================================================
// REGISTER
// ============================================================================

export const register = async (
    req: Request, res: Response, next: NextFunction): Promise<void> => {
    
        try {
            const data: RegisterRequest = req.body;
            const result = await authService.register(data);
            sendSuccess(res, result, result.message, 201);
        } catch (error) {
            next(error);
        }

}

// ============================================================================
// LOGIN
// ============================================================================

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data: LoginRequest = req.body;

        const result = await authService.login(data);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// VERIFY EMAIL
// ============================================================================

export const verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { token }: VerifyEmailRequest = req.body;

        const result = await authService.verifyEmail(token);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// RESEND VERIFICATION EMAIL
// ============================================================================

export const resendVerificationEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email } = req.body;

        const result = await authService.resendVerificationEmail(email);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// FORGOT PASSWORD
// ============================================================================

export const forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email }: ForgotPasswordRequest = req.body;

        const result = await authService.forgotPassword(email);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// RESET PASSWORD
// ============================================================================

export const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { token, newPassword }: ResetPasswordRequest = req.body;

        const result = await authService.resetPassword(token, newPassword);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// REFRESH TOKEN
// ============================================================================

export const refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { refreshToken }: RefreshTokenRequest = req.body;

        const result = await authService.refreshAccessToken(refreshToken);

        sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// LOGOUT
// ============================================================================

export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get user ID from authenticated request
        const userId = (req as any).user?.id;

        if (!userId) {
            return sendError(res, 'User not authenticated', 401);
        }

        const result = await authService.logout(userId);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET CURRENT USER
// ============================================================================

export const getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = (req as any).user;

        if (!user) {
            return sendError(res, 'User not authenticated', 401);
        }

        sendSuccess(res, { user }, 'User retrieved successfully');
    } catch (error) {
        next(error);
    }
};