// POST /api/offers/draft   {answers, client_name} → {offer: OfferDraft}
// POST /api/offers/render  {offer, doc_number}    → {pdf_url: string}
//
// Both routes are mounted AFTER apiKeyAuth in src/index.ts.
// PDF files are stored in Supabase Storage bucket "offers" (created
// idempotently on first upload if it does not yet exist).

import { Router, type Request, type Response } from "express";
import { draftOffer } from "../offer/draft.js";
import { renderOfferPdf } from "../offer/render.js";
import { supabase } from "../database/client.js";
import { logger } from "../utils/logger.js";
import type { OfferDraft } from "../offer/anchors.js";

const BUCKET = "offers";

const router = Router();

// ── POST /api/offers/draft ───────────────────────────────────────────
router.post(
  "/api/offers/draft",
  async (req: Request, res: Response): Promise<void> => {
    const { answers, client_name } = req.body as {
      answers?: Record<string, unknown>;
      client_name?: string;
    };

    if (!answers || typeof answers !== "object") {
      res.status(400).json({ error: "answers is required (object)" });
      return;
    }
    if (!client_name || typeof client_name !== "string") {
      res.status(400).json({ error: "client_name is required (string)" });
      return;
    }

    try {
      const offer = await draftOffer(answers, client_name);
      res.json({ offer });
    } catch (err) {
      logger.error("POST /api/offers/draft failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : "draft failed",
      });
    }
  },
);

// ── POST /api/offers/render ──────────────────────────────────────────
router.post(
  "/api/offers/render",
  async (req: Request, res: Response): Promise<void> => {
    const { offer, doc_number } = req.body as {
      offer?: OfferDraft;
      doc_number?: string;
    };

    if (!offer || typeof offer !== "object") {
      res.status(400).json({ error: "offer is required (object)" });
      return;
    }
    if (!doc_number || typeof doc_number !== "string") {
      res.status(400).json({ error: "doc_number is required (string)" });
      return;
    }

    try {
      // Render PDF buffer via Puppeteer
      const pdfBuffer = await renderOfferPdf(offer, doc_number);

      // Ensure the bucket exists (idempotent — ignore "already exists" error)
      const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      });
      if (bucketErr && !bucketErr.message.includes("already exists")) {
        throw new Error(`Storage bucket error: ${bucketErr.message}`);
      }

      // Upload to offers/<doc_number>.pdf (upsert so re-renders overwrite)
      const storagePath = `${doc_number}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(`Storage upload error: ${uploadErr.message}`);
      }

      // Build the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      logger.info("POST /api/offers/render: uploaded", {
        doc_number,
        pdf_url: publicUrl,
        size_kb: Math.round(pdfBuffer.length / 1024),
      });

      res.json({ pdf_url: publicUrl });
    } catch (err) {
      logger.error("POST /api/offers/render failed", {
        error: err instanceof Error ? err.message : String(err),
        doc_number,
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : "render failed",
      });
    }
  },
);

export default router;
