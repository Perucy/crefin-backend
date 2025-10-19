/**
 * User Types
 * Defines data structures for user operations
 */

import { Decimal } from '@prisma/client/runtime/library';
import { SafeUser } from './auth.types';

// ============================================================================
// UPDATE PROFILE
// ============================================================================
export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
    profession?: string;
    skills?: string[];
    hourlyRate?: Decimal;
}

export interface UpdateProfileResponse {
    user: SafeUser;
    message: string;
}

// ============================================================================
// CHANGE PASSWORD
// ============================================================================
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    message: string;
}

// ============================================================================
// DELETE ACCOUNT
// ============================================================================
export interface DeleteAccountRequest {
    password: string;
    confirmation: string;  //must type 'DELETE' to confirm
}

export interface DeleteAccountResponse {
    message: string;
}