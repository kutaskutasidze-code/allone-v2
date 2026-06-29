import { describe, it, expect } from "vitest";
import { extractCvText, UnsupportedCvError } from "./cv";

describe("extractCvText", () => {
  it("rejects unsupported extensions", async () => {
    await expect(
      extractCvText(Buffer.from("x"), "resume.rtf"),
    ).rejects.toBeInstanceOf(UnsupportedCvError);
  });
});
