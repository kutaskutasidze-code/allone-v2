# 04 — Domain & Digital Presence Research

> **Phase 1: Foundation** | ALLONE (allone.ge)
> AI Automation Agency — Tbilisi, Georgia
> Date: March 2026

---

## 1. Domain Analysis

### Current Domain: allone.ge

ALLONE operates on the `.ge` country-code top-level domain, Georgia's national TLD managed by the Caucasus Online registry. This choice carries strategic implications for both local authority and international expansion.

**Brand-ability Assessment**

| Factor | Rating | Notes |
|--------|--------|-------|
| Memorability | 8/10 | Short, phonetically clean, one word — easy to recall |
| Spelling clarity | 7/10 | Risk of confusion with "alone" in verbal communication |
| Brand alignment | 9/10 | "All One" encapsulates the unified AI platform proposition |
| Domain length | 9/10 | 9 characters total (allone.ge) — compact and clean |
| Professional perception | 7/10 | Credible for regional market; needs supplemental domains for global |

**Pros of .ge TLD**

- Strong local SEO signal: Google treats `.ge` as a geo-targeted domain for Georgia, boosting rankings in Georgian search results.
- Trust indicator for Georgian businesses: Local clients and partners immediately recognize the company as Georgian-based, which builds trust in a market where personal relationships drive procurement.
- Regulatory alignment: Some Georgian government and enterprise RFPs give preference to locally-registered digital entities.
- Scarcity value: `.ge` domains are less saturated than `.com`, so exact-match brand names remain available.
- Cost: `.ge` registration is affordable (roughly $15-30/year through local registrars).

**Cons of .ge TLD**

- International unfamiliarity: Outside the Caucasus, `.ge` is not widely recognized. European and American prospects may assume the site is German (`.de` confusion) or simply not trust a TLD they have never seen.
- SEO geo-restriction: Google's geo-targeting for `.ge` means the domain will underperform in organic search results outside Georgia unless supplemented with hreflang tags, a separate global domain, or Google Search Console's international targeting settings.
- Perceived scale: A ccTLD can signal "small local shop" to enterprise buyers in Western Europe or the US, which conflicts with ALLONE's ambition to operate across Belgium and eventually other markets.
- Limited email trust: Cold outreach emails from `.ge` addresses may trigger higher spam-filter scrutiny in markets unfamiliar with the TLD.

### Recommended Domain Acquisitions

| Domain | Priority | Estimated Cost | Purpose |
|--------|----------|---------------|---------|
| allone.ai | Critical | $3,000–$15,000 (aftermarket) | Global primary domain — `.ai` signals AI-native, widely recognized, strong brand fit |
| allone.tech | High | $30–$50/year | Fallback global domain if `.ai` is prohibitively expensive |
| allone.co | Medium | $25–$35/year | Clean alternative, startup-friendly perception |
| allone.agency | Low | $20–$30/year | Category-descriptive, but longer and less brandable |

**Strategic recommendation:** Acquire `allone.ai` as the global-facing primary domain. Route `allone.ge` to the Georgian-language experience and `allone.ai` to the English-language international site. Both can be served from the same Next.js deployment using middleware-based locale detection and domain routing — Vercel supports multi-domain projects natively.

If `allone.ai` is already registered, check its status: many `.ai` domains are parked or available through aftermarket platforms (Sedo, Dan.com, Afternic). The `.ai` TLD has become the de facto standard for AI companies, and owning it signals legitimacy to investors, partners, and enterprise buyers.

---

## 2. SEO Audit & Opportunities

### Current State Assessment

ALLONE's website launched in late 2025. Given its age (approximately 3-4 months at the time of writing), organic traffic is expected to be minimal. The site is in the "sandbox" period where Google indexes content but ranks it conservatively until it establishes domain authority.

| Metric | Estimated Current State | Target (6 months) | Target (12 months) |
|--------|------------------------|-------------------|---------------------|
| Domain Authority | 0–5 | 15–20 | 25–35 |
| Indexed pages | 5–10 | 30–50 | 80–120 |
| Organic monthly visits | <50 | 500–1,000 | 3,000–5,000 |
| Referring domains | <5 | 30–50 | 100–150 |
| Avg. position (target keywords) | Not ranking | 15–30 | 5–15 |

### Target Keyword Clusters

**English Keywords — Georgia Market**

| Keyword | Est. Monthly Volume | Difficulty | Intent | Priority |
|---------|---------------------|-----------|--------|----------|
| AI automation Georgia | 50–100 | Low | Commercial | P0 |
| AI chatbot Tbilisi | 20–50 | Low | Commercial | P0 |
| AI solutions Georgia | 30–80 | Low | Commercial | P0 |
| workflow automation Tbilisi | 10–30 | Low | Commercial | P0 |
| custom AI development Georgia | 20–50 | Low | Commercial | P0 |
| AI consulting Georgia | 20–40 | Low | Commercial | P1 |
| business automation Georgia | 30–60 | Low | Commercial | P1 |
| AI agency Tbilisi | 10–30 | Low | Commercial | P1 |
| n8n automation Georgia | 10–20 | Very Low | Informational | P2 |
| chatbot development company Georgia | 10–30 | Low | Commercial | P1 |

**English Keywords — International Market**

| Keyword | Est. Monthly Volume | Difficulty | Intent | Priority |
|---------|---------------------|-----------|--------|----------|
| AI automation agency | 500–1,000 | High | Commercial | P1 |
| custom AI chatbot development | 1,000–2,500 | High | Commercial | P1 |
| workflow automation company | 800–1,500 | High | Commercial | P2 |
| AI solutions for business | 2,000–5,000 | Very High | Informational | P2 |
| AI agency Europe | 200–500 | Medium | Commercial | P1 |
| affordable AI development | 300–600 | Medium | Commercial | P1 |

**Georgian-Language Keywords (ქართული)**

| Keyword (Georgian) | Transliteration | Est. Monthly Volume | Priority |
|--------------------|-----------------|---------------------|----------|
| ხელოვნური ინტელექტი საქართველო | khelovnuri intelekti sakartvelo | 100–300 | P0 |
| ჩატბოტი თბილისი | chatboti tbilisi | 30–80 | P0 |
| ბიზნეს ავტომატიზაცია | biznes avtomatizatsia | 50–150 | P0 |
| AI სერვისები | AI servisebi | 30–60 | P1 |
| ვებსაიტის შექმნა თბილისი | vebsaitis shekmna tbilisi | 200–500 | P1 |
| პროგრამული უზრუნველყოფა | programuli uzrunvelhopa | 100–300 | P2 |

**Note on volume estimates:** Georgian-language search volumes are thin compared to English markets. The advantage is near-zero competition — ranking first for "AI automation Georgia" in Georgian is achievable within 2-3 months with consistent content.

### Technical SEO: Next.js Advantages

ALLONE's tech stack gives it strong technical SEO foundations out of the box:

- **Server-Side Rendering (SSR):** Next.js App Router renders pages server-side, meaning search engine crawlers receive fully-formed HTML. This eliminates the JavaScript-rendering delays that hurt React SPAs in search indexing.
- **Automatic code splitting:** Each route loads only the JavaScript it needs, improving page load performance and Core Web Vitals scores.
- **Built-in image optimization:** Next.js `<Image>` component serves WebP/AVIF with automatic resizing, lazy loading, and responsive srcsets.
- **Metadata API:** Next.js 16 provides a native `generateMetadata()` function for dynamic, per-page meta titles, descriptions, and Open Graph tags.
- **Sitemap generation:** Next.js can generate `sitemap.xml` dynamically from the app router structure.

### Content SEO Strategy

**Blog Topics (priority order):**

1. "How AI Chatbots Are Transforming Customer Service in Georgia" — local relevance, low competition
2. "5 Workflow Automations Every Georgian Business Should Implement" — practical, shareable
3. "AI vs. Traditional Software Development: What Georgian Companies Need to Know" — thought leadership
4. "Case Study: How [Client X] Reduced Response Time by 80% with AI" — social proof
5. "The State of AI Adoption in the Caucasus Region" — regional authority play
6. "Why Georgian Businesses Are Choosing AI-First Solutions in 2026" — trend piece
7. "Building Custom AI Solutions: Our Tech Stack Explained" — technical credibility
8. "AI Automation ROI Calculator: Is It Worth It for Your Business?" — interactive content opportunity

**Content cadence:** 2 posts per month minimum, alternating between Georgian and English. Each post should target one primary keyword cluster and include internal links to relevant service pages.

---

## 3. Digital Footprint Assessment

### Current Presence

| Channel | Status | Action Required |
|---------|--------|-----------------|
| Website (allone.ge) | Live | Ongoing optimization |
| Email (info@allone.ge) | Active | Set up DMARC, DKIM, SPF for deliverability |
| Calendly | Integrated | Working for demo scheduling |
| Google Business Profile | Not set up | Create immediately — critical for local SEO |
| LinkedIn (Company) | Not set up | Create immediately — primary B2B channel |
| GitHub (Organization) | Not set up | Create for technical credibility |
| Clutch.co | Not listed | Apply for listing within 30 days |
| GoodFirms | Not listed | Apply for listing within 30 days |
| DesignRush | Not listed | Apply for listing within 30 days |
| Instagram | Not set up | Create within 60 days |
| Facebook | Not set up | Create within 60 days |
| Twitter/X | Not set up | Create within 90 days |

### Platform-Specific Recommendations

**LinkedIn (Priority 1 — launch within 1 week)**
LinkedIn is the single most important channel for B2B AI services. Georgian business decision-makers are active on LinkedIn, and the platform's algorithm currently favors AI-related content. Actions:
- Create ALLONE company page with complete profile, branded banner, and service descriptions.
- Founder's personal profile should list ALLONE prominently and publish 2-3 posts per week (thought leadership, behind-the-scenes, client wins).
- Join and engage in Georgian business groups, tech groups, and regional AI communities.
- Use LinkedIn Articles for long-form content that mirrors blog posts (cross-posting strategy).
- Target connections: CTOs, COOs, and digital transformation leads at Georgian enterprises (TBC Bank ecosystem, Bank of Georgia, Wissol, SPAR, Liberty Bank).

**Google Business Profile (Priority 1 — launch within 1 week)**
Essential for local search visibility. When someone in Tbilisi searches "AI company near me" or "AI automation Tbilisi," the Google Business Profile (GBP) is what appears in the map pack. Actions:
- Register ALLONE on Google Business with the Tbilisi office address.
- Select categories: "Software Company," "IT Services," "Artificial Intelligence Company."
- Upload high-quality photos of the office, team, and client work.
- Collect Google Reviews from the 5 existing paying clients — even 5 five-star reviews with detailed text will dominate the local pack for AI-related queries in Tbilisi.
- Post weekly updates on GBP (Google treats active profiles more favorably).

**GitHub Organization (Priority 2 — launch within 2 weeks)**
Technical buyers and CTOs will check GitHub. An active GitHub presence signals engineering competence. Actions:
- Create `allone-ge` organization on GitHub.
- Open-source 2-3 non-proprietary tools or templates (e.g., a Supabase starter kit, a Georgian-language NLP tokenizer, or an n8n workflow template pack).
- Maintain a clean README structure with branding consistent with the website.
- Contributors should have professional profiles linking back to ALLONE.

**Clutch / GoodFirms / DesignRush (Priority 2 — within 30 days)**
These directories are heavily referenced by enterprise buyers during vendor selection. A verified Clutch profile with 3-5 client reviews can generate inbound leads with minimal effort. The listing process takes 2-4 weeks for verification. Start early.

**Instagram & Facebook (Priority 3 — within 60 days)**
Secondary channels. Instagram works for brand storytelling (team culture, office, event appearances, behind-the-scenes of AI builds). Facebook is still relevant in Georgia for an older business audience. Neither will drive direct leads the way LinkedIn will, but they contribute to the overall brand presence that prospects check during due diligence.

**Twitter/X (Priority 4 — within 90 days)**
Useful for international visibility and engaging with the global AI community. The founder should follow and interact with AI thought leaders, share technical insights, and reference ALLONE case studies. Low effort, long-term compounding returns.

---

## 4. AI Search Readiness

AI-powered search engines — ChatGPT with browsing, Perplexity, Google AI Overviews, and Microsoft Copilot — are reshaping how businesses discover service providers. These systems synthesize answers from web content rather than returning a list of blue links. Being cited in an AI-generated answer is the new "ranking first on Google."

### How AI Search Engines Select Sources

AI search tools prioritize content that is:
- **Factual and specific:** Concrete numbers, named clients, verifiable claims. "We reduced processing time by 73% for Client X" ranks higher than "We deliver great results."
- **Well-structured:** Clear headings, bullet points, tables, FAQ sections. AI parsers extract structured content more reliably.
- **Authoritative:** Content from domains with backlinks, brand mentions on other sites, and consistent NAP (Name, Address, Phone) data across the web.
- **Unique:** Original research, proprietary data, case studies, and first-person expertise that cannot be found elsewhere.

### Implementation Checklist

**Structured Data / Schema Markup**

Add JSON-LD schema markup to every page. Next.js makes this straightforward via the `<script type="application/ld+json">` pattern in layout or page components.

Required schemas:
- `Organization` — company name, logo, contact info, social profiles, founding date
- `LocalBusiness` — Tbilisi address, operating hours, geo-coordinates
- `Service` — each AI service offering with description and price range
- `FAQPage` — every service page should have 5-8 structured FAQ items
- `Article` — blog posts with author, date, and publisher info
- `Review` — aggregate rating from client testimonials
- `BreadcrumbList` — navigation path for every page

**FAQ Sections**

Every service page should include a dedicated FAQ section with 5-8 questions and concise, factual answers. These are high-value targets for AI search citation. Example questions for the chatbot service page:
- "How long does it take to deploy a custom AI chatbot?"
- "What languages does your chatbot support?"
- "Can the chatbot integrate with our existing CRM?"
- "What is the typical ROI of an AI chatbot for Georgian businesses?"

**Brand Mentions & Authority Signals**

AI search engines use brand mentions (even without links) as trust signals. Tactics:
- Get quoted in Georgian tech media (e.g., Forbes Georgia, Business Media Georgia).
- Contribute guest posts to international AI/tech blogs.
- Speak at local tech events (Startup Grind Tbilisi, Google Developer Groups Tbilisi).
- Publish original research: "State of AI Adoption in Georgian Business 2026" — this type of content gets cited by AI search engines repeatedly.

**Content Formatting for AI Parsers**

- Lead every page and article with a clear, factual summary paragraph (the "TL;DR" that AI will extract).
- Use definition-style formatting for key concepts: bold the term, follow with a colon and explanation.
- Include specific numbers, percentages, and timeframes rather than vague qualifiers.
- Maintain a consistent company description across all platforms (website, LinkedIn, Clutch, GBP) so AI search engines can confidently attribute information to ALLONE.

---

## 5. Technical SEO Recommendations

### Next.js Specific Optimizations

| Task | Status | Priority | Implementation |
|------|--------|----------|---------------|
| Dynamic `generateMetadata()` per page | Needs audit | P0 | Each route should export unique title, description, OG image |
| Sitemap generation | Not implemented | P0 | Add `app/sitemap.ts` using Next.js built-in sitemap generation |
| robots.txt | Needs audit | P0 | Add `app/robots.ts` — allow all crawlers, reference sitemap URL |
| Canonical URLs | Needs audit | P0 | Ensure every page has a canonical tag to prevent duplicate content |
| hreflang tags | Not implemented | P1 | Add for Georgian/English bilingual content to signal language targeting |
| JSON-LD structured data | Not implemented | P1 | Organization, LocalBusiness, Service, FAQPage schemas |
| Open Graph / Twitter cards | Needs audit | P1 | Every page needs og:title, og:description, og:image, twitter:card |
| Image alt text | Needs audit | P1 | All images must have descriptive alt attributes |
| Internal linking | Minimal | P2 | Service pages should cross-link, blog posts should link to services |

### Core Web Vitals Targets

| Metric | Target | Current Risk Areas |
|--------|--------|--------------------|
| Largest Contentful Paint (LCP) | < 2.5s | Spline 3D scene in hero — must lazy-load, show fallback fast |
| First Input Delay (FID) | < 100ms | Heavy JS from Framer Motion + Spline — code-split aggressively |
| Cumulative Layout Shift (CLS) | < 0.1 | Reserve explicit dimensions for images, 3D canvas, and dynamic content |
| Interaction to Next Paint (INP) | < 200ms | Monitor after Spline integration — 3D rendering can block main thread |

**Spline 3D Performance Concern:** The interactive 3D robot scene is visually compelling but resource-intensive. Recommendations:
- Lazy-load the Spline component with `next/dynamic` and `ssr: false`.
- Show a static image placeholder (screenshot of the 3D scene) until the Spline runtime loads.
- Set explicit `width` and `height` on the Spline container to prevent CLS.
- Consider serving a simplified version on mobile devices where GPU performance varies.

### Additional Technical Tasks

- **Image optimization:** Convert all static images to WebP/AVIF. Use Next.js `<Image>` component exclusively — never raw `<img>` tags.
- **Font optimization:** General Sans and Plus Jakarta Sans should be loaded via `next/font` with `display: swap` to prevent FOIT (Flash of Invisible Text). Subset fonts to Latin + Georgian character sets to reduce file size.
- **Compression:** Verify Vercel is serving Brotli-compressed responses (it does by default, but confirm).
- **Security headers:** Add `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and `Content-Security-Policy` headers via `next.config.ts` — these are minor ranking signals and protect against common attacks.
- **404 handling:** Create a custom `not-found.tsx` that guides users back to relevant pages rather than a dead end.

---

## 6. Keyword Strategy — Priority Clusters

### Cluster 1: AI Automation (Primary — highest intent)

| Term | Volume | Difficulty | Page Target |
|------|--------|-----------|-------------|
| AI automation Georgia | 50–100 | Low | Homepage + Services |
| AI automation agency | 500–1,000 | High | Homepage |
| business process automation AI | 300–600 | Medium | Workflow service page |
| AI workflow automation | 200–400 | Medium | Workflow service page |
| automate business with AI | 100–200 | Medium | Blog post |

### Cluster 2: AI Chatbot (Secondary — high commercial intent)

| Term | Volume | Difficulty | Page Target |
|------|--------|-----------|-------------|
| AI chatbot Tbilisi | 20–50 | Low | Chatbot service page |
| custom AI chatbot development | 1,000–2,500 | High | Chatbot service page |
| chatbot for customer service | 2,000–4,000 | High | Blog post |
| AI chatbot for business | 1,500–3,000 | High | Blog post |
| Georgian language chatbot | <10 | Very Low | Chatbot service page (Georgian) |

### Cluster 3: AI Consulting (Tertiary — relationship-building)

| Term | Volume | Difficulty | Page Target |
|------|--------|-----------|-------------|
| AI consulting Georgia | 20–40 | Low | Consulting service page |
| AI strategy consulting | 500–1,000 | High | Consulting service page |
| AI implementation partner | 100–300 | Medium | About / Partnership page |
| AI transformation consulting | 200–400 | Medium | Blog post |

### Cluster 4: Location-Based (Local SEO)

| Term | Volume | Difficulty | Page Target |
|------|--------|-----------|-------------|
| IT company Tbilisi | 100–300 | Medium | Homepage |
| software development Georgia | 200–500 | Medium | Services page |
| tech company Tbilisi | 50–150 | Low | About page |
| AI company Caucasus | <20 | Very Low | Blog post |
| web development Tbilisi | 200–500 | Medium | Website service page |

### Execution Priority

**Month 1-2:** Dominate Cluster 1 and Cluster 4 (low competition, local market). Publish homepage and service page content optimized for these terms. Set up Google Business Profile.

**Month 3-4:** Expand into Cluster 2 with dedicated chatbot content, case studies, and blog posts. Begin outreach for backlinks from Georgian tech media.

**Month 5-6:** Target Cluster 3 with thought leadership content. Apply for Clutch and directory listings. Begin international SEO push on `allone.ai` domain (if acquired).

**Ongoing:** Publish 2 blog posts per month, collect client reviews, build backlinks through PR and guest posting. Monitor rankings weekly and adjust keyword targeting based on what gains traction.

---

## Summary of Immediate Actions

| Action | Owner | Deadline | Impact |
|--------|-------|----------|--------|
| Set up Google Business Profile | Marketing | Week 1 | High — local SEO |
| Create LinkedIn company page | Marketing | Week 1 | High — B2B visibility |
| Implement `sitemap.ts` and `robots.ts` | Engineering | Week 1 | High — crawlability |
| Add `generateMetadata()` to all routes | Engineering | Week 2 | High — search snippets |
| Add JSON-LD structured data (Organization, LocalBusiness) | Engineering | Week 2 | Medium — AI search readiness |
| Research `allone.ai` domain availability and pricing | Founder | Week 2 | High — global positioning |
| Create GitHub organization | Engineering | Week 3 | Medium — technical credibility |
| Publish first blog post (Georgian) | Marketing | Week 4 | Medium — content SEO |
| Apply to Clutch.co | Marketing | Week 4 | Medium — enterprise credibility |
| Set up email authentication (DMARC, DKIM, SPF) | Engineering | Week 2 | Medium — email deliverability |
