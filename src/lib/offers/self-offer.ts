function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function extractContact(answers: Record<string, unknown>): {
  name: string | null;
  email: string | null;
  phone: string | null;
} {
  return {
    name: str(answers.contact_name) ?? str(answers.respondent),
    email: str(answers.contact_email),
    phone: str(answers.contact_phone),
  };
}

export function hasContact(answers: Record<string, unknown>): boolean {
  const c = extractContact(answers);
  return !!(c.email || c.phone);
}

export function offerThreadUrl(slug: string, responseId: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://app.allonelabs.com";
  return `${origin}/b/${slug}/c/${responseId}`;
}
