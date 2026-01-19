#!/bin/bash
# Run LinkedIn bot daily from your laptop
# Add to crontab: 0 10,16 * * * /path/to/linkedin-bot/run-daily.sh

cd "$(dirname "$0")"

echo "$(date): Starting LinkedIn bot..."

# Run the automation
pnpm dev auto --no-invite 2>&1 | tee -a linkedin-bot.log

echo "$(date): LinkedIn bot finished"
