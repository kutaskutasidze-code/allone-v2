// POST /api/docs/generate
//   Body: { proposal, recipient, date_label }
//   Returns: { contract_pdf_url, invoice_pdf_url }
//
// Mounted AFTER apiKeyAuth in src/index.ts.
// PDFs are stored in the existing "offers" Supabase Storage bucket under
// contracts/<doc_number>.pdf and invoices/<doc_number>-INV.pdf.

import { Router, type Request, type Response } from "express";
import {
  renderContractHtml,
  type SignatureInfo,
} from "../docs/contract-template.js";
import {
  renderInvoiceHtml,
  type ProposalLike,
} from "../docs/invoice-template.js";
import { htmlToPdf } from "../docs/render.js";
import type { Recipient } from "../docs/issuer.js";
import { supabase } from "../database/client.js";
import { logger } from "../utils/logger.js";
import { sendDocsEmail, type DocAttachment } from "../sender/send-docs.js";

const BUCKET = "offers";

const router = Router();

router.post(
  "/api/docs/generate",
  async (req: Request, res: Response): Promise<void> => {
    const { proposal, recipient, date_label } = req.body as {
      proposal?: ProposalLike;
      recipient?: Recipient;
      date_label?: string;
    };

    if (!proposal || typeof proposal !== "object") {
      res.status(400).json({ error: "proposal is required (object)" });
      return;
    }
    if (!proposal.doc_number || typeof proposal.doc_number !== "string") {
      res.status(400).json({ error: "proposal.doc_number is required" });
      return;
    }
    if (!proposal.offer || typeof proposal.offer !== "object") {
      res.status(400).json({ error: "proposal.offer is required" });
      return;
    }

    const effectiveRecipient: Recipient = recipient ??
      proposal.recipient ?? { name: proposal.client_name };

    const dateStr =
      date_label ??
      new Date().toLocaleDateString("ka-GE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    try {
      // Render both HTMLs → PDF buffers
      const contractHtml = renderContractHtml(
        proposal,
        effectiveRecipient,
        dateStr,
      );
      const invoiceHtml = renderInvoiceHtml(proposal, effectiveRecipient);

      const [contractBuf, invoiceBuf] = await Promise.all([
        htmlToPdf(contractHtml),
        htmlToPdf(invoiceHtml),
      ]);

      // Ensure bucket exists (idempotent)
      const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      if (bucketErr && !bucketErr.message.includes("already exists")) {
        throw new Error(`Storage bucket error: ${bucketErr.message}`);
      }

      const contractPath = `contracts/${proposal.doc_number}.pdf`;
      const invoicePath = `invoices/${proposal.doc_number}-INV.pdf`;

      // Upload both (upsert so re-generates overwrite)
      const [{ error: contractUploadErr }, { error: invoiceUploadErr }] =
        await Promise.all([
          supabase.storage.from(BUCKET).upload(contractPath, contractBuf, {
            contentType: "application/pdf",
            upsert: true,
          }),
          supabase.storage.from(BUCKET).upload(invoicePath, invoiceBuf, {
            contentType: "application/pdf",
            upsert: true,
          }),
        ]);

      if (contractUploadErr) {
        throw new Error(`Contract upload error: ${contractUploadErr.message}`);
      }
      if (invoiceUploadErr) {
        throw new Error(`Invoice upload error: ${invoiceUploadErr.message}`);
      }

      const {
        data: { publicUrl: contract_pdf_url },
      } = supabase.storage.from(BUCKET).getPublicUrl(contractPath);
      const {
        data: { publicUrl: invoice_pdf_url },
      } = supabase.storage.from(BUCKET).getPublicUrl(invoicePath);

      logger.info("POST /api/docs/generate: uploaded", {
        doc_number: proposal.doc_number,
        contract_pdf_url,
        invoice_pdf_url,
        contract_kb: Math.round(contractBuf.length / 1024),
        invoice_kb: Math.round(invoiceBuf.length / 1024),
      });

      res.json({ contract_pdf_url, invoice_pdf_url });
    } catch (err) {
      logger.error("POST /api/docs/generate failed", {
        error: err instanceof Error ? err.message : String(err),
        doc_number: proposal.doc_number,
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : "generate failed",
      });
    }
  },
);

// POST /api/docs/sign
//   Body: { proposal, recipient?, date_label?, signature }
//   Re-renders ONLY the contract with the e-signature embedded and overwrites
//   contracts/<doc_number>.pdf. Returns { contract_pdf_url }.
router.post(
  "/api/docs/sign",
  async (req: Request, res: Response): Promise<void> => {
    const { proposal, recipient, date_label, signature } = req.body as {
      proposal?: ProposalLike;
      recipient?: Recipient;
      date_label?: string;
      signature?: SignatureInfo;
    };

    if (!proposal?.doc_number || !proposal?.offer) {
      res
        .status(400)
        .json({ error: "proposal with doc_number + offer is required" });
      return;
    }
    if (!signature || typeof signature !== "object") {
      res.status(400).json({ error: "signature is required" });
      return;
    }

    const effectiveRecipient: Recipient = recipient ??
      proposal.recipient ?? { name: proposal.client_name };
    const dateStr =
      date_label ??
      new Date().toLocaleDateString("ka-GE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    try {
      const contractHtml = renderContractHtml(
        proposal,
        effectiveRecipient,
        dateStr,
        signature,
      );
      const contractBuf = await htmlToPdf(contractHtml);
      const contractPath = `contracts/${proposal.doc_number}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(contractPath, contractBuf, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadErr) {
        throw new Error(`Contract upload error: ${uploadErr.message}`);
      }
      const {
        data: { publicUrl: contract_pdf_url },
      } = supabase.storage.from(BUCKET).getPublicUrl(contractPath);
      logger.info("POST /api/docs/sign: signed contract uploaded", {
        doc_number: proposal.doc_number,
        contract_pdf_url,
      });
      res.json({ contract_pdf_url });
    } catch (err) {
      logger.error("POST /api/docs/sign failed", {
        error: err instanceof Error ? err.message : String(err),
        doc_number: proposal.doc_number,
      });
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : "sign failed" });
    }
  },
);

// POST /api/docs/send
//   Body: { to, from_name?, subject, html, attachments: [{url, filename}] }
//   Returns: { ok: true, resendId } or 502 { error }
router.post(
  "/api/docs/send",
  async (req: Request, res: Response): Promise<void> => {
    const { to, from_name, subject, html, attachments } = req.body as {
      to?: string;
      from_name?: string;
      subject?: string;
      html?: string;
      attachments?: DocAttachment[];
    };

    if (!to || typeof to !== "string" || !to.trim()) {
      res.status(400).json({ error: "to (recipient email) is required" });
      return;
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      res.status(400).json({ error: "subject is required" });
      return;
    }
    if (!html || typeof html !== "string" || !html.trim()) {
      res.status(400).json({ error: "html body is required" });
      return;
    }
    if (!Array.isArray(attachments) || attachments.length === 0) {
      res.status(400).json({
        error: "attachments must be a non-empty array of {url, filename}",
      });
      return;
    }

    const result = await sendDocsEmail({
      to: to.trim(),
      fromName: from_name,
      subject: subject.trim(),
      html,
      attachments,
    });

    if (!result.ok) {
      logger.error("POST /api/docs/send failed", { error: result.error, to });
      res.status(502).json({ error: result.error });
      return;
    }

    logger.info("POST /api/docs/send: sent", {
      to,
      resendId: result.resendId,
      attachmentCount: attachments.length,
    });
    res.json({ ok: true, resendId: result.resendId });
  },
);

export default router;
