// TF-IDF RAG search engine — TypeScript port of quantum-ai-lab/rag/query.py

export interface Chunk {
  text: string;
  heading: string;
  lang: "en" | "ka";
}

export interface RagIndex {
  chunks: Chunk[];
  tfidf: Record<string, number>[];
  idf: Record<string, number>;
}

export interface SearchResult {
  score: number;
  chunk: Chunk;
}

function tokenize(text: string): string[] {
  const tokens = text.toLowerCase().match(/[a-z0-9\u10A0-\u10FF]+/gi) ?? [];
  return tokens.filter((t) => t.length > 1).map((t) => t.toLowerCase());
}

function cosineSim(
  a: Record<string, number>,
  b: Record<string, number>
): number {
  const keysA = Object.keys(a);
  let dot = 0;
  let hasCommon = false;
  for (const k of keysA) {
    if (k in b) {
      dot += a[k] * b[k];
      hasCommon = true;
    }
  }
  if (!hasCommon) return 0;

  let normA = 0;
  for (const v of Object.values(a)) normA += v * v;
  let normB = 0;
  for (const v of Object.values(b)) normB += v * v;

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function search(
  query: string,
  index: RagIndex,
  lang?: "en" | "ka",
  topK = 5
): SearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const tf: Record<string, number> = {};
  for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;

  const total = tokens.length;
  const queryVec: Record<string, number> = {};
  for (const [t, count] of Object.entries(tf)) {
    const idfVal = index.idf[t] ?? 0;
    if (idfVal > 0) queryVec[t] = (count / total) * idfVal;
  }

  const results: SearchResult[] = [];
  for (let i = 0; i < index.chunks.length; i++) {
    const chunk = index.chunks[i];
    if (lang && chunk.lang !== lang) continue;
    const score = cosineSim(queryVec, index.tfidf[i]);
    if (score > 0) results.push({ score, chunk });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
