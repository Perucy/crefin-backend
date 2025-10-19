/**
 * User Controller
 * Handles HTTP requests for user profile operations
 */

import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import {
    UpdateProfileRequest,
    ChangePasswordRequest,
    DeleteAccountRequest,
} from '../types/user.types';
import { sendSuccess } from '../utils/response';

// ============================================================================
// GET PROFILE
// ============================================================================
export const getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const user = await userService.getProfile(userId);

        sendSuccess(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// UPDATE PROFILE
// ============================================================================
export const updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const data: UpdateProfileRequest = req.body;

        const result = await userService.updateProfile(userId, data);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
}
// ============================================================================
// CHANGE PASSWORD
// ============================================================================

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const data: ChangePasswordRequest = req.body;

        const result = await userService.changePassword(userId, data);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// DELETE ACCOUNT
// ============================================================================

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const data: DeleteAccountRequest = req.body;

        const result = await userService.deleteAccount(userId, data);

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};