import { logger } from './utils/logger.js';
import { config } from './config.js';

logger.info('Starting Allone Scraper...');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Log level: ${config.logLevel}`);

// Validate configuration
if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  logger.error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

logger.info('Configuration validated');
logger.info('Scraper ready. Use npm run scrape or npm run email to run jobs.');

// Keep process running if needed (for PM2)
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  process.exit(0);
});
