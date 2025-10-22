/**
 * Express Application Setup
 * Configures Express with middleware and routes
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, corsOrigins } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import incomeRoutes from './routes/income.routes';
import expenseRoutes from './routes/expense.routes';

// ============================================================================
// CREATE EXPRESS APP
// ============================================================================

const app: Application = express();

const API_PREFIX = `/api/${config.API_VERSION}`;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================
// Helmet - sets security HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
//CORS - allow  flutter frontend to call this API
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ============================================================================
// BODY PARSING
// ============================================================================

//parse JSON body (max 10mb)
app.use(express.json({ limit: '10mb' }));

//parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// REQUEST LOGGING
// ============================================================================
// log all requests (except health checks)
app.use((req: Request, res: Response, next) => {
    if (req.path !== '/health') {
        logger.info(`${req.method} ${req.path}`, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    }
    next();
})

// ============================================================================
// RATE LIMITING
// ============================================================================

// Apply to all API routes
app.use('/api', rateLimiter);

// ============================================================================
// HEALTH CHECK
// ============================================================================

// Simple endpoint to check if API is running
app.get(`${API_PREFIX}/health`, (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
    });
});

// API info
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'Crefin API',
        version: config.API_VERSION,
        environment: config.NODE_ENV,
        documentation: `${config.APP_URL}/api/${config.API_VERSION}/docs`,
    });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Auth routes
app.use(`${API_PREFIX}/auth`, authRoutes);

//user routes
app.use(`${API_PREFIX}/users`, userRoutes);

// Rate routes (future)
// app.use(`${API_PREFIX}/rates`, rateRoutes);

// Payment routes (future)
// app.use(`${API_PREFIX}/payments`, paymentRoutes);

// Income routes (future)
app.use(`${API_PREFIX}/income`, incomeRoutes);

// Expense routes (future)
app.use(`${API_PREFIX}/expenses`, expenseRoutes);

// AI auditor routes (future)
// app.use(`${API_PREFIX}/auditor`, auditorRoutes);

// ============================================================================
// 404 HANDLER
// ============================================================================

// Catch undefined routes
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Cannot ${req.method} ${req.path}`,
        availableRoutes: [
            `${API_PREFIX}/auth`,
            // Add more as you build them
        ],
        },
    });
});

// ============================================================================
// GLOBAL ERROR HANDLER (Must be last!)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// EXPORT
// ============================================================================

export default app;

// ============================================================================
// MIDDLEWARE ORDER (IMPORTANT!)
// ============================================================================