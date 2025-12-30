/*reads .env and validates the required variables*/
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    API_VERSION: z.string().default('v1'),
    APP_URL: z.string().url(),
    CLIENT_URL: z.string().url(),

    //database
    DATABASE_URL : z.string().min(1, 'DATABASE_URL is required'),

    //redis
    REDIS_URL: z.string().default('redis://localhost:6379'),
    REDIS_TTL: z.coerce.number().default(900),

    // JWT - Must be 32+ characters for security
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes in milliseconds
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
    RATE_LIMIT_PREMIUM_MAX: z.coerce.number().default(1000),
    
    // ML Service
    ML_API_URL: z.string().default('http://localhost:8000'),

    // Security
    CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
    BCRYPT_ROUNDS: z.coerce.number().default(10),
    
    // Feature Flags
    ENABLE_AI_FEATURES: z.string().default('false').transform(val => val === 'true'),
    ENABLE_PAYMENTS: z.string().default('false').transform(val => val === 'true'),
    
    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

let config: z.infer<typeof envSchema>;

try {
    config = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error('❌ Invalid environment variables');
        error.issues.forEach(err => {
            console.error(` - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
    }
    console.error('Environment validation error:', error);
    process.exit(1);
}
// ============================================================================
// EXPORT TYPED CONFIG
// ============================================================================
export { config };

//helper booleans
export const isProd = config.NODE_ENV === 'production';
export const isDev = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';

//parse CORS origins from comma-separated string to array
export const corsOrigins = config.CORS_ORIGINS.split(',').map(origin => origin.trim());
