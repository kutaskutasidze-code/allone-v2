// Internal routes — for cron triggers. Protected by the existing apiKeyAuth
// middleware (so callers must pass Bearer <API_SECRET_KEY>), but kept on a
// distinct path namespace to make ops grep + observability easier.

import { Router } from "express";
import { logger } from "../utils/logger.js";
import { runTeardownPass } from "../teardown-cron.js";

const router = Router();

router.post("/api/internal/teardown", async (_req, res) => {
  try {
    const result = await runTeardownPass();
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error("internal teardown failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
