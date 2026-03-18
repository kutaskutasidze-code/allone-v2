#!/bin/bash

# Deploy script for Allone Scraper
# Usage: ./scripts/deploy.sh <VPS_IP> [SSH_KEY_PATH]

set -e

VPS_IP=$1
SSH_KEY=${2:-"~/.ssh/id_rsa"}

if [ -z "$VPS_IP" ]; then
    echo "Usage: ./scripts/deploy.sh <VPS_IP> [SSH_KEY_PATH]"
    echo "Example: ./scripts/deploy.sh 123.45.67.89 ~/Downloads/ssh-key.key"
    exit 1
fi

echo "Deploying Allone Scraper to $VPS_IP..."

# Create deployment package (exclude node_modules, .env, etc.)
echo "Creating deployment package..."
cd "$(dirname "$0")/.."
tar --exclude='node_modules' \
    --exclude='.env' \
    --exclude='dist' \
    --exclude='logs' \
    --exclude='.git' \
    -czf /tmp/scraper-deploy.tar.gz .

# Upload to VPS
echo "Uploading to VPS..."
scp -i "$SSH_KEY" /tmp/scraper-deploy.tar.gz ubuntu@$VPS_IP:~/

# Install on VPS
echo "Installing on VPS..."
ssh -i "$SSH_KEY" ubuntu@$VPS_IP << 'ENDSSH'
    # Create project directory
    mkdir -p ~/projects/allone-scraper
    cd ~/projects/allone-scraper

    # Extract files
    tar -xzf ~/scraper-deploy.tar.gz
    rm ~/scraper-deploy.tar.gz

    # Install dependencies
    npm install

    # Build
    npm run build

    # Create logs directory
    mkdir -p logs

    echo ""
    echo "Deployment complete!"
    echo ""
    echo "Next steps:"
    echo "1. Create .env file: cd ~/projects/allone-scraper && cp .env.example .env && nano .env"
    echo "2. Add your API keys to .env"
    echo "3. Test: npm run scrape"
    echo "4. Start PM2: pm2 start dist/index.js --name allone-scraper && pm2 save"
ENDSSH

# Cleanup
rm /tmp/scraper-deploy.tar.gz

echo ""
echo "Deployment complete!"
echo "SSH to your VPS: ssh -i $SSH_KEY ubuntu@$VPS_IP"
