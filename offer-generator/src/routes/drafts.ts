import { Router } from "express";
import { z } from "zod";
import { logger } from "../utils/logger.js";
import { getDemoJob } from "../database/demo-jobs.repo.js";
import {
  getEmailDraft,
  updateEmailDraftBody,
  markEmailDraftRevoked,
} from "../database/email-drafts.repo.js";
import { sendEmailDraft } from "../sender/index.js";

const router = Router();

const updateDraftSchema = z.object({
  subject: z.string().optional(),
  body_html: z.string().optional(),
  body_text: z.string().optional(),
});

router.put("/api/demos/:id/draft", async (req, res) => {
  try {
    const job = await getDemoJob(req.params.id);
    if (!job?.email_draft_id) {
      res
        .status(404)
        .json({ success: false, error: "No draft for this job yet" });
      return;
    }
    const body = updateDraftSchema.parse(req.body);
    await updateEmailDraftBody(job.email_draft_id, body);
    const updated = await getEmailDraft(job.email_draft_id);
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: err.flatten().fieldErrors,
      });
      return;
    }
    logger.error("updateDraft failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/api/demos/:id/draft/send", async (req, res) => {
  try {
    const job = await getDemoJob(req.params.id);
    if (!job?.email_draft_id) {
      res.status(404).json({ success: false, error: "No draft to send" });
      return;
    }
    const result = await sendEmailDraft({ draftId: job.email_draft_id });
    if (!result.ok) {
      res.status(502).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: { resend_id: result.resendId } });
  } catch (err) {
    logger.error("sendDraft failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/api/demos/:id/draft/revoke", async (req, res) => {
  try {
    const job = await getDemoJob(req.params.id);
    if (!job?.email_draft_id) {
      res.status(404).json({ success: false, error: "No draft to revoke" });
      return;
    }
    await markEmailDraftRevoked(job.email_draft_id);
    res.json({ success: true });
  } catch (err) {
    logger.error("revokeDraft failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
