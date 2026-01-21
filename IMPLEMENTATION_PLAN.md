# ALLONE Website Improvement Plan

## Executive Summary
Based on comprehensive research of the codebase, this plan addresses 15 issues across security, UX, functionality, and aesthetics.

---

## PRIORITY 1: CRITICAL SECURITY (Do First)

### 1.1 GitHub Repo Made Private ✅ DONE
- Was PUBLIC - anyone could see code and secrets
- Now PRIVATE

### 1.2 Fix PayPal Subscription Activation Vulnerability
**Problem:** `/api/subscription/activate` accepts `user_id` as query parameter - anyone can activate subscription for any user
**Fix:** Use authenticated user from session instead of query param
**Files:** `src/app/api/subscription/activate/route.ts`

### 1.3 Add Rate Limiting
**Problem:** No rate limiting on API endpoints - vulnerable to abuse
**Fix:** Add rate limiting middleware using `@upstash/ratelimit` or similar
**Files:** Create `src/middleware/rateLimit.ts`, update API routes

### 1.4 Add Input Validation to Chat API
**Problem:** Chat input has no length limit - could DOS Groq API
**Fix:** Limit message length to 4000 characters, validate before sending
**Files:** `src/app/api/studio/chat/route.ts`, `src/app/dashboard/studio/AIStudioContent.tsx`

---

## PRIORITY 2: FUNCTIONAL FIXES

### 2.1 Chat History Persistence (Last 10 + Starred)
**Current State:** Chat history lost on refresh - only in React state
**Solution:**
- Create `chat_sessions` and `chat_messages` tables in Supabase
- Add star/unstar functionality
- Load last 10 sessions + all starred on page load
- Auto-save messages as user chats

**Database Schema:**
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files to modify:**
- Create `supabase/migrations/20250122_chat_history.sql`
- Update `src/app/dashboard/studio/AIStudioContent.tsx`
- Create `src/app/api/chat/sessions/route.ts`
- Create `src/app/api/chat/messages/route.ts`

### 2.2 Google Sign-in App Name
**Problem:** Google OAuth shows weird name instead of "Allone"
**Solution:** Configure in Supabase Dashboard > Authentication > Providers > Google
- Go to Google Cloud Console > APIs & Credentials > OAuth consent screen
- Update "Application name" to "Allone"
- Update logo and support email

**Action:** This is a configuration change, not code change. Provide instructions.

### 2.3 PayPal Subscription Logic
**Current Problems:**
1. Creates new PayPal product/plan on EVERY subscription request (wasteful)
2. No clear distinction between one-time purchase and subscription
3. Hardcoded $100/month price

**Options for User to Choose:**

**Option A: Simple (Recommended)**
- One subscription tier: $100/month
- Use existing PayPal integration
- Store plan_id in environment variable (don't recreate)
- Clear "Subscribe" button on billing page

**Option B: Multiple Tiers**
- Free, Starter ($29), Pro ($99), Business ($299)
- Pre-create all plans in PayPal
- Let user choose tier on billing page
- More complex but more flexible

**Option C: Usage-Based**
- Base subscription + pay-per-use overages
- Most complex, requires usage tracking
- Best for heavy users

### 2.4 Profile Name Not Updating Navbar
**Problem:** Line 139 shows `user.email?.split('@')[0]` instead of full_name
**Fix:** Use `user.user_metadata?.full_name || user.email?.split('@')[0]`
**Files:** `src/app/dashboard/DashboardLayoutContent.tsx`

### 2.5 Hide Overview Page
**Problem:** Overview has no real functionality
**Options:**
- **Option A:** Remove from navigation, redirect `/dashboard` to `/dashboard/studio`
- **Option B:** Keep but show "Coming Soon" with blurred content
- **Option C:** Make it useful - show actual usage stats, recent activity

---

## PRIORITY 3: UX IMPROVEMENTS

### 3.1 Smoother Chatbox
**Current Issues:**
- Abrupt message appearance
- No typing indicator
- Scroll jumps

**Fixes:**
- Add smooth scroll to bottom on new message
- Add typing indicator animation while AI responds
- Animate message entry with slide-up effect
- Add message fade-in transition

### 3.2 Profile Picture System
**Implementation:**
1. Download 12 cute character avatars (from Notion-style or similar)
2. Store in `/public/avatars/`
3. Add avatar picker in Settings page
4. Update `profiles` table to store selected avatar
5. Display in navbar and profile areas

**Avatar Options:**
- Use DiceBear API for generated avatars, OR
- Download static set (Notion-style characters)

### 3.3 Button Animations & Interactions
**Add to all buttons:**
- `whileHover={{ scale: 1.02 }}`
- `whileTap={{ scale: 0.98 }}`
- `transition={{ duration: 0.15 }}`
- Subtle shadow lift on hover

### 3.4 Soft Gradient Cards
**Add to cards:**
- Very subtle gradient borders (near-white to light gray)
- Soft color tints based on card type:
  - Voice AI: subtle blue tint
  - RAG Bots: subtle green tint
  - Workflows: subtle purple tint
- Use `bg-gradient-to-br from-white to-[color]/5`

---

## PRIORITY 4: ADDITIONAL BUGS FOUND

### 4.1 Subscription Status Race Condition
- `cancel_at_period_end` set but status stays "active"
- User sees "active" until period ends, confusing

### 4.2 Product Creation Silent Failures
- If voice-noob API fails, product saved as "draft" but user not clearly informed
- Need clearer error messaging

### 4.3 Hardcoded Prices
- $100/month in multiple places
- Should be from database config

### 4.4 Missing Subscription Limit Checks
- Users can create unlimited products regardless of plan
- Need to check limits before creation

### 4.5 Download Tokens Never Expire
- Purchased product download links work forever
- Should expire or limit downloads

---

## IMPLEMENTATION ORDER

### Phase 1: Security (Day 1)
1. ✅ Make GitHub private
2. Fix subscription activation vulnerability
3. Add rate limiting
4. Add chat input validation

### Phase 2: Core Functionality (Day 2-3)
5. Implement chat history with starring
6. Fix navbar profile name
7. PayPal subscription cleanup (based on chosen option)

### Phase 3: UX Polish (Day 4)
8. Smooth chatbox animations
9. Profile picture system
10. Button animations
11. Card gradients
12. Hide/improve Overview

### Phase 4: Bug Fixes (Day 5)
13. Fix remaining bugs from list
14. Test all flows end-to-end

---

## QUESTIONS FOR USER

1. **PayPal Subscription:** Which option? (A: Simple, B: Multiple Tiers, C: Usage-Based)

2. **Overview Page:** Which option? (A: Remove/redirect, B: Coming Soon, C: Make useful)

3. **Profile Pictures:** Which style?
   - A: DiceBear API (dynamic, many styles)
   - B: Static cute characters (download set)
   - C: Allow custom upload

4. **Google OAuth Name:** Do you have access to Google Cloud Console to change the app name?

---

## FILES THAT WILL BE MODIFIED

```
src/
├── app/
│   ├── api/
│   │   ├── subscription/activate/route.ts (security fix)
│   │   ├── studio/chat/route.ts (validation)
│   │   ├── chat/sessions/route.ts (new)
│   │   ├── chat/messages/route.ts (new)
│   │   └── profile/route.ts (avatar support)
│   ├── dashboard/
│   │   ├── DashboardLayoutContent.tsx (navbar name, avatar)
│   │   ├── studio/AIStudioContent.tsx (chat history, smooth UX)
│   │   ├── settings/SettingsContent.tsx (avatar picker)
│   │   └── DashboardContent.tsx (overview changes)
│   └── (auth)/
│       ├── login/page.tsx (rate limit)
│       └── signup/page.tsx (rate limit)
├── components/
│   └── ui/Button.tsx (animations)
├── middleware.ts (rate limiting)
└── lib/
    └── rateLimit.ts (new)

supabase/
└── migrations/
    └── 20250122_chat_history.sql (new)

public/
└── avatars/ (new - 12 character images)
```

---

## ESTIMATED EFFORT

| Task | Effort |
|------|--------|
| Security fixes | 2-3 hours |
| Chat history | 4-5 hours |
| Navbar fix | 30 mins |
| PayPal cleanup | 2-3 hours |
| Chatbox smooth | 2 hours |
| Profile pics | 2-3 hours |
| Button animations | 1 hour |
| Card gradients | 1 hour |
| Overview changes | 1 hour |
| Bug fixes | 2-3 hours |
| **Total** | **~18-22 hours** |

---

## APPROVAL NEEDED

Please review this plan and:
1. Answer the 4 questions above
2. Approve or request changes
3. Then I'll proceed with implementation

