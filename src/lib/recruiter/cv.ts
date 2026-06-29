import mammoth from "mammoth";

export class UnsupportedCvError extends Error {}

export async function extractCvText(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "pdf") {
    // pdf-parse v2 default export parses a Buffer and returns { text }
    const pdfParse = (await import("pdf-parse")).default as (
      b: Buffer,
    ) => Promise<{ text: string }>;
    const { text } = await pdfParse(buffer);
    return text.trim();
  }
  if (ext === "docx" || ext === "doc") {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }
  throw new UnsupportedCvError(`Unsupported CV type: ${filename}`);
}
