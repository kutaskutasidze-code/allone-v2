module.exports = {
  apps: [
    {
      name: 'scrape-google-places',
      script: 'dist/scheduler/scrape.cron.js',
      cron_restart: '0 */4 * * *',
      autorestart: false,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'enrich-phones',
      script: 'dist/scheduler/enrich.cron.js',
      cron_restart: '30 */6 * * *',
      autorestart: false,
      env: { NODE_ENV: 'production' },
    },
  ],
};
