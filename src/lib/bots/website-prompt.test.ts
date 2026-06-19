import { describe, it, expect } from "vitest";
import {
  buildWebsiteConversationSystem,
  buildWebsiteAnswersSchema,
} from "./website-prompt";
import type { BotQuestion } from "./types";

const QS: BotQuestion[] = [
  { id: "needs", text: "What do you need?", type: "text" },
];

describe("website prompt", () => {
  it("embeds the knowledge block and mandates contact before completion", () => {
    const sys = buildWebsiteConversationSystem(
      "ALLONE",
      null,
      "FAQ_SENTINEL",
      QS,
    );
    expect(sys).toContain("FAQ_SENTINEL");
    expect(sys).toContain("<<COMPLETE>>");
    // contact must be required before completing
    expect(sys.toLowerCase()).toContain("contact");
    // default-language guidance present (English-first, mirror visitor)
    expect(sys.toLowerCase()).toContain("english");
  });

  it("answers schema includes nullable contact fields", () => {
    const schema = buildWebsiteAnswersSchema(QS) as {
      properties: Record<string, { type: string; nullable?: boolean }>;
    };
    expect(schema.properties.contact_email).toEqual({
      type: "STRING",
      nullable: true,
    });
    expect(schema.properties.contact_name).toEqual({
      type: "STRING",
      nullable: true,
    });
    expect(schema.properties.contact_phone).toEqual({
      type: "STRING",
      nullable: true,
    });
    expect(schema.properties.needs).toEqual({ type: "STRING", nullable: true });
  });
});
