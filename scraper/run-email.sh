#!/bin/bash
cd "$(dirname "$0")"
source ~/.nvm/nvm.sh
nvm use 20
node dist/scheduler/email.cron.js
