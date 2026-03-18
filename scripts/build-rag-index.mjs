#!/usr/bin/env node
/**
 * Build TF-IDF RAG index from all lab research content.
 * Sources:
 *   1. Full academic papers (paper_en.md, paper_ka.md) from quantum-ai-lab
 *   2. Lab research page content from src/data/lab-research.ts
 *
 * Outputs: public/rag-index.json
 * Usage: node scripts/build-rag-index.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const QUANTUM_LAB = join(ROOT, "..", "..", "Desktop", "quantum-ai-lab");

// ─── Chunking (matches original Python indexer logic) ───

const MAX_CHUNK = 600;

function chunkMarkdown(text, lang) {
  const sections = text.split(/\n(?=#{1,3} )/);
  const chunks = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 20) continue;

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    const heading = headingMatch ? headingMatch[2] : "Untitled";

    if (trimmed.length > MAX_CHUNK) {
      const paragraphs = trimmed.split("\n\n");
      let current = "";
      for (const para of paragraphs) {
        if (current.length + para.length > MAX_CHUNK && current) {
          chunks.push({ text: current.trim(), heading, lang });
          current = para;
        } else {
          current = current ? current + "\n\n" + para : para;
        }
      }
      if (current.trim()) {
        chunks.push({ text: current.trim(), heading, lang });
      }
    } else {
      chunks.push({ text: trimmed, heading, lang });
    }
  }
  return chunks;
}

// ─── Source 1: Full academic papers from quantum-ai-lab ───

const allChunks = [];

const paperFiles = [
  { path: join(QUANTUM_LAB, "paper_en.md"), lang: "en" },
  { path: join(QUANTUM_LAB, "paper_ka.md"), lang: "ka" },
];

for (const { path, lang } of paperFiles) {
  if (existsSync(path)) {
    const text = readFileSync(path, "utf-8");
    const chunks = chunkMarkdown(text, lang);
    allChunks.push(...chunks);
    console.log(`Full paper (${lang.toUpperCase()}): ${chunks.length} chunks from ${path}`);
  } else {
    console.log(`SKIP: ${path} not found`);
  }
}

// ─── Source 2: Lab research page content from TypeScript data ───

const tsContent = readFileSync(
  join(ROOT, "src/data/lab-research.ts"),
  "utf-8"
);

// Parse each paper block from the TS file
const paperBlocks = tsContent.split(/\n  \{[\s]*\n/).slice(1);

for (const block of paperBlocks) {
  const slug = block.match(/slug:\s*"([^"]+)"/)?.[1];
  const title = block.match(/(?:^|\n)\s*title:\s*"([^"]+)"/)?.[1];
  const titleKa = block.match(/titleKa:\s*"([^"]+)"/)?.[1];
  const contentMatch = block.match(/content:\s*`([\s\S]*?)`,/);
  const contentKaMatch = block.match(/contentKa:\s*`([\s\S]*?)`,/);

  if (!slug || !contentMatch) continue;

  // Skip the first paper (quantum-ml-roadmap) if its content overlaps
  // with the full academic papers — we already have those in full detail.
  // The lab-research.ts summaries ADD context not in the full papers.

  const enContent = contentMatch[1];
  const kaContent = contentKaMatch?.[1] || "";

  // Chunk EN content
  const enChunks = chunkMarkdown(enContent, "en");
  for (const c of enChunks) {
    // Use paper title as heading prefix for better source attribution
    if (c.heading === "Untitled") c.heading = title || slug;
  }
  allChunks.push(...enChunks);

  // Chunk KA content
  if (kaContent) {
    const kaChunks = chunkMarkdown(kaContent, "ka");
    for (const c of kaChunks) {
      if (c.heading === "Untitled") c.heading = titleKa || title || slug;
    }
    allChunks.push(...kaChunks);
  }

  console.log(`Lab page: ${slug} — EN: ${enChunks.length}, KA: ${kaContent ? chunkMarkdown(kaContent, "ka").length : 0} chunks`);
}

// ─── TF-IDF computation ───

function tokenize(text) {
  const tokens = text.toLowerCase().match(/[a-z0-9\u10A0-\u10FF]+/gi) || [];
  return tokens.filter((t) => t.length > 1).map((t) => t.toLowerCase());
}

const N = allChunks.length;

// Document frequency
const df = {};
for (const chunk of allChunks) {
  const unique = new Set(tokenize(chunk.text));
  for (const t of unique) {
    df[t] = (df[t] || 0) + 1;
  }
}

// IDF (matching original Python: log(N / (1 + count)))
const idf = {};
for (const [term, count] of Object.entries(df)) {
  idf[term] = Math.log(N / (1 + count));
}

// TF-IDF vectors (rounded to 4 decimals like original)
const tfidf = [];
for (const chunk of allChunks) {
  const tokens = tokenize(chunk.text);
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;

  const total = tokens.length || 1;
  const vec = {};
  for (const [term, count] of Object.entries(tf)) {
    const val = (count / total) * (idf[term] || 0);
    if (val > 0) vec[term] = Math.round(val * 10000) / 10000;
  }
  tfidf.push(vec);
}

// Round IDF values
const idfRounded = {};
for (const [k, v] of Object.entries(idf)) {
  idfRounded[k] = Math.round(v * 10000) / 10000;
}

console.log(`\nTotal chunks: ${N}`);
console.log(`  EN: ${allChunks.filter((c) => c.lang === "en").length}`);
console.log(`  KA: ${allChunks.filter((c) => c.lang === "ka").length}`);
console.log(`  Vocabulary: ${Object.keys(idf).length} terms`);

// ─── Write output ───

const index = { chunks: allChunks, tfidf, idf: idfRounded };
const outPath = join(ROOT, "public", "rag-index.json");
writeFileSync(outPath, JSON.stringify(index, null, 0), "utf-8");

const sizeKB = Math.round(readFileSync(outPath).length / 1024);
console.log(`\nWrote ${outPath} (${sizeKB} KB)`);
