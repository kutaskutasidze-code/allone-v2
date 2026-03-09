# 23 — Touchpoint Inventory

## ALLONE Brand Strategy — Phase 4: Experience

---

## 1. Touchpoint Framework

A touchpoint is any moment where a person encounters, interacts with, or forms an impression of ALLONE. Every touchpoint either builds trust or erodes it. There is no neutral ground. A delayed email reply, a broken link on the website, a Calendly page with the wrong timezone — each of these is a brand statement whether we intend it or not.

This document catalogs every touchpoint in the ALLONE ecosystem, assesses its current quality, assigns ownership, maps how touchpoints connect to each other, and identifies the gaps that need to be filled. It is an operational document. It should be revisited quarterly and updated as the company scales.

### Classification Dimensions

Each touchpoint is classified across four dimensions:

**Channel** — How the interaction occurs.

| Channel | Definition |
|---------|-----------|
| **Digital** | Website, email, social media, chatbot, platform, app — any screen-mediated interaction |
| **Physical** | Office visits, printed materials, conference booths, merchandise, packaging |
| **Interpersonal** | Direct human contact — calls, meetings, video conferences, WhatsApp messages |

**Stage** — Where in the customer journey the touchpoint appears.

| Stage | Definition |
|-------|-----------|
| **Awareness** | First exposure — the person learns ALLONE exists |
| **Consideration** | Active evaluation — the person is comparing options and assessing fit |
| **Purchase** | Decision and transaction — the person commits to working with ALLONE |
| **Delivery** | Active engagement — the project is underway |
| **Post-delivery** | Ongoing relationship — support, retention, expansion |

**Ownership** — How ALLONE controls the touchpoint.

| Type | Definition |
|------|-----------|
| **Owned** | ALLONE controls the content, design, and experience entirely (website, email, chatbot) |
| **Earned** | Third parties create or distribute the content (press mentions, reviews, word-of-mouth, social shares) |
| **Paid** | ALLONE pays for placement or visibility (ads, sponsored content, paid directory listings) |

**Priority** — How critical the touchpoint is to conversion and retention.

| Level | Definition |
|-------|-----------|
| **Critical** | Directly impacts revenue. A failure here loses deals or clients. Must be excellent. |
| **Important** | Significantly influences perception. A failure here weakens trust. Should be good. |
| **Supporting** | Contributes to overall brand coherence. A failure here is tolerable short-term but compounds over time. |

---

## 2. Digital Touchpoints

### 2.1 Website — allone.ge

The website is the single most important digital asset. It is the destination for every channel — social media links here, ads point here, emails reference it, salespeople share it. If the website fails, everything upstream is wasted.

#### Homepage

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| Spline 3D Hero | Live | Digital | Awareness | Owned | Critical |
| Navigation Bar (glass pill) | Live | Digital | Awareness | Owned | Critical |
| Services Section | Live | Digital | Consideration | Owned | Critical |
| Stats Counter (clients, projects, satisfaction) | Live | Digital | Consideration | Owned | Important |
| Client Logos Marquee | Live | Digital | Consideration | Owned | Important |
| Testimonials Section | Live | Digital | Consideration | Owned | Important |
| CTA Section | Live | Digital | Consideration | Owned | Critical |
| Footer (dark navy anchor) | Live | Digital | All stages | Owned | Supporting |
| Newsletter Signup | Live | Digital | Awareness | Owned | Supporting |

**Current Assessment.** The homepage is the strongest touchpoint in the ALLONE ecosystem. The Spline 3D hero creates immediate differentiation — most agency websites in the Georgian market use static hero images or generic stock video. The Cold Clarity design system delivers a visual experience that signals technical sophistication without alienating non-technical visitors. The glass navigation bar, animated service cards, and stat counters all reinforce the brand's core identity: modern, intelligent, precise.

**Gaps.** The homepage currently lacks a case study preview or "proof section" that shows specific outcomes for specific clients. Stats are strong but abstract — a line reading "Customer service volume handled 3x with 70% cost reduction" tied to a named client would be materially more convincing than a general satisfaction percentage.

#### Service Pages

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| AI Chatbot service page | Live | Digital | Consideration | Owned | Critical |
| Custom AI Solutions page | Live | Digital | Consideration | Owned | Critical |
| Workflow Automation page | Live | Digital | Consideration | Owned | Critical |
| Website Development page | Live | Digital | Consideration | Owned | Important |
| AI Consulting page | Live | Digital | Consideration | Owned | Important |
| Service-specific animations | Live | Digital | Consideration | Owned | Supporting |

**Current Assessment.** Service pages exist and are structured with features, benefits, and CTAs. The card_type system (chatbot, custom_ai, workflow, website, consulting) provides clean categorization. Each page should function as a self-contained sales argument for visitors who arrive via direct search or social links to a specific service.

**Gaps.** Service pages need dedicated case studies, pricing transparency (even if ranges), and a clearer path to booking a discovery call. A visitor who lands on the chatbot page from a Google search should be able to understand what they get, what it costs approximately, and how to start — within 60 seconds.

#### Contact & Forms

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| Contact form | Live | Digital | Consideration/Purchase | Owned | Critical |
| info@allone.ge email | Live | Digital | All stages | Owned | Critical |
| Calendly booking integration | Live | Digital | Purchase | Owned | Critical |
| Newsletter subscription | Live | Digital | Awareness | Owned | Supporting |

#### Presentation Deck (/presentation)

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| Interactive slide deck | Live | Digital | Consideration | Owned | Important |
| Bilingual content (EN/GE) | Live | Digital | Consideration | Owned | Important |

**Current Assessment.** The interactive presentation is a significant differentiator. Most agencies send static PDFs. ALLONE's web-based deck is immersive, always up-to-date, and shareable via URL. It serves dual duty as a leave-behind after discovery calls and as a self-service exploration tool for prospects who are not yet ready to talk.

### 2.2 AI Chatbot Widget

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| ChatModal interface | Live | Digital | All stages | Owned | Critical |
| Groq-powered AI backend | Live | Digital | All stages | Owned | Critical |
| Conversational lead qualification | Live | Digital | Awareness/Consideration | Owned | Critical |
| Handoff to human (info@allone.ge) | Live | Digital | Consideration | Owned | Important |

**Current Assessment.** The AI chatbot is not merely a support widget — it is a product demonstration. Every interaction with the chatbot is a live proof of concept. A visitor asking "What does an AI chatbot cost?" is simultaneously experiencing the answer. This dual function (service delivery + product demo) makes the chatbot one of the most strategically valuable touchpoints. The Groq backend ensures low-latency responses, which is critical for conversational UX.

**Gaps.** The chatbot needs a structured handoff protocol. When a conversation reaches a point where the visitor is ready to engage, the chatbot should capture contact information, suggest a Calendly booking, and optionally notify the sales team via email or webhook. Currently, the transition from AI conversation to human follow-up is not seamlessly automated.

### 2.3 Voice Agent

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| AlloneVoice component | In development | Digital | All stages | Owned | Important |
| Voice interaction layer | In development | Digital | All stages | Owned | Supporting |

**Current Assessment.** The voice agent exists as a component (AlloneVoice.tsx, useVoiceAgent.ts) and represents a forward-looking touchpoint. When fully deployed, it adds another modality to client interaction and serves as an additional product demonstration.

### 2.4 Product Platform (E-commerce)

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| Product catalog (/products) | Live | Digital | Consideration/Purchase | Owned | Important |
| Individual product pages | Live | Digital | Purchase | Owned | Important |
| Customer login/signup | Live | Digital | Purchase | Owned | Important |
| Customer dashboard | Live | Digital | Post-delivery | Owned | Important |
| Purchase history & downloads | Live | Digital | Post-delivery | Owned | Important |
| Subscription management | Live | Digital | Post-delivery | Owned | Important |
| PayPal checkout flow | Live | Digital | Purchase | Owned | Critical |

**Current Assessment.** The product platform transforms ALLONE from a pure services company into a hybrid services-and-products business. Templates, courses, and tools create touchpoints that operate at scale without human involvement. A prospect who is not ready for a $20,000 chatbot implementation might buy a $200 automation template, establishing a commercial relationship that can be expanded later.

### 2.5 Sales Dashboard & CRM

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| Sales dashboard (/sales) | Live | Digital/Internal | Consideration/Purchase | Owned | Critical |
| Lead management | Live | Digital/Internal | Consideration | Owned | Critical |
| Campaign tracking | Live | Digital/Internal | Awareness | Owned | Important |
| Analytics & source tracking | Live | Digital/Internal | All stages | Owned | Important |
| Template management | Live | Digital/Internal | Purchase | Owned | Supporting |

### 2.6 External Digital Presences

| Platform | Status | Channel | Stage | Ownership | Priority |
|----------|--------|---------|-------|-----------|----------|
| Google Business Profile | Needed | Digital | Awareness | Owned | Critical |
| LinkedIn company page | Needed | Digital | Awareness/Consideration | Owned | Critical |
| Instagram (@allone.ge) | Needed | Digital | Awareness | Owned | Important |
| Facebook page | Needed | Digital | Awareness | Owned | Supporting |
| Twitter/X | Needed | Digital | Awareness | Owned | Supporting |
| Clutch profile | Needed | Digital | Consideration | Earned | Important |
| GoodFirms profile | Needed | Digital | Consideration | Earned | Important |
| GitHub organization | Needed | Digital | Consideration | Owned | Supporting |
| YouTube channel | Needed | Digital | Awareness | Owned | Supporting |

**Gap Assessment.** Social media is the largest gap in the current touchpoint ecosystem. For a company with 30 commission-based salespeople, the absence of a LinkedIn company page is operationally limiting — salespeople have no branded content to share, no company page to link their profiles to, and no social proof to reference in outreach. Google Business Profile is equally urgent: when someone in Tbilisi searches "AI company Georgia," ALLONE should appear in the local results pack with reviews, photos, and contact information.

### 2.7 Planned Digital Touchpoints

| Element | Status | Channel | Stage | Ownership | Priority |
|---------|--------|---------|-------|-----------|----------|
| Blog / content hub | Planned | Digital | Awareness | Owned | Important |
| Email newsletter (regular) | Planned | Digital | All stages | Owned | Important |
| Transactional emails | Planned | Digital | Purchase/Delivery | Owned | Critical |
| AI Studio (/dashboard/studio) | In development | Digital | Post-delivery | Owned | Important |
| RAG knowledge base (/dashboard/rag) | In development | Digital | Post-delivery | Owned | Supporting |
| Bot management (/dashboard/bots) | In development | Digital | Post-delivery | Owned | Important |

---

## 3. Sales Touchpoints

Sales touchpoints are interpersonal by nature. They involve human judgment, tone, timing, and presence. Every sales touchpoint must reflect the brand values: convergence (integrated understanding of the client's situation), clarity (no jargon, no mystification), and velocity (fast follow-up, compressed timelines).

| Touchpoint | Status | Channel | Stage | Ownership | Priority |
|------------|--------|---------|-------|-----------|----------|
| Initial inquiry response | Active | Interpersonal/Digital | Consideration | Owned | Critical |
| Discovery call (Calendly) | Active | Interpersonal | Consideration | Owned | Critical |
| Proposal/deck delivery | Active | Digital/Interpersonal | Purchase | Owned | Critical |
| Interactive presentation walkthrough | Active | Digital/Interpersonal | Consideration | Owned | Important |
| Demo / proof-of-concept build | Ad hoc | Digital/Interpersonal | Purchase | Owned | Critical |
| Contract and SOW delivery | Active | Digital | Purchase | Owned | Critical |
| Follow-up communications | Active | Interpersonal | All stages | Owned | Important |
| Partnership proposals (/partnership) | Live | Digital | Consideration | Owned | Important |
| Pitch deck system (/pitch) | Live | Digital | Purchase | Owned | Important |

### Sales Touchpoint Standards

**Initial inquiry response.** Target response time: under 2 hours during business hours, same business day outside hours. The first response sets the pace for the entire relationship. If ALLONE claims velocity as a core value, a 48-hour response time contradicts the brand at the first point of contact. The response should be personal (not a generic autoresponder), acknowledge the specific request, and propose a concrete next step (usually a Calendly link for a discovery call).

**Discovery call.** Duration: 30 minutes. Structure: 5 minutes rapport, 15 minutes diagnosis (asking questions, not pitching), 5 minutes overview of how ALLONE approaches their type of problem, 5 minutes next steps. The discovery call is diagnostic, not promotional. The goal is to understand the client's actual problem deeply enough to determine whether ALLONE can solve it and what that solution would look like. A discovery call that feels like a sales pitch violates the clarity value.

**Proposal delivery.** Proposals should be delivered within 3 business days of the discovery call. Each proposal should reference specific statements from the discovery conversation, demonstrating that ALLONE listened and understood. The proposal should include a clear scope, timeline, investment amount, and expected outcomes. No ambiguity.

**Demo / proof-of-concept.** For high-value prospects or complex projects, building a lightweight proof-of-concept (a basic chatbot trained on their FAQ, a sample workflow automation) can be the most persuasive touchpoint in the entire funnel. It costs ALLONE very little (AI-native delivery means a POC can be assembled in hours) and gives the prospect tangible evidence rather than promises.

**Contract and SOW.** The contract should be readable by a non-lawyer. It should clearly state deliverables, timelines, payment milestones, what happens if scope changes, and the post-launch support terms. Complexity in contracts signals either incompetence or intent to obscure — both of which violate the clarity value.

---

## 4. Delivery Touchpoints

Delivery touchpoints are where the brand promise is either fulfilled or broken. Everything before this point is marketing. Everything at this point is evidence.

| Touchpoint | Status | Channel | Stage | Ownership | Priority |
|------------|--------|---------|-------|-----------|----------|
| Project kickoff meeting | Active | Interpersonal | Delivery | Owned | Critical |
| Onboarding documentation | Needed | Digital | Delivery | Owned | Important |
| Weekly progress updates | Active | Digital/Interpersonal | Delivery | Owned | Critical |
| Client-facing project dashboard | Needed | Digital | Delivery | Owned | Important |
| Review/feedback sessions | Active | Interpersonal | Delivery | Owned | Critical |
| Staging/preview environments | Active | Digital | Delivery | Owned | Critical |
| Launch/handoff meeting | Active | Interpersonal | Delivery | Owned | Critical |
| Training sessions | Ad hoc | Interpersonal | Delivery/Post-delivery | Owned | Important |
| Documentation delivery | Needed | Digital | Delivery | Owned | Important |
| Recorded walkthroughs/Loom videos | Needed | Digital | Delivery | Owned | Supporting |

### Delivery Touchpoint Standards

**Project kickoff.** Every project begins with a formal kickoff meeting, even for small engagements. The kickoff establishes roles, communication cadence, access credentials, milestones, and the definition of "done." It transforms the relationship from "we hired a vendor" to "we are working together on this." A shared Slack channel, WhatsApp group, or dedicated communication thread should be established at kickoff.

**Progress updates.** Weekly written updates — brief, factual, and forward-looking. What was completed this week. What is planned for next week. Any blockers or decisions needed from the client. This cadence prevents the "black hole" effect where clients feel uninformed and anxious between milestones. Updates should be accompanied by visual evidence wherever possible: screenshots, staging links, short video recordings.

**Staging environments.** Every deliverable should be previewable before launch. Staging links give the client a sense of control and involvement. They also reduce the risk of post-launch surprises. The staging URL should be easy to access (no complex VPN setups), clearly labeled as non-production, and updated frequently enough to reflect current progress.

**Launch and handoff.** The launch is a ceremony, not a checkbox. It should be a scheduled event with both teams present (even if virtually). The handoff should include access credentials, documentation, training materials, and a clear statement of what post-launch support includes. The client should never feel abandoned after launch.

**Documentation.** Every delivered project should include documentation sufficient for the client's team to operate, maintain, and extend the system without ALLONE's involvement. This is not about making ALLONE replaceable — it is about building trust. A company that documents thoroughly is a company that has nothing to hide. Documentation reinforces the clarity value and positions ALLONE as a long-term partner rather than a dependency-creating vendor.

---

## 5. Support Touchpoints

Post-delivery support is where client relationships either deepen into partnerships or decay into transactional memories. The cost of retaining a client is a fraction of the cost of acquiring a new one. Support touchpoints are revenue protection.

| Touchpoint | Status | Channel | Stage | Ownership | Priority |
|------------|--------|---------|-------|-----------|----------|
| Post-launch support period | Active | Digital/Interpersonal | Post-delivery | Owned | Critical |
| Bug reporting channel | Informal | Digital | Post-delivery | Owned | Critical |
| Bug fix response & resolution | Active | Digital | Post-delivery | Owned | Critical |
| Feature request intake | Informal | Interpersonal | Post-delivery | Owned | Important |
| Account management check-ins | Needed | Interpersonal | Post-delivery | Owned | Important |
| Quarterly business reviews | Needed | Interpersonal | Post-delivery | Owned | Important |
| System health monitoring | Needed | Digital | Post-delivery | Owned | Important |
| Renewal/upsell conversations | Ad hoc | Interpersonal | Post-delivery | Owned | Critical |
| Client satisfaction surveys | Needed | Digital | Post-delivery | Owned | Supporting |
| Referral program | Needed | Digital/Interpersonal | Post-delivery | Owned | Important |

### Support Touchpoint Standards

**Post-launch support.** Every project should include a defined support period (recommended: 30 days) during which ALLONE resolves bugs, answers questions, and makes minor adjustments at no additional cost. This period is not a cost center — it is the highest-leverage moment for earning referrals and upsells. A client who feels supported after launch is a client who recommends ALLONE to peers.

**Bug reporting.** There must be a clear, low-friction channel for reporting bugs. This should not require the client to log into a project management tool they do not use. A dedicated email address (support@allone.ge), a WhatsApp group, or a simple web form connected to the internal ticketing system — the channel matters less than the response. Acknowledgment within 4 hours. Triage within 24 hours. Resolution timeline communicated within 48 hours.

**Quarterly business reviews.** For retained clients, quarterly reviews should assess system performance, identify new opportunities for automation, and discuss how the client's business has evolved since the initial engagement. These reviews are the primary mechanism for organic upsell — not because ALLONE pushes additional services, but because the review naturally surfaces new problems that AI can solve.

**Referral program.** A formalized referral program transforms satisfied clients into a sales channel. The structure should be simple: a meaningful incentive (discount on next project, free month of support, or direct commission) for every referred client that converts. The referral mechanism should be as easy as sharing a link.

---

## 6. Touchpoint Quality Audit

This audit evaluates every critical and important touchpoint against two criteria: brand alignment (how well the touchpoint reflects ALLONE's brand values and visual identity) and experience quality (how smooth, pleasant, and effective the interaction is for the person experiencing it).

### Critical Touchpoints

| Touchpoint | Status | Brand Alignment (1-5) | Experience Quality (1-5) | Priority | Action Needed |
|------------|--------|----------------------|-------------------------|----------|---------------|
| Website homepage | Live | 5 | 4 | Maintain | Add case study preview, optimize mobile 3D performance |
| AI chatbot widget | Live | 5 | 3 | Improve | Build structured handoff to Calendly/human; add conversation memory |
| Contact form | Live | 4 | 4 | Maintain | Add auto-response email with next steps |
| Service pages | Live | 4 | 3 | Improve | Add pricing ranges, case studies, clearer CTAs |
| Calendly booking | Live | 3 | 4 | Improve | Brand the Calendly page with ALLONE colors, logo, custom copy |
| Initial inquiry response | Active | 4 | 3 | Improve | Standardize response template, enforce 2-hour SLA |
| Discovery call | Active | 4 | 4 | Maintain | Create discovery call script/framework document |
| Proposal delivery | Active | 4 | 3 | Improve | Design branded proposal template, standardize structure |
| Demo/POC build | Ad hoc | 5 | 4 | Standardize | Create POC playbook with reusable templates |
| Contract/SOW | Active | 3 | 3 | Improve | Simplify language, design branded template |
| Project kickoff | Active | 4 | 3 | Improve | Create kickoff checklist and template deck |
| Weekly progress updates | Active | 3 | 3 | Improve | Design branded update template, automate where possible |
| Staging environments | Active | 4 | 4 | Maintain | Standardize staging URL naming convention |
| Launch/handoff | Active | 4 | 3 | Improve | Create handoff checklist, ceremony format |
| Post-launch support | Active | 3 | 3 | Improve | Define support tiers, response time SLAs, tracking system |
| Bug reporting | Informal | 2 | 2 | Build | Create dedicated bug reporting channel with tracking |
| PayPal checkout | Live | 3 | 3 | Improve | Add branded confirmation page, post-purchase email sequence |
| Sales dashboard | Live | 4 | 4 | Maintain | Continue iterating based on sales team feedback |

### Important Touchpoints

| Touchpoint | Status | Brand Alignment (1-5) | Experience Quality (1-5) | Priority | Action Needed |
|------------|--------|----------------------|-------------------------|----------|---------------|
| Presentation deck | Live | 5 | 4 | Maintain | Keep content current, add case studies as they come |
| Pitch system | Live | 4 | 4 | Maintain | Expand with industry-specific pitch variants |
| Client logos marquee | Live | 4 | 4 | Maintain | Add new logos as clients come on |
| Product catalog | Live | 4 | 3 | Improve | Expand product range, improve product page UX |
| Customer dashboard | Live | 4 | 3 | Improve | Add usage analytics, recommendations |
| Google Business Profile | Needed | N/A | N/A | Build | Create and optimize with photos, services, reviews |
| LinkedIn company page | Needed | N/A | N/A | Build | Create page, start content cadence |
| Instagram | Needed | N/A | N/A | Build | Create account, define visual content strategy |
| Clutch/GoodFirms profiles | Needed | N/A | N/A | Build | Create profiles, solicit first 5 reviews |
| Blog/content hub | Planned | N/A | N/A | Build | Design, create editorial calendar |
| Email newsletter | Planned | N/A | N/A | Build | Design template, define cadence and content pillars |
| Transactional emails | Planned | N/A | N/A | Build | Design branded email templates for all triggers |
| Account management check-ins | Needed | N/A | N/A | Build | Define cadence, create check-in framework |
| Quarterly business reviews | Needed | N/A | N/A | Build | Create QBR template and schedule |
| Referral program | Needed | N/A | N/A | Build | Design program structure, create tracking mechanism |
| Documentation delivery | Needed | N/A | N/A | Build | Create documentation template and standards |
| Training sessions | Ad hoc | 3 | 3 | Standardize | Create training session framework and recording process |

---

## 7. Touchpoint Ownership

Every touchpoint must have a named owner. Unowned touchpoints decay. Ownership means responsibility for quality, consistency, and improvement — not necessarily execution. The owner ensures the touchpoint meets brand standards and flags when it does not.

### Ownership Matrix

| Domain | Touchpoints | Owner Role | Current Status |
|--------|-------------|------------|----------------|
| **Website & Digital Platform** | Homepage, service pages, product pages, about, contact, blog, dashboard | Product/Engineering Lead | Active — founder-managed |
| **AI Systems** | Chatbot, voice agent, RAG, bot management, AI studio | AI/Engineering Lead | Active — founder-managed |
| **Content & Social** | LinkedIn, Instagram, Facebook, Twitter/X, blog content, newsletter | Marketing/Content Lead | Vacant — needs hire or contractor |
| **Sales Collateral** | Presentation deck, pitch system, proposals, contracts, SOWs | Sales Lead | Active — founder + sales team |
| **Sales Process** | Inquiry response, discovery calls, follow-ups, Calendly | Sales Lead | Active — distributed across 30 salespeople |
| **Client Delivery** | Kickoff, progress updates, reviews, staging, launch, documentation | Project/Delivery Lead | Active — founder-managed |
| **Client Support** | Post-launch support, bug reports, feature requests, system monitoring | Support/Operations Lead | Informal — needs formalization |
| **Account Management** | Check-ins, QBRs, renewals, upsells, referral program | Account Manager | Vacant — needs hire |
| **External Profiles** | Google Business, Clutch, GoodFirms, GitHub | Marketing/Content Lead | Vacant — needs creation |
| **Admin & CMS** | Admin panel, CMS content, settings, categories | Product/Engineering Lead | Active — founder-managed |
| **Financial Transactions** | PayPal checkout, billing, subscriptions, invoicing | Finance/Operations | Active — automated |

**Critical Gap.** The ownership matrix reveals a structural bottleneck: the founder currently owns or co-owns nearly every touchpoint domain. This is sustainable at 5 clients. It is not sustainable at 20. The two most urgent hires or contractor engagements are: (1) a content/marketing person to own social media, blog, newsletter, and external profiles; and (2) an account manager to own post-delivery relationships, check-ins, and upsell conversations.

---

## 8. Touchpoint Integration Map

Touchpoints do not exist in isolation. They form chains. A prospect moves from one touchpoint to the next, and the quality of the transition matters as much as the quality of each individual touchpoint. A brilliant website that links to an unbranded Calendly page creates cognitive dissonance. A perfect discovery call followed by a proposal that takes two weeks to arrive creates doubt about velocity.

### Primary Conversion Chain

```
Awareness Trigger (social post / ad / referral / search)
    |
    v
Website Homepage (hero, services, stats, CTA)
    |
    +---> AI Chatbot (conversational qualification)
    |         |
    |         v
    |     Chatbot captures interest + suggests Calendly
    |         |
    v         v
Contact Form / Calendly Booking
    |
    v
Discovery Call (30 min, diagnostic)
    |
    v
Proposal + Presentation Deck (delivered within 3 days)
    |
    v
Demo / POC Build (optional, for complex projects)
    |
    v
Contract / SOW Signature
    |
    v
Project Kickoff
    |
    v
Delivery Cycle (updates, reviews, staging)
    |
    v
Launch + Handoff
    |
    v
Post-Launch Support (30 days)
    |
    v
Account Management (check-ins, QBRs)
    |
    +---> Upsell / New Project
    |
    +---> Referral Program ---> New Prospect enters chain
```

### Product Platform Chain

```
Blog Post / Social Content / Search
    |
    v
Product Catalog (/products)
    |
    v
Product Page (features, pricing, preview)
    |
    v
Customer Signup / Login
    |
    v
PayPal Checkout
    |
    v
Customer Dashboard (download, manage)
    |
    v
Email Sequence (onboarding, tips, upsell to services)
    |
    v
Services Inquiry ---> Primary Conversion Chain
```

### Salesperson Chain

```
Salesperson Outreach (LinkedIn, phone, referral, event)
    |
    v
Shares: allone.ge or /presentation or /pitch
    |
    v
Prospect explores website / deck independently
    |
    v
Calendly Booking or Direct Contact
    |
    v
Discovery Call (salesperson + ALLONE technical lead)
    |
    v
Proposal (generated via sales dashboard templates)
    |
    v
Contract ---> Delivery Chain
```

### Integration Quality Standards

Each handoff between touchpoints must satisfy three criteria:

1. **Continuity.** The next touchpoint should reference or acknowledge the previous one. A discovery call should begin by referencing the form submission or chatbot conversation. A proposal should quote specific language from the discovery call.

2. **Speed.** The transition time between touchpoints should never exceed the prospect's patience threshold. Inquiry to response: 2 hours. Discovery call to proposal: 3 business days. Proposal to contract: dependent on client, but ALLONE's side should be ready within 24 hours of acceptance.

3. **Brand consistency.** Visual design, tone of voice, and quality level should be uniform across all touchpoints. A prospect who experiences the premium feel of the website should not encounter a plain-text email with no signature, a Word document proposal, or an unbranded Calendly page.

---

## 9. Gap Analysis

### Critical Gaps (Must Address Within 30 Days)

| Gap | Impact | Effort | Action |
|-----|--------|--------|--------|
| **No Google Business Profile** | Invisible in local search; no place for reviews | Low | Create and optimize profile with photos, services, hours, description |
| **No LinkedIn company page** | 30 salespeople have no company to link to; no content sharing infrastructure | Low | Create page, add all team members, start posting |
| **No standardized inquiry response** | Inconsistent first impressions; response time varies | Low | Create response template, establish 2-hour SLA, set up notifications |
| **Chatbot-to-Calendly handoff missing** | Qualified leads drop off after chatbot conversation | Medium | Build handoff flow: chatbot detects intent, surfaces Calendly link, captures email |
| **No transactional email system** | Form submissions, purchases, and signups have no confirmation flow | Medium | Design branded email templates, integrate with contact form and checkout |

### Important Gaps (Address Within 60 Days)

| Gap | Impact | Effort | Action |
|-----|--------|--------|--------|
| **No blog or content hub** | No SEO content engine; no thought leadership platform | Medium | Design blog section, create editorial calendar, publish 2 posts/month |
| **No Clutch/GoodFirms profiles** | Missing from key B2B discovery platforms | Low | Create profiles, request reviews from existing 5 clients |
| **No branded proposal template** | Proposals vary in quality and presentation | Medium | Design Figma/Notion proposal template aligned with Cold Clarity system |
| **No client documentation template** | Handoff quality varies; knowledge transfer is inconsistent | Medium | Create standardized documentation structure |
| **No formal support channel** | Bug reports come through ad hoc channels; no tracking | Medium | Set up support@allone.ge, create simple ticketing workflow |
| **No email newsletter** | No mechanism for nurturing leads or staying top-of-mind with past clients | Medium | Choose platform (Resend, Loops, or ConvertKit), design template, plan cadence |
| **No referral program** | Satisfied clients have no structured incentive to refer | Low | Design simple referral structure, create shareable link system |

### Supporting Gaps (Address Within 90 Days)

| Gap | Impact | Effort | Action |
|-----|--------|--------|--------|
| **No Instagram presence** | Missing from platform where design-forward brands build credibility | Medium | Create account, define visual content pillars, post 3x/week |
| **No GitHub organization** | Technical credibility marker missing for developer-savvy prospects | Low | Create org, publish open-source tools or templates |
| **No YouTube channel** | Missing from video-first discovery platform | High | Create channel, plan content (case studies, tutorials, behind-the-scenes) |
| **No client satisfaction surveys** | No systematic feedback collection | Low | Create post-project survey (NPS + open questions) |
| **No recorded training/walkthrough library** | Training quality depends on who delivers it | Medium | Record Loom walkthroughs for common deliverables |
| **No QBR template** | Quarterly reviews are unstructured or do not happen | Low | Create QBR deck template with performance metrics, opportunity analysis |
| **No onboarding documentation for clients** | Clients unclear on process, expectations, communication norms | Medium | Create "Working with ALLONE" guide sent at kickoff |

---

## 10. Implementation Priority Matrix

The following matrix ranks all gap-filling actions by impact and effort to guide resource allocation.

| Priority | Action | Impact | Effort | Owner | Deadline |
|----------|--------|--------|--------|-------|----------|
| 1 | Create Google Business Profile | High | Low | Marketing | Week 1 |
| 2 | Create LinkedIn company page | High | Low | Marketing | Week 1 |
| 3 | Standardize inquiry response template + SLA | High | Low | Sales Lead | Week 1 |
| 4 | Build chatbot-to-Calendly handoff | High | Medium | Engineering | Week 2 |
| 5 | Design branded transactional emails | High | Medium | Design + Engineering | Week 3 |
| 6 | Create branded proposal template | Medium | Medium | Design + Sales | Week 3 |
| 7 | Set up support@allone.ge with tracking | Medium | Medium | Operations | Week 4 |
| 8 | Create Clutch + GoodFirms profiles | Medium | Low | Marketing | Week 4 |
| 9 | Design referral program | Medium | Low | Sales + Marketing | Week 5 |
| 10 | Launch blog section with first 2 articles | Medium | Medium | Content + Engineering | Week 6 |
| 11 | Set up email newsletter platform | Medium | Medium | Marketing + Engineering | Week 6 |
| 12 | Create client onboarding guide | Medium | Medium | Delivery Lead | Week 7 |
| 13 | Create documentation delivery template | Medium | Medium | Delivery Lead | Week 7 |
| 14 | Create QBR template | Medium | Low | Account Management | Week 8 |
| 15 | Create Instagram account + content plan | Low | Medium | Marketing | Week 8 |
| 16 | Build client satisfaction survey | Low | Low | Operations | Week 8 |
| 17 | Create GitHub organization | Low | Low | Engineering | Week 9 |
| 18 | Record initial training video library | Low | Medium | Delivery Lead | Week 10 |
| 19 | Create YouTube channel | Low | High | Marketing | Week 12 |

---

## Summary

ALLONE's touchpoint ecosystem is anchored by a strong digital core — the website, AI chatbot, interactive presentation, product platform, and sales dashboard — but has significant gaps in three areas:

**External presence.** No social media, no Google Business Profile, no review platform profiles. For a company with 30 salespeople operating in the field, this is the most operationally urgent gap. Salespeople need branded content to share, a company page to reference, and social proof to point to. Every day without these assets is a day where outreach is less effective than it could be.

**Process standardization.** Sales and delivery touchpoints exist but vary in quality and consistency. Response times are not formally tracked. Proposals do not follow a consistent template. Post-launch support is handled informally. As client volume grows, inconsistency compounds. The solution is not bureaucracy — it is simple templates, clear SLAs, and lightweight tracking.

**Post-delivery relationship.** The touchpoint chain effectively ends at launch. There is no structured mechanism for maintaining relationships with delivered clients. No quarterly reviews. No account management cadence. No referral program. These are the touchpoints that generate the highest ROI per unit of effort, because the trust is already established and the switching cost for the client is high.

The 19-item implementation plan above addresses these gaps in priority order, starting with high-impact, low-effort actions that can be completed in the first two weeks and progressing through more complex initiatives over a 12-week horizon. Ownership must be assigned to specific individuals, not to roles that do not yet have people in them. Where a hire is needed, the founder bridges the gap until the position is filled.

Touchpoint management is not a project with an end date. It is an ongoing discipline. This document should be reviewed monthly, the quality audit re-scored quarterly, and the gap analysis refreshed whenever the company enters a new market, launches a new service, or reaches a new client volume threshold.