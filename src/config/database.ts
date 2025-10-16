/*PostgreQL database config (prisma orm) - manages database connection lifecycle */
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from './environment';

// ============================================================================
// PRISMA CLIENT SETUP
// ============================================================================

/**
 * Create Prisma client with environment-specific logging
 * 
 * Development: Log all queries (helpful for debugging)
 * Production: Only log errors (reduce noise)
 */
const prisma = new PrismaClient({
    log: config.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error'] : ['error'],
});
// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================
class DatabaseConnection {
    private isConnected: boolean = false;
    /*connect to database*/
    async connect(): Promise<void> {
        try {
            await prisma.$connect();
            this.isConnected = true;

            logger.info('✅ Database Connected', {
                database: this.getDatabaseName(),
            });
        } catch (error) {
            logger.error('❌ Failed to connect to database:', error);
            throw error;
        }
    }
    /**disconnect from database */
    async disconnect(): Promise<void> {
        try {
            await prisma.$disconnect();
            this.isConnected = false;
            logger.info('🔌Database disconnected');
        } catch (error) {
            logger.error('❌ Error disconnecting from database:', error);
            throw error;
        }
    }
    /**connection health */
    isHealthy(): boolean {
        return this.isConnected;
    }
    /** extract db name from connection string */
    private getDatabaseName(): string {
        try {
            const url = new URL(config.DATABASE_URL);
            return url.pathname.slice(1);
        } catch {
            return 'unknown';
        }
    }
}
// ============================================================================
// EXPORTS
// ============================================================================

// Main Prisma client - use this for all database queries
export const db = prisma;

// Connection manager - used in server.ts
export const connectDatabase = new DatabaseConnection();