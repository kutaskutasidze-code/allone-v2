# Allone Lead Scraper

Automated lead generation and email outreach system for Allone.

## Features

- **Multi-source scraping**: 2GIS, Yandex Maps, Google Maps (more coming)
- **Contact extraction**: Extracts emails and phone numbers from company websites
- **AI categorization**: Matches leads to Allone services using keyword rules
- **Email automation**: Personalized outreach using Groq AI and Resend
- **Daily limits**: Respects Resend free tier limits (100/day)

## Setup

### 1. Install dependencies

```bash
cd scraper
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_xxxxxxxxxxxx
GROQ_API_KEY=your_groq_api_key
```

### 3. Run database migration

Make sure the lead generation tables are created in Supabase:

```sql
-- Run the migration in Supabase SQL Editor
-- See: supabase/migrations/20250117_lead_generation.sql
```

## Usage

### Development

```bash
# Watch mode
npm run dev

# Run scraper manually
npm run scrape

# Run email sender manually
npm run email
```

### Production (VPS)

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name allone-scraper

# Set up cron jobs
crontab -e

# Add:
# Daily scrape at 3 AM
0 3 * * * cd /home/allone/allone-scraper && /usr/bin/node dist/scheduler/scrape.cron.js

# Hourly emails (9 AM - 6 PM)
0 9-18 * * * cd /home/allone/allone-scraper && /usr/bin/node dist/scheduler/email.cron.js
```

## Architecture

```
scraper/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration
│   │
│   ├── scrapers/             # Source-specific scrapers
│   │   ├── base.scraper.ts   # Base class
│   │   └── 2gis.scraper.ts   # 2GIS implementation
│   │
│   ├── extractors/           # Contact extraction
│   │   └── email.extractor.ts
│   │
│   ├── categorizer/          # Lead categorization
│   │   └── rules.ts
│   │
│   ├── email/                # Email automation
│   │   ├── groq.client.ts    # AI personalization
│   │   └── resend.client.ts  # Email sending
│   │
│   ├── database/             # Supabase integration
│   │   ├── client.ts
│   │   └── leads.repo.ts
│   │
│   ├── scheduler/            # Cron jobs
│   │   ├── scrape.cron.ts
│   │   └── email.cron.ts
│   │
│   └── utils/                # Utilities
│       ├── browser.ts        # Puppeteer setup
│       └── logger.ts         # Winston logging
```

## Target Countries

- Kazakhstan (2GIS, HeadHunter)
- Uzbekistan (2GIS, HeadHunter)
- Georgia (Yandex Maps)
- Turkey (Google Maps, Kariyer.net)
- Armenia (Yandex Maps)
- Azerbaijan (Yandex Maps)

## Service Matching

Leads are automatically categorized to match Allone services:

| Service | Keywords |
|---------|----------|
| AI Chatbots | customer support, call center, e-commerce |
| Custom AI | fintech, healthcare, insurance, bank |
| Automation | logistics, manufacturing, warehouse |
| Website | hotel, restaurant, startup, real estate |
| Consulting | enterprise, corporation, holding |

## Email Limits

- Resend free tier: 100 emails/day, 3000/month
- Warm up slowly: 20/day → 50 → 100
- Always include unsubscribe link

## Adding New Scrapers

1. Create `src/scrapers/yoursite.scraper.ts`
2. Extend `BaseScraper` class
3. Implement `scrape(query, city, country)` method
4. Add to scrape cron job

## License

Private - Allone
