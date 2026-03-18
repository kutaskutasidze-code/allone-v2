# Quick Setup Guide

## What You Need (5 minutes total)

### 1. Groq API Key (FREE - 30 seconds)
1. Go to: https://console.groq.com
2. Sign in with Google/GitHub
3. Click "Create API Key"
4. Copy the key (starts with `gsk_`)

### 2. Resend API Key (FREE - 2 minutes)
1. Go to: https://resend.com
2. Sign up with email
3. Go to Settings → API Keys
4. Create an API key
5. Copy it (starts with `re_`)

**Note:** For production, you'll need to verify your domain (allone.ge) in Resend to send from your own email address.

### 3. Oracle Cloud Account (FREE - 3 minutes)
1. Go to: https://signup.oraclecloud.com
2. Use personal email
3. Choose region: **Frankfurt** (for Europe/CIS targets)
4. Add credit card (verification only - won't charge)
5. Wait for activation email (can take 1-2 hours)

## After Getting Keys

Once you have the Groq and Resend keys, tell me and I'll:
1. Create the Oracle Cloud VM for you (if your account is ready)
2. Deploy the scraper
3. Set up automated cron jobs
4. Test everything

## Test Locally First (Optional)

```bash
cd scraper
cp .env.example .env
# Edit .env with your keys
nano .env

# Install dependencies
npm install

# Test connection
npm run dev
```
