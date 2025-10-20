/**
 * User Routes
 * Defines user profile API endpoints
 */
import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { z } from 'zod';
import { getProfile } from '@services/user.service';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    profession: z.string().optional(),
    skills: z.array(z.string()).optional(),
    hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one upper case letter')
        .regex(/[a-z]/, 'Password must contain at least one lower case letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

const deleteAccountSchema = z.object({
    password: z.string().min(1, 'Password is required'),
    confirmation: z.string().refine((val) => val === 'DELETE', {
        message: 'Please type DELETE to confirm',
    }),
});

// ============================================================================
// PROTECTED ROUTES (All require authentication)
// ============================================================================
/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile)

/**
 * @route   PATCH /api/v1/users/profile
 * @desc    update current user profile
 * @access  Private
 */
router.patch('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile)

/**
 * @route  PATCH /api/v1/users/password
 * @desc   change current password
 * @access Private
 */
router.patch('/password', authenticate, validate(changePasswordSchema), userController.changePassword)

/**
 * @route   DELETE /api/v1/users/profile
 * @desc    delete user account
 * @access  Private
 */
router.delete('/profile', authenticate, validate(deleteAccountSchema), userController.deleteAccount)

export default router;