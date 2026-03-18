# Deploying to Oracle Cloud Free Tier (Always Free)

Complete guide to deploy the Allone Scraper on Oracle Cloud's **Always Free** VPS.

## Cost: FREE (Forever)

Oracle Cloud Free Tier includes:
- **2 AMD VMs** with 1GB RAM each, OR
- **ARM VMs** with up to 24GB RAM total (4 OCPUs)
- 50GB boot volume per VM
- 10TB outbound data transfer/month
- No credit card charge (card only for verification)

## Step 1: Create Oracle Cloud Account

1. Go to https://signup.oraclecloud.com/
2. Sign up with email (use personal email, not company)
3. Choose your **Home Region** (closest to target countries):
   - For CIS/Europe targets: **Frankfurt** or **Amsterdam**
   - For Turkey: **Frankfurt**
4. Add credit card (for verification only - won't be charged)
5. Wait for account activation (can take a few hours)

## Step 2: Create a VM Instance

1. Go to Oracle Cloud Console: https://cloud.oracle.com
2. Click **Create a VM instance**
3. Configure:

   **Name:** `allone-scraper`

   **Placement:** Leave default

   **Image and shape:**
   - Click **Edit**
   - Image: **Ubuntu 22.04** (Canonical Ubuntu)
   - Shape: Click **Change shape**
     - For AMD (more stable): **VM.Standard.E2.1.Micro** (1 OCPU, 1GB RAM) - Always Free
     - For ARM (more power): **VM.Standard.A1.Flex** (1-4 OCPU, 6-24GB RAM) - Always Free
   - Recommended: Start with AMD Micro, upgrade to ARM if needed

   **Networking:**
   - Create new VCN (default settings)
   - Assign public IPv4 address: **Yes**

   **Add SSH keys:**
   - Generate a key pair: Click **Save Private Key** (download it!)
   - Or paste your existing public key

4. Click **Create**
5. Wait for instance to be **Running** (2-5 minutes)
6. Note the **Public IP Address**

## Step 3: Connect to Your VM

```bash
# Set permissions on the private key
chmod 400 ~/Downloads/ssh-key-*.key

# Connect (replace IP and key path)
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_PUBLIC_IP

# If you get "Permission denied", try:
ssh -i ~/Downloads/ssh-key-*.key opc@YOUR_PUBLIC_IP
```

## Step 4: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v20.x
npm --version

# Install Chromium dependencies for Puppeteer
sudo apt install -y \
  chromium-browser \
  libgbm1 \
  libnss3 \
  libatk-bridge2.0-0 \
  libxkbcommon0 \
  libgtk-3-0 \
  libglib2.0-0 \
  libasound2 \
  fonts-liberation \
  libappindicator3-1 \
  libu2f-udev \
  libvulkan1 \
  xdg-utils

# Install PM2 globally
sudo npm install -g pm2

# Install git
sudo apt install -y git
```

## Step 5: Open Firewall Ports (Oracle Cloud specific)

Oracle Cloud has **two firewalls**: the VCN Security List AND iptables on the VM.

### 5a. VCN Security List (Cloud Console)

1. Go to **Networking > Virtual Cloud Networks**
2. Click your VCN (e.g., `vcn-*`)
3. Click **Security Lists** > **Default Security List**
4. Click **Add Ingress Rules**
5. Add rule:
   - Source CIDR: `0.0.0.0/0`
   - Destination Port Range: `22`
   - Description: SSH
6. (Optional) Add more ports if you need web access later

### 5b. VM iptables (SSH into VM)

```bash
# Allow all traffic (simpler for this use case)
sudo iptables -F
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT

# Save rules
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

## Step 6: Clone and Setup Project

```bash
# Create project directory
mkdir -p ~/projects
cd ~/projects

# Option 1: Clone from GitHub (if you pushed it)
git clone https://github.com/YOUR_USERNAME/allone-website.git
cd allone-website/scraper

# Option 2: Upload via SCP from your local machine
# (Run this on your LOCAL machine, not the VM)
# scp -i ~/Downloads/ssh-key-*.key -r ./scraper ubuntu@YOUR_PUBLIC_IP:~/projects/

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env
```

### Configure .env file:

```env
# Supabase
SUPABASE_URL=https://cywmdjldapzrnabsoosd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5d21kamxkYXB6cm5hYnNvb3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2MDI0MCwiZXhwIjoyMDgyMTM2MjQwfQ.LkcaXgiD8p4bvWK89S4OKQffteUN4mmwwwWLJ-EQNPY

# Resend (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Groq (get from https://console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Optional
LOG_LEVEL=info
NODE_ENV=production
```

Save with Ctrl+O, exit with Ctrl+X.

## Step 7: Build and Test

```bash
# Create logs directory
mkdir -p logs

# Build TypeScript
npm run build

# Test scrape (runs once)
npm run scrape

# Check logs
cat logs/combined.log

# Test email (if you have leads and Resend configured)
npm run email
```

## Step 8: Set Up PM2 Process Manager

```bash
# Start the scraper service
pm2 start dist/index.js --name allone-scraper

# Save PM2 config
pm2 save

# Set up auto-start on reboot
pm2 startup
# Run the command it outputs (starts with sudo env...)

# View status
pm2 status
pm2 logs allone-scraper
```

## Step 9: Set Up Cron Jobs

```bash
# Edit crontab
crontab -e

# Add these lines:

# Run scraper daily at 3 AM UTC
0 3 * * * cd ~/projects/allone-website/scraper && /usr/bin/node dist/scheduler/scrape.cron.js >> ~/logs/scrape.log 2>&1

# Run email sender hourly between 9 AM and 6 PM UTC (business hours)
0 9-18 * * * cd ~/projects/allone-website/scraper && /usr/bin/node dist/scheduler/email.cron.js >> ~/logs/email.log 2>&1

# Create logs directory
mkdir -p ~/logs
```

Save and exit (Ctrl+X, then Y, then Enter).

## Step 10: Verify Cron Jobs

```bash
# Check cron service
sudo systemctl status cron

# List your cron jobs
crontab -l

# Test a cron job manually
cd ~/projects/allone-website/scraper && node dist/scheduler/scrape.cron.js
```

## Memory Optimization (Important for 1GB RAM)

If using the 1GB AMD VM, Puppeteer may run out of memory. Add swap:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

## Monitoring

```bash
# View PM2 status
pm2 status

# View PM2 logs
pm2 logs

# View scrape logs
tail -f ~/logs/scrape.log

# View email logs
tail -f ~/logs/email.log

# System resources
htop  # or: top
free -h
df -h
```

## Updating the Code

```bash
cd ~/projects/allone-website

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

### "Out of Capacity" Error When Creating VM

Oracle Free Tier VMs are limited. Try:
1. Different availability domain (AD-1, AD-2, AD-3)
2. Different region (change home region if new account)
3. Try again later (resources free up)

### Puppeteer Fails to Launch

```bash
# Install all Chrome dependencies
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

# Set Puppeteer to use system Chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### SSH Connection Refused

1. Check VCN Security List allows port 22
2. Check iptables on VM
3. Wait a few minutes after VM creation

### Account Verification Stuck

1. Use a personal email (not company)
2. Try different browser/incognito
3. Contact Oracle Support

## Security Notes

- Never commit `.env` files to git
- Use SSH keys, not passwords
- Keep system updated: `sudo apt update && sudo apt upgrade -y`
- Monitor resource usage to avoid account issues

## Quick Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | Check scraper status |
| `pm2 logs` | View live logs |
| `pm2 restart allone-scraper` | Restart after updates |
| `crontab -l` | List cron jobs |
| `free -h` | Check memory |
| `df -h` | Check disk space |

## Sources

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Oracle Cloud Signup](https://signup.oraclecloud.com/)
