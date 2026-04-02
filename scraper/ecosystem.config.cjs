module.exports = {
  apps: [
    {
      name: 'scrape-google-places',
      script: 'dist/scheduler/scrape.cron.js',
      cron_restart: '0 */4 * * *', // every 4 hours
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
