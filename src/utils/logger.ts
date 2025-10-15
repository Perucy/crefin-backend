/*structured logger with winston*/
import winston from 'winston';
import { config } from '../config/environment';

// ============================================================================
// LOG FORMAT
// ============================================================================

// Development format (colorful, readable)
const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    // Add extra data if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Production format (JSON) 
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
)

// ============================================================================
// CREATE LOGGER
// ============================================================================
export const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: config.NODE_ENV === 'development' ? devFormat : prodFormat,
    defaultMeta: {
        service: 'crefin-api',
        environnment: config.NODE_ENV,
    },
    transports: [
        //always log to console
        new winston.transports.Console(),

        //in production, log to files
        ...(config.NODE_ENV === 'production' 
            ? [
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
            ]
        : []),
    ],
});