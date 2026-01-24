/**
 * Test the Pitch RAG Chat Endpoint
 *
 * The pitch RAG uses Groq (Llama 3.3 70B) with full context injection.
 * No embeddings needed — all pitch content is passed as context since it's small (~10KB).
 *
 * Usage:
 *   node scripts/ingest-pitch-rag.mjs [question]
 *
 * Examples:
 *   node scripts/ingest-pitch-rag.mjs "What is the break-even month?"
 *   node scripts/ingest-pitch-rag.mjs "How much is Stage 1 investment?"
 *   node scripts/ingest-pitch-rag.mjs "რა არის LTV/CAC?"
 *
 * API Endpoint: POST /api/pitch/chat
 * Body: { "message": "your question", "history": [] }
 * Returns: { "response": "...", "tokens_used": N }
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const question = process.argv[2] || 'What are the Year 1 financial projections?';

async function main() {
  console.log(`\nAsking: "${question}"\n`);
  console.log(`Endpoint: ${BASE_URL}/api/pitch/chat\n`);

  try {
    const res = await fetch(`${BASE_URL}/api/pitch/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, history: [] }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Error ${res.status}: ${err}`);
      process.exit(1);
    }

    const data = await res.json();
    console.log('Response:');
    console.log(data.response);
    console.log(`\n(${data.tokens_used} tokens used)`);
  } catch (err) {
    console.error('Failed to connect. Is the dev server running? (pnpm dev)');
    console.error(err.message);
  }
}

main();
