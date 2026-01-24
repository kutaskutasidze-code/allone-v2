import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// All pitch content as RAG context (small enough to fit in context window)
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
Infrastructure cost: $90/client (30%)
Gross profit: $210/client/month (70% margin)
Avg client lifetime: 15 months (6.7% monthly churn)
LTV: $4,500
CAC: $225 (sales commission)
LTV/CAC: 14x
CAC payback: 1.07 months

=== SALES MODEL ===
Commission-based (zero fixed salary):
- 6 salespeople currently, growing to 15 by month 12
- Each: ~3 clients/month (1.5 in first month for new hires = ramp-up)
- Commission: 25% of first 3 months = $225/deal
- Sales cycle: ~1 week

=== YEAR 1 FINANCIAL PROJECTION ===
Model: salespeople × 3 deals/month − 6.7% churn
Office: $1,500/month ALL 12 months
Tech salary: $2,000/person/month
Infrastructure: $90/client/month

Month 1: 6 sales, 2 tech, 27 clients, $5,550 revenue, -$5,665 profit
Month 2: 6 sales, 2 tech, 43 clients, $10,500 revenue, -$2,200 profit
Month 3: 6 sales, 2 tech, 58 clients, $15,150 revenue, +$1,055 profit — BREAK-EVEN
Month 4: 8 sales, 2 tech, 75 clients, $19,950 revenue, +$3,740 profit
Month 5: 8 sales, 2 tech, 94 clients, $25,350 revenue, +$6,845 profit
Month 6: 10 sales, 3 tech, 115 clients, $31,350 revenue, +$8,370 profit
Month 7: 10 sales, 3 tech, 137 clients, $37,800 revenue, +$12,210 profit
Month 8: 12 sales, 3 tech, 161 clients, $44,700 revenue, +$16,365 profit
Month 9: 12 sales, 3 tech, 186 clients, $52,050 revenue, +$20,835 profit
Month 10: 13 sales, 4 tech, 211 clients, $59,550 revenue, +$23,860 profit
Month 11: 14 sales, 4 tech, 237 clients, $67,200 revenue, +$28,540 profit
Month 12: 15 sales, 4 tech, 264 clients, $75,150 revenue, +$33,430 profit

Year 1 Total Revenue: $444,300
Year 1 Total Costs: $296,915
Year 1 Net Profit: $147,385
Cash position (from $40K): $187,385

=== COST STRUCTURE (Year 1) ===
Fixed:
- Office: $18,000 (6.1%)
- Tech team: $68,000 (22.9%)
Variable:
- Infrastructure: ~$127,215 (42.8%)
- Commissions: ~$83,700 (28.2%)
Total: $296,915

=== OPERATIONS ===
1. Sales Team (commission-only) → signs clients
2. Technical Team (2-4 people) → builds AI solution in 1 week
3. AI Platform → runs automatically 24/7
4. Support → monthly maintenance

After setup, each client runs on autopilot. Cost stays $90/month regardless of usage.
Like a telecom company — fixed infrastructure, each subscriber adds pure margin.

=== INVESTMENT STRUCTURE ===
$1.24M total for 40% equity — 3 milestone-gated stages:

Stage 1 (Now): $40,000 for 10% equity
- Office (12mo), sales expansion (6→10), tech team (2 people)
- Milestone: $6K/mo revenue, 20+ clients
- Risk: Stop after 6 months if no proof

Stage 2 (After Proof): $200,000 for 15% equity
- Own servers (infra -50%), 15-20 sales, marketing
- Milestone: 50+ clients, $30K+/mo

Stage 3 (Scale): $1,000,000 for 15% equity
- Caucasus regional expansion, 30+ sales
- Milestone: 200+ clients, profitable

=== WHY THIS WORKS ===
- No fixed sales costs (commission only)
- 70% gross margin (→88% with own servers)
- Recurring revenue, 15-month avg lifetime
- Break-even Month 3 (self-sustaining quickly)
- 3 paid clients, product live at allone.ge
- Simple product: "AI for $300/month"
- Scalable: more salespeople = linear growth

=== 3-YEAR OUTLOOK ===
Year 1: 264 clients, $444K revenue, $147K profit (cloud infra $90/client)
Year 2: ~450 clients, ~$1.45M revenue, ~$670K profit (own servers $45/client)
Year 3: ~700+ clients, ~$2.5M revenue, ~$1.3M profit (Caucasus expansion)

Conservative (-25%): Y1 $333K revenue, $100K profit
Optimistic (+25%): Y1 $555K revenue, $195K profit
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

    // Build messages array with history
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Context about Allone:\n${PITCH_KNOWLEDGE}` },
      { role: 'assistant', content: 'I have the full context about Allone. Ask me anything about the business model, financials, investment terms, or operations.' },
    ];

    // Add conversation history (last 10 messages max)
    if (Array.isArray(history)) {
      const recent = history.slice(-10);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current message
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
