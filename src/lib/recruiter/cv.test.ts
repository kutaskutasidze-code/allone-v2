import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractCvText, UnsupportedCvError } from "./cv";

describe("extractCvText", () => {
  it("rejects unsupported extensions", async () => {
    await expect(
      extractCvText(Buffer.from("x"), "resume.rtf"),
    ).rejects.toBeInstanceOf(UnsupportedCvError);
  });

  it("extracts text from a PDF", async () => {
    const knownText = "Hello CV Extraction Test";

    // Build a minimal valid PDF in-memory using pdf-lib (already a dep)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 200]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(knownText, { x: 50, y: 100, size: 14, font });
    const pdfBytes = await pdfDoc.save();

    const result = await extractCvText(Buffer.from(pdfBytes), "resume.pdf");
    expect(result).toContain(knownText);
  });
});
