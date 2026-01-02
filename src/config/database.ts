/*PostgreQL database config (prisma orm) - manages database connection lifecycle */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../utils/logger';
import { config } from './environment';

// ============================================================================
// POSTGRESQL CONNECTION POOL
// ============================================================================

/**
 * Create PostgreSQL connection pool
 * Prisma 7 requires this for database connectivity
 */
const pool = new Pool({
    connectionString: config.DATABASE_URL,
    
    // Connection pool configuration (production-ready)
    max: 20,                    // Maximum connections
    min: 2,                     // Minimum connections to keep
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Timeout if can't connect in 5s
    
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

// Handle pool errors (prevents app crash)
pool.on('error', (err: any) => {
    logger.error('Unexpected database pool error', { error: err });
});

// ============================================================================
// PRISMA CLIENT SETUP
// ============================================================================

/**
 * Create Prisma adapter for PostgreSQL
 * Required in Prisma 7
 */
const adapter = new PrismaPg(pool);

/**
 * Create Prisma client with environment-specific logging
 * 
 * Development: Log all queries (helpful for debugging)
 * Production: Only log errors (reduce noise)
 */
const prisma = new PrismaClient({
    adapter, // ← REQUIRED in Prisma 7!
    log: config.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
});

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

class DatabaseConnection {
    private isConnected: boolean = false;

    /**
     * Connect to database
     */
    async connect(): Promise<void> {
        try {
            await prisma.$connect();
            
            // Test query to verify connection
            await prisma.$queryRaw`SELECT 1`;
            
            this.isConnected = true;

            logger.info('✅ Database Connected', {
                database: this.getDatabaseName(),
                poolSize: pool.totalCount,
                idleConnections: pool.idleCount,
            });
        } catch (error) {
            logger.error('❌ Failed to connect to database:', error);
            throw error;
        }
    }

    /**
     * Disconnect from database
     */
    async disconnect(): Promise<void> {
        try {
            await prisma.$disconnect();
            await pool.end(); // ← Also close the pool!
            this.isConnected = false;
            logger.info('🔌 Database disconnected');
        } catch (error) {
            logger.error('❌ Error disconnecting from database:', error);
            throw error;
        }
    }

    /**
     * Check connection health
     */
    isHealthy(): boolean {
        return this.isConnected;
    }

    /**
     * Health check - verify database is responsive
     */
    async checkHealth(): Promise<boolean> {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            logger.error('Database health check failed', { error });
            return false;
        }
    }

    /**
     * Get current pool statistics
     */
    getPoolStats() {
        return {
            totalConnections: pool.totalCount,
            idleConnections: pool.idleCount,
            waitingClients: pool.waitingCount,
        };
    }

    /**
     * Extract db name from connection string
     */
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