# Deploying to Hetzner VPS

Complete guide to deploy the Allone Scraper on a Hetzner Cloud VPS.

## Cost: ~€4/month

- Hetzner CX11: €3.79/month (1 vCPU, 2GB RAM, 20GB SSD)
- Domain (optional): ~$10/year

## Step 1: Create VPS on Hetzner

1. Go to https://console.hetzner.cloud
2. Create a new project (e.g., "Allone")
3. Add a server:
   - Location: Choose closest to target regions (e.g., Nuremberg)
   - Image: **Ubuntu 22.04**
   - Type: **CX11** (€3.79/month)
   - Networking: IPv4 only is fine
   - SSH Keys: Add your SSH public key
   - Name: allone-scraper

4. Note the IP address after creation

## Step 2: Initial Server Setup

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser allone
usermod -aG sudo allone

# Set up SSH for new user
mkdir -p /home/allone/.ssh
cp ~/.ssh/authorized_keys /home/allone/.ssh/
chown -R allone:allone /home/allone/.ssh
chmod 700 /home/allone/.ssh
chmod 600 /home/allone/.ssh/authorized_keys

# Switch to allone user
su - allone
```

## Step 3: Install Dependencies

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v20.x
npm --version

# Install Chromium for Puppeteer
sudo apt install -y chromium-browser libgbm1 libnss3 libatk-bridge2.0-0 libxkbcommon0 libgtk-3-0 libglib2.0-0 libasound2

# Install PM2 globally
sudo npm install -g pm2

# Install git
sudo apt install -y git
```

## Step 4: Clone and Setup Project

```bash
# Clone the repository (or upload via SCP)
git clone https://github.com/YOUR_REPO/allone-website.git
cd allone-website/scraper

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env

# Fill in your credentials:
# SUPABASE_URL=https://cywmdjldapzrnabsoosd.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_key
# RESEND_API_KEY=re_xxxxx
# GROQ_API_KEY=gsk_xxxxx

# Create logs directory
mkdir -p logs

# Build TypeScript
npm run build
```

## Step 5: Run Database Migration

Before running the scraper, ensure the database tables exist:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd/sql
2. Copy the contents of `supabase/migrations/20250117_lead_generation.sql`
3. Paste and run in SQL Editor

## Step 6: Test the Scraper

```bash
# Test scrape (runs once)
npm run scrape

# Test email (runs once)
npm run email

# Check logs
cat logs/combined.log
```

## Step 7: Set Up PM2 for Process Management

```bash
# Start the scraper service
pm2 start dist/index.js --name allone-scraper

# Save PM2 config
pm2 save

# Set up auto-start on reboot
pm2 startup
# Run the command it outputs with sudo

# View status
pm2 status
pm2 logs allone-scraper
```

## Step 8: Set Up Cron Jobs

```bash
# Edit crontab
crontab -e

# Add these lines:

# Run scraper daily at 3 AM UTC
0 3 * * * cd /home/allone/allone-website/scraper && /usr/bin/node dist/scheduler/scrape.cron.js >> /home/allone/logs/scrape.log 2>&1

# Run email sender hourly between 9 AM and 6 PM UTC
0 9-18 * * * cd /home/allone/allone-website/scraper && /usr/bin/node dist/scheduler/email.cron.js >> /home/allone/logs/email.log 2>&1

# Save and exit
```

## Step 9: Set Up Resend (Email Service)

1. Go to https://resend.com and create account
2. Verify your domain (allone.ge):
   - Add DNS records as instructed
   - Wait for verification
3. Get API key from Dashboard
4. Update `.env` with the API key

### Domain Verification

Add these DNS records to your domain:

| Type | Name | Value |
|------|------|-------|
| TXT | resend._domainkey | (from Resend dashboard) |
| MX | send | feedback-smtp.region.amazonses.com |

## Step 10: Monitoring

### View Logs

```bash
# Scraper logs
tail -f /home/allone/logs/scrape.log

# Email logs
tail -f /home/allone/logs/email.log

# PM2 logs
pm2 logs allone-scraper
```

### Check Process Status

```bash
pm2 status
pm2 monit  # Interactive monitoring
```

### Restart Services

```bash
pm2 restart allone-scraper
pm2 reload allone-scraper  # Zero-downtime reload
```

## Firewall Setup (Optional)

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

## Updating the Code

```bash
cd /home/allone/allone-website

# Pull latest changes
git pull

# Rebuild
cd scraper
npm install
npm run build

# Restart PM2
pm2 restart allone-scraper
```

## Troubleshooting

### Puppeteer fails to launch

```bash
# Install missing dependencies
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### Out of memory

The CX11 has 2GB RAM. If running out:

```bash
# Create swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Cron jobs not running

```bash
# Check cron service
sudo systemctl status cron

# Check cron logs
grep CRON /var/log/syslog
```

## Security Notes

- Never commit `.env` files
- Use strong SSH keys (Ed25519 recommended)
- Regularly update system packages
- Monitor resource usage
- Keep logs rotated (logrotate)

## Contact

For issues, check logs first:
- PM2 logs: `pm2 logs`
- Cron logs: `/var/log/syslog`
- App logs: `/home/allone/logs/`
