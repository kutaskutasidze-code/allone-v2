/**
 * Simple structured logger for API routes
 * Outputs JSON for easy parsing by log aggregators
 *
 * In production, this could be extended to send to:
 * - Vercel Logs
 * - DataDog
 * - Sentry
 * - CloudWatch
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ip?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Format and output a log entry
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && Object.keys(context).length > 0 && { context }),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(output);
      }
      break;
    case 'info':
      console.info(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
      console.error(output);
      break;
  }
}

export const logger = {
  /**
   * Debug level - only in development
   */
  debug: (message: string, context?: LogContext) => log('debug', message, context),

  /**
   * Info level - general information
   */
  info: (message: string, context?: LogContext) => log('info', message, context),

  /**
   * Warn level - potential issues
   */
  warn: (message: string, context?: LogContext) => log('warn', message, context),

  /**
   * Error level - errors and failures
   */
  error: (message: string, context?: LogContext) => log('error', message, context),

  /**
   * Log an API request
   */
  request: (
    method: string,
    path: string,
    context?: LogContext
  ) => {
    log('info', `${method} ${path}`, { action: 'request', ...context });
  },

  /**
   * Log a database operation
   */
  db: (
    operation: 'select' | 'insert' | 'update' | 'delete',
    table: string,
    context?: LogContext
  ) => {
    log('debug', `DB ${operation.toUpperCase()} on ${table}`, {
      action: 'database',
      resource: table,
      ...context
    });
  },

  /**
   * Log an admin action for audit trail
   */
  audit: (
    action: string,
    resource: string,
    resourceId: string | undefined,
    userId: string,
    details?: Record<string, unknown>
  ) => {
    log('info', `Admin action: ${action}`, {
      action,
      resource,
      resourceId,
      userId,
      ...details,
    });
  },
};
