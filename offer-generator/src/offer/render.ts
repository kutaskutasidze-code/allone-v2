// NOTE: Puppeteer requires a Chromium binary. In the Fly runtime this is
// guaranteed: the Dockerfile (bookworm-slim stage) installs `chromium` via
// apt and sets PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium +
// PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true. The config.puppeteer.executablePath
// value propagates that env var into the launch options below.

import puppeteer from "puppeteer";
import { config } from "../config.js";
import type { OfferDraft } from "./anchors.js";
import { renderOfferHtml } from "./template.js";

/**
 * Reusable Puppeteer renderer: launch → setContent → fonts.ready → A4 PDF.
 * Used by renderOfferPdf and the docs templates (invoice / contract).
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: config.puppeteer.executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "load" });

    // Wait for Google Fonts to load (Noto Sans Georgian + Geist).
    // networkidle0 handles the font fetches in most cases; this explicit
    // check ensures the fonts are actually rendered before printing.
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function renderOfferPdf(
  offer: OfferDraft,
  docNumber?: string,
): Promise<Buffer> {
  const html = renderOfferHtml(offer, docNumber);
  return htmlToPdf(html);
}
