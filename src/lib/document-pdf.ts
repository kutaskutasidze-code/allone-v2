// Lightweight contract + invoice PDF builder. Uses pdf-lib (no headless
// Chrome, no external service), runs in Vercel functions. Produces an A4
// page with Allone Labs header, recipient block, body, and signature/
// totals footer. The output is intentionally minimal — designed to be
// legible and printable rather than visually rich.

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";

export interface PartyInfo {
  name: string;
  email?: string;
  company?: string;
  address?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface ContractInput {
  client: PartyInfo;
  contract_number: string;
  issue_date: string; // ISO yyyy-mm-dd
  total_amount: number;
  currency: string; // e.g. "USD", "GEL"
  payment_terms: string; // e.g. "50% upfront, 50% on delivery"
  scope: string; // freeform description of the engagement
  deliverables: string[];
  start_date: string;
  delivery_date: string;
}

export interface InvoiceInput {
  client: PartyInfo;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  line_items: InvoiceLineItem[];
  notes?: string;
}

export interface OfferInput {
  client: PartyInfo;
  offer_number: string;
  issue_date: string;
  valid_until: string; // ISO yyyy-mm-dd; the offer expires after this
  currency: string;
  intro?: string; // 1–2 sentence framing of why we're a fit
  line_items: InvoiceLineItem[];
  payment_terms?: string; // e.g. "50% on signature, 50% on delivery"
  notes?: string;
}

const ALLONE: PartyInfo = {
  name: "Allone Labs",
  email: "billing@allonelabs.com",
  company: "Allone Labs LLC",
  address: "Tbilisi, Georgia · Brussels, Belgium",
};

// ── Render primitives ──────────────────────────────────────────────────

interface RenderCtx {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  width: number;
  height: number;
}

const MARGIN = 50;
const TEXT = rgb(0.07, 0.07, 0.09);
const MUTED = rgb(0.4, 0.4, 0.45);
const ACCENT = rgb(0.04, 0.27, 1); // BF electric blue
const DIVIDER = rgb(0.88, 0.88, 0.91);

function drawText(
  ctx: RenderCtx,
  text: string,
  opts: {
    size?: number;
    bold?: boolean;
    color?: ReturnType<typeof rgb>;
    x?: number;
  } = {},
) {
  const { size = 11, bold = false, color = TEXT, x = MARGIN } = opts;
  ctx.page.drawText(text, {
    x,
    y: ctx.y,
    size,
    font: bold ? ctx.bold : ctx.font,
    color,
  });
}

function moveDown(ctx: RenderCtx, by: number) {
  ctx.y -= by;
}

function drawDivider(ctx: RenderCtx) {
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: ctx.width - MARGIN, y: ctx.y },
    thickness: 0.5,
    color: DIVIDER,
  });
}

function fmtMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Wrap text to a fixed pixel width given the font + size. Approximate
// using widthOfTextAtSize per word — fine for body copy.
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function startPage(doc: PDFDocument): Promise<RenderCtx> {
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  return { page, font, bold, y: height - MARGIN, width, height };
}

function header(ctx: RenderCtx, title: string, subtitle: string) {
  drawText(ctx, "ALLONE LABS", {
    size: 9,
    bold: true,
    color: ACCENT,
  });
  moveDown(ctx, 14);
  drawText(ctx, title, { size: 22, bold: true });
  moveDown(ctx, 6);
  drawText(ctx, subtitle, { size: 10, color: MUTED });
  moveDown(ctx, 18);
  drawDivider(ctx);
  moveDown(ctx, 24);
}

function partyBlock(ctx: RenderCtx, label: string, p: PartyInfo, x = MARGIN) {
  drawText(ctx, label, { size: 8, bold: true, color: MUTED, x });
  moveDown(ctx, 12);
  drawText(ctx, p.name, { size: 11, bold: true, x });
  moveDown(ctx, 12);
  if (p.company) {
    drawText(ctx, p.company, { size: 10, x, color: MUTED });
    moveDown(ctx, 11);
  }
  if (p.address) {
    drawText(ctx, p.address, { size: 10, x, color: MUTED });
    moveDown(ctx, 11);
  }
  if (p.email) {
    drawText(ctx, p.email, { size: 10, x, color: MUTED });
    moveDown(ctx, 11);
  }
}

// ── Contract ──────────────────────────────────────────────────────────

export async function buildContractPdf(
  input: ContractInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Allone Labs Contract ${input.contract_number}`);
  doc.setAuthor("Allone Labs");
  doc.setCreator("Allone Labs");

  const ctx = await startPage(doc);
  header(ctx, "Service Agreement", `Contract #${input.contract_number}`);

  // Two-column party block — "From" left, "To" right.
  const halfX = ctx.width / 2 + 10;
  const savedY = ctx.y;
  partyBlock(ctx, "FROM", ALLONE);
  ctx.y = savedY;
  partyBlock(ctx, "TO", input.client, halfX);

  // Pull both blocks to the same y again
  moveDown(ctx, 12);
  drawDivider(ctx);
  moveDown(ctx, 22);

  // Key-value rows
  const kv = [
    ["Issued", input.issue_date],
    ["Start", input.start_date],
    ["Delivery", input.delivery_date],
    ["Total", fmtMoney(input.total_amount, input.currency)],
    ["Payment terms", input.payment_terms],
  ];
  for (const [k, v] of kv) {
    drawText(ctx, k.toUpperCase(), {
      size: 8,
      bold: true,
      color: MUTED,
    });
    drawText(ctx, v, { size: 11, x: MARGIN + 130 });
    moveDown(ctx, 18);
  }

  moveDown(ctx, 8);
  drawDivider(ctx);
  moveDown(ctx, 22);

  // Scope
  drawText(ctx, "SCOPE", { size: 8, bold: true, color: MUTED });
  moveDown(ctx, 14);
  const scopeLines = wrapText(
    input.scope,
    ctx.font,
    11,
    ctx.width - MARGIN * 2,
  );
  for (const line of scopeLines) {
    drawText(ctx, line, { size: 11 });
    moveDown(ctx, 15);
  }

  moveDown(ctx, 14);
  drawText(ctx, "DELIVERABLES", { size: 8, bold: true, color: MUTED });
  moveDown(ctx, 14);
  for (const d of input.deliverables) {
    drawText(ctx, "•", { size: 11, color: ACCENT });
    const wrapped = wrapText(d, ctx.font, 11, ctx.width - MARGIN * 2 - 14);
    for (let i = 0; i < wrapped.length; i++) {
      drawText(ctx, wrapped[i]!, { size: 11, x: MARGIN + 14 });
      if (i < wrapped.length - 1) moveDown(ctx, 13);
    }
    moveDown(ctx, 16);
  }

  // Signature block at the bottom
  ctx.y = MARGIN + 100;
  drawDivider(ctx);
  moveDown(ctx, 22);
  drawText(ctx, "Signed for Allone Labs", {
    size: 8,
    bold: true,
    color: MUTED,
  });
  drawText(ctx, "Signed for Client", {
    size: 8,
    bold: true,
    color: MUTED,
    x: halfX,
  });
  moveDown(ctx, 50);
  drawDivider(ctx);
  ctx.page.drawLine({
    start: { x: halfX, y: ctx.y },
    end: { x: ctx.width - MARGIN, y: ctx.y },
    thickness: 0.5,
    color: DIVIDER,
  });
  moveDown(ctx, 14);
  drawText(ctx, "Name + date", { size: 9, color: MUTED });
  drawText(ctx, "Name + date", { size: 9, color: MUTED, x: halfX });

  return doc.save();
}

// ── Invoice ───────────────────────────────────────────────────────────

export async function buildInvoicePdf(
  input: InvoiceInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Allone Labs Invoice ${input.invoice_number}`);
  doc.setAuthor("Allone Labs");
  doc.setCreator("Allone Labs");

  const ctx = await startPage(doc);
  header(ctx, "Invoice", `#${input.invoice_number}`);

  const halfX = ctx.width / 2 + 10;
  const savedY = ctx.y;
  partyBlock(ctx, "FROM", ALLONE);
  ctx.y = savedY;
  partyBlock(ctx, "BILL TO", input.client, halfX);

  moveDown(ctx, 12);
  drawDivider(ctx);
  moveDown(ctx, 22);

  drawText(ctx, "ISSUED", { size: 8, bold: true, color: MUTED });
  drawText(ctx, input.issue_date, { size: 11, x: MARGIN + 70 });
  drawText(ctx, "DUE", { size: 8, bold: true, color: MUTED, x: halfX });
  drawText(ctx, input.due_date, { size: 11, x: halfX + 70 });
  moveDown(ctx, 24);
  drawDivider(ctx);
  moveDown(ctx, 18);

  // Header row
  drawText(ctx, "DESCRIPTION", { size: 8, bold: true, color: MUTED });
  drawText(ctx, "QTY", {
    size: 8,
    bold: true,
    color: MUTED,
    x: ctx.width - MARGIN - 160,
  });
  drawText(ctx, "UNIT", {
    size: 8,
    bold: true,
    color: MUTED,
    x: ctx.width - MARGIN - 110,
  });
  drawText(ctx, "TOTAL", {
    size: 8,
    bold: true,
    color: MUTED,
    x: ctx.width - MARGIN - 50,
  });
  moveDown(ctx, 12);
  drawDivider(ctx);
  moveDown(ctx, 14);

  let subtotal = 0;
  for (const item of input.line_items) {
    const lineTotal = item.quantity * item.unit_price;
    subtotal += lineTotal;
    const descLines = wrapText(
      item.description,
      ctx.font,
      11,
      ctx.width - MARGIN * 2 - 200,
    );
    drawText(ctx, descLines[0] ?? "", { size: 11 });
    drawText(ctx, String(item.quantity), {
      size: 11,
      x: ctx.width - MARGIN - 160,
    });
    drawText(ctx, fmtMoney(item.unit_price, input.currency), {
      size: 11,
      x: ctx.width - MARGIN - 110,
    });
    drawText(ctx, fmtMoney(lineTotal, input.currency), {
      size: 11,
      x: ctx.width - MARGIN - 50,
    });
    if (descLines.length > 1) {
      for (let i = 1; i < descLines.length; i++) {
        moveDown(ctx, 13);
        drawText(ctx, descLines[i]!, { size: 10, color: MUTED });
      }
    }
    moveDown(ctx, 18);
  }

  moveDown(ctx, 6);
  drawDivider(ctx);
  moveDown(ctx, 18);

  // Totals
  drawText(ctx, "Subtotal", {
    size: 11,
    color: MUTED,
    x: ctx.width - MARGIN - 160,
  });
  drawText(ctx, fmtMoney(subtotal, input.currency), {
    size: 11,
    x: ctx.width - MARGIN - 50,
  });
  moveDown(ctx, 16);
  drawText(ctx, "TOTAL DUE", {
    size: 11,
    bold: true,
    x: ctx.width - MARGIN - 160,
  });
  drawText(ctx, fmtMoney(subtotal, input.currency), {
    size: 12,
    bold: true,
    x: ctx.width - MARGIN - 50,
  });

  if (input.notes) {
    moveDown(ctx, 30);
    drawDivider(ctx);
    moveDown(ctx, 18);
    drawText(ctx, "NOTES", { size: 8, bold: true, color: MUTED });
    moveDown(ctx, 13);
    const noteLines = wrapText(
      input.notes,
      ctx.font,
      10,
      ctx.width - MARGIN * 2,
    );
    for (const line of noteLines) {
      drawText(ctx, line, { size: 10, color: MUTED });
      moveDown(ctx, 13);
    }
  }

  return doc.save();
}

// ── Commercial offer / proposal ───────────────────────────────────────
//
// Sits between a demo and a contract — a priced proposal the rep sends to
// open the conversation. Non-binding, time-limited (valid_until), and
// includes optional payment terms so the lead can say "yes" with a single
// reply before we draft a contract.

export async function buildOfferPdf(input: OfferInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Allone Labs Offer ${input.offer_number}`);
  doc.setAuthor("Allone Labs");
  doc.setCreator("Allone Labs");

  const ctx = await startPage(doc);
  header(ctx, "Commercial Offer", `#${input.offer_number}`);

  const halfX = ctx.width / 2 + 10;
  const savedY = ctx.y;
  partyBlock(ctx, "FROM", ALLONE);
  ctx.y = savedY;
  partyBlock(ctx, "PREPARED FOR", input.client, halfX);

  moveDown(ctx, 12);
  drawDivider(ctx);
  moveDown(ctx, 22);

  drawText(ctx, "ISSUED", { size: 8, bold: true, color: MUTED });
  drawText(ctx, input.issue_date, { size: 11, x: MARGIN + 70 });
  drawText(ctx, "VALID UNTIL", {
    size: 8,
    bold: true,
    color: MUTED,
    x: halfX,
  });
  drawText(ctx, input.valid_until, { size: 11, x: halfX + 90 });
  moveDown(ctx, 24);

  if (input.intro) {
    drawDivider(ctx);
    moveDown(ctx, 18);
    const introLines = wrapText(
      input.intro,
      ctx.font,
      11,
      ctx.width - MARGIN * 2,
    );
    for (const line of introLines) {
      drawText(ctx, line, { size: 11 });
      moveDown(ctx, 15);
    }
    moveDown(ctx, 6);
  }

  drawDivider(ctx);
  moveDown(ctx, 18);

  // Line-item table (same shape as invoice)
  drawText(ctx, "DESCRIPTION", { size: 8, bold: true, color: MUTED });
  drawText(ctx, "QTY", {
    size: 8,
    bold: true,
    color: MUTED,
    x: ctx.width - MARGIN - 160,
  });
  drawText(ctx, "UNIT", {
    size: 8,
    bold: true,
    color: MUTED,
    x: ctx.width - MARGIN - 110,
  });
  drawText(ctx, "TOTAL", {
    size: 8,
    bold: true,
    color: MUTED,
    x: ctx.width - MARGIN - 50,
  });
  moveDown(ctx, 12);
  drawDivider(ctx);
  moveDown(ctx, 14);

  let subtotal = 0;
  for (const item of input.line_items) {
    const lineTotal = item.quantity * item.unit_price;
    subtotal += lineTotal;
    const descLines = wrapText(
      item.description,
      ctx.font,
      11,
      ctx.width - MARGIN * 2 - 200,
    );
    drawText(ctx, descLines[0] ?? "", { size: 11 });
    drawText(ctx, String(item.quantity), {
      size: 11,
      x: ctx.width - MARGIN - 160,
    });
    drawText(ctx, fmtMoney(item.unit_price, input.currency), {
      size: 11,
      x: ctx.width - MARGIN - 110,
    });
    drawText(ctx, fmtMoney(lineTotal, input.currency), {
      size: 11,
      x: ctx.width - MARGIN - 50,
    });
    if (descLines.length > 1) {
      for (let i = 1; i < descLines.length; i++) {
        moveDown(ctx, 13);
        drawText(ctx, descLines[i]!, { size: 10, color: MUTED });
      }
    }
    moveDown(ctx, 18);
  }

  moveDown(ctx, 6);
  drawDivider(ctx);
  moveDown(ctx, 18);

  drawText(ctx, "ESTIMATED TOTAL", {
    size: 11,
    bold: true,
    x: ctx.width - MARGIN - 160,
  });
  drawText(ctx, fmtMoney(subtotal, input.currency), {
    size: 12,
    bold: true,
    x: ctx.width - MARGIN - 50,
  });

  if (input.payment_terms) {
    moveDown(ctx, 26);
    drawText(ctx, "PAYMENT TERMS", { size: 8, bold: true, color: MUTED });
    moveDown(ctx, 13);
    drawText(ctx, input.payment_terms, { size: 11 });
  }

  if (input.notes) {
    moveDown(ctx, 24);
    drawDivider(ctx);
    moveDown(ctx, 18);
    drawText(ctx, "NOTES", { size: 8, bold: true, color: MUTED });
    moveDown(ctx, 13);
    const noteLines = wrapText(
      input.notes,
      ctx.font,
      10,
      ctx.width - MARGIN * 2,
    );
    for (const line of noteLines) {
      drawText(ctx, line, { size: 10, color: MUTED });
      moveDown(ctx, 13);
    }
  }

  // Closing line — soft CTA at the bottom.
  moveDown(ctx, 28);
  drawDivider(ctx);
  moveDown(ctx, 18);
  drawText(ctx, "Reply to confirm and we'll send the service agreement.", {
    size: 10,
    color: MUTED,
  });

  return doc.save();
}
