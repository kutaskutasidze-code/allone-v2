import { NextRequest, NextResponse } from "next/server";
import { search, type RagIndex, type SearchResult } from "@/lib/rag/search";
import { readFile } from "fs/promises";
import { join } from "path";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let cachedIndex: RagIndex | null = null;

async function getIndex(): Promise<RagIndex> {
  if (cachedIndex) return cachedIndex;
  const raw = await readFile(
    join(process.cwd(), "public", "rag-index.json"),
    "utf-8"
  );
  cachedIndex = JSON.parse(raw) as RagIndex;
  return cachedIndex;
}

function buildContext(results: SearchResult[]): string {
  return results
    .map((r) => {
      const lang = r.chunk.lang === "en" ? "EN" : "KA";
      return `[${lang}] ${r.chunk.heading}:\n${r.chunk.text}`;
    })
    .join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `You are the ALLONE Quantum AI Lab's research assistant — an expert in quantum computing, quantum machine learning, tensor networks, error mitigation, and hybrid quantum-classical architectures.

You answer questions about ALLONE's quantum AI research based on the provided research context. The research covers: tensor network LLM compression, Born machines, Origin Wukong 72-qubit processor benchmarking, quantum reservoir computing for finance, error mitigation (REM + DD + ZNE), and the Multiverse LLM architecture.

Guidelines:
- Answer in the same language the user asks in (Georgian or English)
- For Georgian: use proper academic Georgian; technical terms (qubit, tensor, Born machine, CNOT, etc.) stay in English
- Be substantive and informative — cite specific numbers, methods, metrics, and findings from the context
- Structure longer answers clearly with paragraphs when needed
- Synthesize information from multiple context chunks into a coherent, insightful answer
- If the context covers the topic partially, explain what the research does cover and note what's beyond current scope
- Write 3-8 sentences for typical questions — be thorough but focused
- Never fabricate data, results, or metrics not present in the context
- Reference specific research findings and conclusions when available
- When discussing experiments, mention methodology and results, not just purpose
- NEVER use LaTeX notation ($...$, \\(...\\), etc.) — write math in plain text (e.g., "2^n" not "$2^n$", "probability p(x)" not "$p(x)$", "state |0>" not "$|0\\rangle$")
- Use plain Unicode for symbols when needed (e.g., θ, ψ, α, β, ×, →)`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function callGemini(messages: ChatMessage[]): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  let systemText = "";
  const geminiContents = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      systemText = msg.content;
    } else {
      geminiContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  const body = JSON.stringify({
    ...(systemText && {
      systemInstruction: { parts: [{ text: systemText }] },
    }),
    contents: geminiContents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(45000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const text = parts
          .filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
          .map((p: { text: string }) => p.text)
          .join("");
        return text || null;
      }

      if (res.status >= 500 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return null;
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function callGroq(messages: ChatMessage[]): Promise<string | null> {
  if (!GROQ_API_KEY) return null;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

export async function POST(req: NextRequest) {
  try {
    const { query, history, lang } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const index = await getIndex();
    const results = search(query.trim(), index, undefined, 8);
    const context = buildContext(results);

    // Build messages
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n--- RESEARCH CONTEXT ---\n${context}`,
      },
    ];

    // Include conversation history
    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: query });

    // Try Gemini first, fall back to Groq
    let answer = await callGemini(messages);
    if (!answer) {
      answer = await callGroq(messages);
    }

    return NextResponse.json({
      answer: answer || "Could not generate an answer. Please try again.",
      results,
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
