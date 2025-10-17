/**
 * Server Entry Point
 * Starts Express server and handles connections
 */
import app from './app';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handles graceful shutdown on SIGTERM/SIGINT
 * Ensures:
 * - Active requests complete
 * - Database connections close properly
 * - No data corruption
 */
async function gracefulShutdown(signal: string) {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    // Give active requests 10 seconds to complete
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
    
    try {
        // Close database connections
        await connectDatabase.disconnect();
        logger.info('Database connections closed');
        
        // Close Redis connection
        await connectRedis.disconnect();
        logger.info('Redis connection closed');
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// ERROR HANDLERS
// ============================================================================

// Handle uncaught exceptions (synchronous errors)
process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

// Handle unhandled promise rejections (async errors)
process.on('unhandledRejection', (reason: any) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
        reason,
    });
    process.exit(1);
});

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // 1. Connect to PostgreSQL
    logger.info('Connecting to PostgreSQL...');
    await connectDatabase.connect();
    
    // 2. Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis.connect();
    
    // 3. Start Express server
    const server = app.listen(config.PORT, () => {
        logger.info('╔════════════════════════════════════════╗');
        logger.info('║     Crefin API Server Started          ║');
        logger.info('╚════════════════════════════════════════╝');
        logger.info(`Environment: ${config.NODE_ENV}`);
        logger.info(`Port: ${config.PORT}`);
        logger.info(`URL: ${config.APP_URL}`);
        logger.info(`API: ${config.APP_URL}/api/${config.API_VERSION}`);
        logger.info('');
        logger.info('Press CTRL+C to stop');
    });
    
    // Set keepalive timeout (important for load balancers)
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000;   // Slightly higher than keepalive
    
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// ============================================================================
// RUN
// ============================================================================

startServer();