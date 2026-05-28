// Bearer-token gate. The sales API on Vercel calls us with
// `Authorization: Bearer ${OFFER_API_KEY}`; we compare against
// API_SECRET_KEY from env. Health route is mounted BEFORE this middleware
// so /health stays public.

import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Allow OPTIONS through (the CORS handler in index.ts already short-
  // circuits these with a 204, but if something slipped past we still
  // shouldn't bounce the preflight on auth).
  if (req.method === "OPTIONS") return next();

  const expected = config.apiKey;
  if (!expected) {
    // No key configured = service is wide open. Refuse to start in
    // validateConfig(), but if we got here log loudly.
    res.status(500).json({ error: "API_SECRET_KEY not configured" });
    return;
  }

  const header = req.headers.authorization || "";
  const provided = header.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : "";

  if (provided !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
