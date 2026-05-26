import { Router } from "express";
import { z } from "zod";
import { logger } from "../utils/logger.js";
import {
  listReferences,
  getReference,
  createReference,
  setReferenceActive,
  refreshReference,
} from "../references/index.js";
import type { Segment } from "../types/demo.js";

const router = Router();

const SEGMENT_ENUM = [
  "tourism",
  "ecom",
  "law-firm",
  "dental",
  "agency",
  "other",
] as const;

const createRefSchema = z.object({
  segment: z.enum(SEGMENT_ENUM),
  source_url: z.string().url(),
  source_label: z.string().optional(),
  pre_cloned_path: z.string(),
  aesthetic_tier: z.number().int().min(1).max(5).optional(),
  ref_map_path: z.string().optional(),
});

router.get("/api/references", async (req, res) => {
  try {
    const segment = req.query.segment as Segment | undefined;
    const refs = await listReferences({
      segment,
      active_only: req.query.active !== "false",
    });
    res.json({ success: true, data: refs });
  } catch (err) {
    logger.error("listReferences failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/api/references/:id", async (req, res) => {
  try {
    const ref = await getReference(req.params.id);
    if (!ref) {
      res.status(404).json({ success: false, error: "Reference not found" });
      return;
    }
    res.json({ success: true, data: ref });
  } catch (err) {
    logger.error("getReference failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/api/references", async (req, res) => {
  try {
    const body = createRefSchema.parse(req.body);
    const ref = await createReference({
      segment: body.segment,
      source_url: body.source_url,
      source_label: body.source_label ?? null,
      pre_cloned_path: body.pre_cloned_path,
      aesthetic_tier: body.aesthetic_tier,
      ref_map_path: body.ref_map_path ?? null,
    });
    res.status(201).json({ success: true, data: ref });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: err.flatten().fieldErrors,
      });
      return;
    }
    logger.error("createReference failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/api/references/:id/refresh", async (req, res) => {
  try {
    // Long-running — kick off async and return 202.
    const ref = await getReference(req.params.id);
    if (!ref) {
      res.status(404).json({ success: false, error: "Reference not found" });
      return;
    }
    refreshReference(req.params.id).catch((err) => {
      logger.error("refreshReference failed", {
        id: req.params.id,
        error: err.message,
      });
    });
    res.status(202).json({
      success: true,
      data: { id: req.params.id, status: "refreshing" },
    });
  } catch (err) {
    logger.error("refresh dispatch failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.delete("/api/references/:id", async (req, res) => {
  try {
    await setReferenceActive(req.params.id, false);
    res.json({ success: true });
  } catch (err) {
    logger.error("deactivateReference failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/api/references/:id/reactivate", async (req, res) => {
  try {
    await setReferenceActive(req.params.id, true);
    res.json({ success: true });
  } catch (err) {
    logger.error("reactivateReference failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
