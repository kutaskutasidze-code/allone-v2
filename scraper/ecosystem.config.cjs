module.exports = {
  apps: [
    {
      name: 'registry-scraper',
      script: 'dist/scheduler/registry.cron.js',
      cron_restart: '0 6 * * *', // daily at 6 AM UTC
      autorestart: false,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'enrich-phones',
      script: 'dist/scheduler/enrich.cron.js',
      cron_restart: '30 */6 * * *', // every 6 hours, offset by 30min
      autorestart: false,
      env: { NODE_ENV: 'production' },
    },
  ],
};
