import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const PITCH_KNOWLEDGE = `
ALLONE — AI Solutions for Business | Tbilisi, Georgia
We consult, build, and maintain AI systems for companies.

=== WHAT WE DO ===
4-step technology service:
1. Consultation — Analyze what the client needs automated
2. Planning — Design the AI solution (voice agent, chatbot, or workflow)
3. Execution — Build and deploy within one week
4. Support & Debugging — Maintain, update, and fix monthly
Like hiring a consulting firm + IT department for $300/month.

=== PRODUCTS ===
- Voice Agents: AI answers phones, books appointments, takes orders 24/7
- Smart Chatbots: AI trained on business documents, answers customers instantly
- Workflow Automations: Handles emails, data entry, follow-ups automatically
- Custom AI Solutions: Tailored systems $2K–$10K per project

=== UNIT ECONOMICS ===
Monthly fee: $300/client
Infrastructure cost: ~$30/client (Fixed $600 base + 5% variable API costs, spread across clients)
Sales commission: $75/client (25% of revenue)
Gross profit per client: ~$195 (65% margin per client)
Year 1 overall gross margin: 68.4% (improves with scale)
Avg client lifetime: 15 months (6.7% monthly churn)
LTV: $4,500
CAC: $225 (sales commission on first 3 months)
LTV/CAC: 14x

=== SALES MODEL ===
Commission-based (zero fixed salary):
- 6 salespeople starting, growing to 15 by month 12
- Each: ~3 clients/month
- Commission: 25% of revenue
- Sales cycle: ~1 week

=== SALES STRATEGIES ===
1. Show Don't Tell — Live demos with actual use cases (restaurant taking orders, salon booking)
2. Time-Savings ROI — $300/month = $2.30/hour to save 130+ hours monthly
3. Before/After Proof — Show concrete lead capture improvement metrics
4. Competitor Pressure — 63% of business leaders worry about falling behind without AI
5. Instant Payback — 2 extra customers/month at $150 avg covers the subscription
6. Risk-Free Start — Build AI agent in 1 week, refund if <10 inquiries in 7 days
Framework: Demo → Show savings → Prove with competitors → Risk-free trial → Close with ROI math

=== YEAR 1 FINANCIAL MODEL (from validated Excel model) ===
Revenue per client: $300/month
Infrastructure: Fixed $600/month base + 5% of revenue (variable API costs)
Sales commission: 25% of total revenue
Tech team salaries: $1,500/person/month (2 → 4 people over year)
Office & Admin: $1,500/month fixed all 12 months
Equipment: $1,000 per new tech hire

Month 1: 6 sales, 2 tech, 27 clients, $5,550 revenue, -$3,215 EBITDA
Month 2: 6 sales, 2 tech, 43 clients, $10,500 revenue, $2,250 EBITDA — EBITDA POSITIVE
Month 3: 6 sales, 2 tech, 58 clients, $15,150 revenue, $5,505 EBITDA
Month 4: 8 sales, 2 tech, 75 clients, $19,950 revenue, $8,865 EBITDA
Month 5: 8 sales, 2 tech, 94 clients, $25,350 revenue, $12,645 EBITDA
Month 6: 10 sales, 3 tech, 115 clients, $31,350 revenue, $14,345 EBITDA
Month 7: 10 sales, 3 tech, 137 clients, $37,800 revenue, $19,860 EBITDA
Month 8: 12 sales, 3 tech, 161 clients, $44,700 revenue, $24,690 EBITDA
Month 9: 12 sales, 3 tech, 186 clients, $52,050 revenue, $29,835 EBITDA
Month 10: 13 sales, 4 tech, 211 clients, $59,550 revenue, $32,585 EBITDA
Month 11: 14 sales, 4 tech, 237 clients, $67,200 revenue, $38,940 EBITDA
Month 12: 15 sales, 4 tech, 264 clients, $75,150 revenue, $44,505 EBITDA

Year 1 Total Revenue: $444,300
Year 1 Total COGS: $140,490 (infrastructure $29,415 + commissions $111,075)
Year 1 Gross Profit: $303,810 (68.4% margin)
Year 1 Total OpEx: $73,000 (tech salaries $51K + office $18K + equipment $4K)
Year 1 EBITDA: $230,810 (51.9% margin)
Year 1 Taxes/Reserves (15%): $35,104
Year 1 Net Income: $195,706
Year 1 Cash Position: $195,706

=== TEAM GROWTH ===
M1-M3: 6 sales + 2 tech (startup phase)
M4-M6: 8-10 sales + 2-3 tech (growth phase, +1 tech hire)
M7-M9: 10-12 sales + 3 tech (scale phase)
M10-M12: 13-15 sales + 4 tech (expansion, +1 tech hire)

=== OPERATING EXPENSES ===
Tech salaries: $51,000/year ($1,500/person/month, scaling 2→4)
Office & Admin: $18,000/year ($1,500/month fixed)
Equipment: $4,000/year ($1,000 per new hire)
Total OpEx: $73,000/year

=== OPERATIONS ===
1. Sales Team (commission-only, 25%) → signs clients
2. Technical Team (2-4 people) → builds AI solution in 1 week
3. AI Platform → runs automatically 24/7
4. Support → monthly maintenance

After setup, each client runs on autopilot. Infrastructure cost ~$30/month per client.

=== INVESTMENT STRUCTURE ===
$1.24M total for 40% equity — 3 milestone-gated stages:

Stage 1 (Now): $40,000 for 10% equity
- Office, sales expansion, tech team (2)
- Risk: Stop after 6 months if no proof

Stage 2 (After Proof): $200,000 for 15% equity
- Own servers (infra -50%), 15-20 sales, marketing

Stage 3 (Scale): $1,000,000 for 15% equity
- Caucasus regional expansion, 30+ sales

=== WHY THIS WORKS ===
- No fixed sales costs (commission only, 25%)
- 68.4% gross margin (→88% with own servers)
- 51.9% EBITDA margin Year 1
- Recurring revenue, 15-month avg lifetime
- EBITDA positive Month 2
- $196K net income Year 1 from $40K investment
- Simple product: "AI for $300/month"
- Scalable: more salespeople = linear growth

=== 3-YEAR OUTLOOK ===
Year 1: 264 clients, $444K revenue, $196K net income (cloud infra)
Year 2: ~450 clients, ~$1.45M revenue, ~$670K net income (own servers)
Year 3: ~700+ clients, ~$2.5M revenue, ~$1.3M net income (Caucasus expansion)
`;

const SYSTEM_PROMPT = `You are the ALLONE investor relations AI assistant. Answer questions about Allone's business model, financials, investment terms, and operations based ONLY on the provided context.

Rules:
- Be concise and direct
- Use specific numbers from the data when relevant
- If asked something not in the context, say you don't have that information
- Respond in the same language the user asks in (English or Georgian)
- For financial questions, cite the exact figures
- Never make up information not in the context`;

export async function POST(request: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Context about Allone:\n${PITCH_KNOWLEDGE}` },
      { role: 'assistant', content: 'I have the full context about Allone. Ask me anything about the business model, financials, investment terms, or operations.' },
    ];

    if (Array.isArray(history)) {
      const recent = history.slice(-10);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response generated.';

    return NextResponse.json({
      response: reply,
      tokens_used: data.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error('Pitch chat error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
