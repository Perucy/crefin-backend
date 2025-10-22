/**
 * User Service
 * Business logic for user profile operations
 */
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { redis } from '../config/redis';
import {
    UpdateProfileRequest,
    UpdateProfileResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    DeleteAccountRequest,
    DeleteAccountResponse,
} from '../types/user.types';
import { SafeUser } from '../types/auth.types';
import {
    NotFoundError,
    AuthenticationError,
    ValidationError,
} from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Remove sensitive data from user object
 */
const sanitizeUser = (user: any): SafeUser => {
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = user;
    return safeUser as SafeUser;
};

// ============================================================================
// GET PROFILE
// ============================================================================
export const getProfile = async (userId: string): Promise<SafeUser> => {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        logger.info('User profile retrieved', { userId });

        return sanitizeUser(user);
    } catch (error) {
        logger.error('Failed to get profile', { error, userId });
        throw error;
    }
};

// ============================================================================
// UPDATE PROFILE
// ============================================================================
export const updateProfile = async (
    userId: string, 
    data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
    try {
        //build update data object
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.profession !== undefined) updateData.profession = data.profession;
        if (data.skills !== undefined) updateData.skills = data.skills;
        if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;

        const user = await db.user.update({
            where: { id: userId },
            data: updateData,
        });

        logger.info('User profile updated', { userId, fields: Object.keys(updateData) });

        return {
            user: sanitizeUser(user),
            message: 'Profile updated successfully',
        };
    } catch (error) {
        logger.error('Failed to update profile', { error, userId });
        throw error;
    }
};

// ============================================================================
// CHANGE PASSWORD
// ============================================================================
export const changePassword = async (
    userId: string,
    data: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        //verify current password
        const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);

        if (!isPasswordValid) {
            throw new AuthenticationError('Current password is incorrect');
        }

        //hash new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 12);

        //update password
        await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        //invalidate all refresh tokens to force re-login on all devices
        await redis.del(`refresh_token:${userId}`);

        logger.info('Password changed successfully', { userId });

        return {
            message: 'Password changed successfully. Please login again.',
        };
    } catch (error) {
        logger.error('Failed to change password', { error, userId });
        throw error;
    }
};

// ============================================================================
// DELETE ACCOUNT
// ============================================================================
export const deleteAccount = async (
    userId: string,
    data: DeleteAccountRequest
): Promise<DeleteAccountResponse> => {
    try {
        //verify confirmation text
        if (data.confirmation !== 'DELETE') {
            throw new ValidationError('Please type DELETE to confirm account deletion');
        }

        //get user with password
        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        //verify password
        const isPasswordValid = bcrypt.compare(data.password,user.password);

        if (!isPasswordValid) {
            throw new AuthenticationError('Password is incorrect');
        }

        //delete user (cascades to related records due to Prisma schema)
        await db.user.delete({
            where: { id: userId },
        });

        //delete refresh tokens
        await redis.del(`refresh_token:${userId}`);

        logger.info('Account deleted', { userId, email: user.email });

        return {
            message: 'Account deleted successfully',
        }

    } catch (error) {
        logger.error('Failed to delete account', { error, userId });
        throw error;
    }
};