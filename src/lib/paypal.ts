import "server-only";

// Minimal PayPal Orders v2 client (server-side). Sandbox by default; flip to
// live by setting PAYPAL_ENV=live. Offers are priced in GEL but PayPal has no
// GEL, so amounts are converted to USD at PAYPAL_GEL_PER_USD (default 2.7).

function base(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function gelPerUsd(): number {
  const r = parseFloat(process.env.PAYPAL_GEL_PER_USD || "2.7");
  return Number.isFinite(r) && r > 0 ? r : 2.7;
}

/** GEL → USD, rounded to 2dp. */
export function gelToUsd(gel: number): number {
  return Math.round((gel / gelPerUsd()) * 100) / 100;
}

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET || "";
  if (!id || !secret) throw new Error("PayPal not configured");
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token?: string };
  if (!res.ok || !data.access_token) throw new Error("PayPal auth failed");
  return data.access_token;
}

export async function createOrder(opts: {
  amountUsd: number;
  reference: string;
  description: string;
}): Promise<{ id: string }> {
  const token = await accessToken();
  const res = await fetch(`${base()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: opts.reference,
          description: opts.description.slice(0, 127),
          amount: { currency_code: "USD", value: opts.amountUsd.toFixed(2) },
        },
      ],
    }),
  });
  const data = (await res.json()) as { id?: string };
  if (!res.ok || !data.id) throw new Error("PayPal create-order failed");
  return { id: data.id };
}

export interface CaptureResult {
  ok: boolean;
  captureId?: string;
  amountUsd?: number;
  status?: string;
}

export async function captureOrder(orderId: string): Promise<CaptureResult> {
  const token = await accessToken();
  const res = await fetch(`${base()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json()) as {
    status?: string;
    purchase_units?: {
      payments?: { captures?: { id: string; amount?: { value: string } }[] };
    }[];
  };
  if (!res.ok || data.status !== "COMPLETED") {
    return { ok: false, status: data.status };
  }
  const cap = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    ok: true,
    captureId: cap?.id,
    amountUsd: cap?.amount ? parseFloat(cap.amount.value) : undefined,
    status: data.status,
  };
}
