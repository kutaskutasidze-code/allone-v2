# Social Media Automation SaaS - Architecture

## Product: AllOne Social

### Core Features (MVP)
1. **Multi-platform posting** - Post to LinkedIn, Facebook, Instagram, TikTok, Twitter/X
2. **AI Content Generation** - Groq-powered content creation
3. **Scheduling** - Queue posts for optimal times
4. **Analytics** - Track engagement across platforms
5. **Multi-account** - Users can connect multiple accounts per platform

### Tech Stack
- **Frontend**: Next.js (part of allone.ge website)
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **AI**: Groq (llama-3.3-70b)
- **Queue**: Supabase Edge Functions + pg_cron
- **Payments**: Stripe

### Platform APIs

| Platform | API Type | Auth | Posting | Analytics |
|----------|----------|------|---------|-----------|
| LinkedIn | Official | OAuth 2.0 | Yes (Share API) | Yes |
| Facebook | Graph API | OAuth 2.0 | Yes (Pages) | Yes |
| Instagram | Graph API | OAuth 2.0 | Yes (Business) | Yes |
| TikTok | Official | OAuth 2.0 | Yes (Video) | Limited |
| Twitter/X | API v2 | OAuth 2.0 | Yes | Yes |

### Database Schema

```sql
-- Users (handled by Supabase Auth)

-- Connected social accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL, -- linkedin, facebook, instagram, tiktok, twitter
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  account_type TEXT, -- personal, page, business
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled posts
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  media_urls TEXT[],
  platforms TEXT[] NOT NULL, -- which platforms to post to
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, posted, failed
  ai_generated BOOLEAN DEFAULT false,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Post results (after posting)
CREATE TABLE post_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id UUID REFERENCES scheduled_posts(id),
  social_account_id UUID REFERENCES social_accounts(id),
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  post_url TEXT,
  status TEXT, -- success, failed
  error_message TEXT,
  posted_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics snapshots
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_result_id UUID REFERENCES post_results(id),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription plans
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free', -- free, pro, business
  posts_per_month INTEGER DEFAULT 10,
  accounts_limit INTEGER DEFAULT 2,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### API Endpoints

```
POST /api/social/connect/:platform    - Start OAuth flow
GET  /api/social/callback/:platform   - OAuth callback
GET  /api/social/accounts             - List connected accounts
DELETE /api/social/accounts/:id       - Disconnect account

POST /api/posts                       - Create/schedule post
GET  /api/posts                       - List posts
GET  /api/posts/:id                   - Get post details
DELETE /api/posts/:id                 - Delete scheduled post

POST /api/ai/generate                 - Generate content with AI
POST /api/ai/suggest-times            - Suggest optimal posting times

GET  /api/analytics/overview          - Dashboard analytics
GET  /api/analytics/posts/:id         - Single post analytics
```

### Pricing Tiers

| Plan | Price | Posts/mo | Accounts | AI Generation |
|------|-------|----------|----------|---------------|
| Free | $0 | 10 | 2 | 5/mo |
| Pro | $19/mo | 100 | 10 | Unlimited |
| Business | $49/mo | Unlimited | Unlimited | Unlimited + API |

### OAuth App Requirements

Each platform needs a developer app:
1. **LinkedIn**: https://developer.linkedin.com/
2. **Facebook/Instagram**: https://developers.facebook.com/
3. **TikTok**: https://developers.tiktok.com/
4. **Twitter/X**: https://developer.twitter.com/
