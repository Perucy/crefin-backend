/**
 * Custom Error Classes
 * Provides consistent error handling with HTTP status codes
 */

// ============================================================================
// BASE API ERROR
// ============================================================================

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
        Error.captureStackTrace(this, this.constructor);
    }
}

// ============================================================================
// SPECIFIC ERROR TYPES
// ============================================================================

// 400 Bad Request - Invalid input from client
export class BadRequestError extends ApiError {
    constructor(message: string, details?: any) {
        super(400, message, 'BAD_REQUEST', details);
        this.name = 'BadRequestError';
    }
}

// 400 Validation Error - Specific type for validation failures
export class ValidationError extends ApiError {
    constructor(message: string, details?: any) {
        super(400, message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

// 401 Unauthorized - Not authenticated (no token or invalid token)
export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Authentication required') {
        super(401, message, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}

// 401 Authentication Error - Specific type for failed login/auth
export class AuthenticationError extends ApiError {
    constructor(message: string = 'Authentication failed') {
        super(401, message, 'AUTHENTICATION_FAILED');
        this.name = 'AuthenticationError';
    }
}

// 403 Forbidden - Authenticated but no permission
export class ForbiddenError extends ApiError {
    constructor(message: string = 'Insufficient permissions') {
        super(403, message, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}

// 404 Not Found - Resource doesn't exist
export class NotFoundError extends ApiError {
    constructor(resource: string = 'Resource') {
        super(404, `${resource} not found`, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

// 409 Conflict - Resource already exists (e.g., email already registered)
export class ConflictError extends ApiError {
    constructor(message: string) {
        super(409, message, 'CONFLICT');
        this.name = 'ConflictError';
    }
}

// 429 Too Many Requests - Rate limit exceeded
export class RateLimitError extends ApiError {
    constructor(message: string = 'Too many requests') {
        super(429, message, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}

// 500 Internal Server Error - Something went wrong on server
export class InternalError extends ApiError {
    constructor(message: string = 'Internal server error') {
        super(500, message, 'INTERNAL_ERROR');
        this.name = 'InternalError';
    }
}