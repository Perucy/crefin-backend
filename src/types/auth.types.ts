/**
 * Authentication Types
 * Defines all data structures for auth operations
 */

import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
    id: string;
    email: string;
    password: string; // hashed password
    name: string;
    phone: string | null;
    profession: string | null;
    skills: string[];
    hourlyRate: Decimal | null;
    profilePicture: string | null;
    isPremium: boolean;
    isEmailVerified: boolean;
    emailVerificationToken: string | null;
    emailVerificationExpires: Date | null;
    passwordResetToken: string | null;
    passwordResetExpires: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

//user without sensitive data (for responses)
export interface SafeUser {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    profilePicture: string | null;
    isPremium: boolean;
    isEmailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
}

// ============================================================================
// REGISTRATION TYPES
// ============================================================================

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone: string | null;
}

export interface RegisterResponse {
    user: SafeUser;
    token: string;
    refreshToken: string;
    message: string;
}

// ============================================================================
// LOGIN TYPES
// ============================================================================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: SafeUser;
    token: string;
    refreshToken: string;
    message: string;
}

// ============================================================================
// EMAIL VERIFICATION TYPES
// ============================================================================
export interface VerifyEmailRequest {
    token: string;
}

export interface VerifyEmailResponse {
    message: string;
    user: SafeUser;
}

export interface ResendVerificationRequest {
    email: string;
}

// ============================================================================
// PASSWORD RESET TYPES
// ============================================================================

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// ============================================================================
// TOKEN TYPES
// ============================================================================

export interface TokenPayload {
    userId: string;
    email: string;
    isPremium: boolean;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface Session {
    userId: string;
    token: string;
    refreshToken: string;
    createdAt: Date;
    expiresAt: Date;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type AuthProvider = 'local' | 'google' | 'apple';

export interface AuthResult {
    success: boolean;
    user?: SafeUser;
    token?: string;
    refreshToken?: string;
    message: string;
    error?: string;
}