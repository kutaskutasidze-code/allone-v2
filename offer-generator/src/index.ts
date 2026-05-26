import express from "express";
import { config, validateConfig } from "./config.js";
import { logger } from "./utils/logger.js";
import { apiKeyAuth } from "./middleware/auth.js";
import healthRouter from "./routes/health.js";
import offersRouter from "./routes/offers.js";
import referencesRouter from "./routes/references.js";
import demosRouter from "./routes/demos.js";
import draftsRouter from "./routes/drafts.js";

validateConfig();

const app = express();

app.use(express.json());

// CORS for admin panel
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health check — no auth required
app.use(healthRouter);

// All other routes require API key
app.use(apiKeyAuth);
app.use(offersRouter);
app.use(referencesRouter);
app.use(demosRouter);
app.use(draftsRouter);

app.listen(config.port, () => {
  logger.info(`Offer generator running on port ${config.port}`);
});
