#!/bin/bash
cd "$(dirname "$0")"
source ~/.nvm/nvm.sh
nvm use 20
node dist/scheduler/scrape.cron.js
