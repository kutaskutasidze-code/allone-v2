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
  const data = (await res.json()) as { id?: string } & PayPalError;
  if (!res.ok || !data.id) {
    const reason = paypalReason(data);
    console.error("[paypal.createOrder] failed", {
      httpStatus: res.status,
      reason,
      debugId: data.debug_id,
    });
    throw new Error(`PayPal create-order failed: ${reason}`);
  }
  return { id: data.id };
}

// PayPal surfaces failure detail in a consistent shape — capture it so a
// decline can be diagnosed from logs instead of a generic "failed".
interface PayPalError {
  name?: string;
  message?: string;
  debug_id?: string;
  details?: { issue?: string; description?: string }[];
}

export function paypalReason(d: PayPalError): string {
  const detail = d.details?.[0];
  return (
    detail?.issue || detail?.description || d.message || d.name || "unknown"
  );
}

export interface CaptureResult {
  ok: boolean;
  captureId?: string;
  amountUsd?: number;
  status?: string;
  /** PayPal failure reason (issue/message), populated when ok=false. */
  reason?: string;
  /** PayPal debug_id — quote this to PayPal support to trace a failed call. */
  debugId?: string;
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
  } & PayPalError;
  if (!res.ok || data.status !== "COMPLETED") {
    const reason = paypalReason(data);
    console.error("[paypal.captureOrder] not completed", {
      orderId,
      httpStatus: res.status,
      status: data.status,
      reason,
      debugId: data.debug_id,
    });
    return { ok: false, status: data.status, reason, debugId: data.debug_id };
  }
  const cap = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    ok: true,
    captureId: cap?.id,
    amountUsd: cap?.amount ? parseFloat(cap.amount.value) : undefined,
    status: data.status,
  };
}

// Verify an inbound PayPal webhook against PAYPAL_WEBHOOK_ID. Fails closed: if
// the webhook id is unset or PayPal doesn't return SUCCESS, returns false so the
// route can reject. This is what stops a forged "payment completed" POST.
export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  try {
    const token = await accessToken();
    const res = await fetch(
      `${base()}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: headers.get("paypal-auth-algo"),
          cert_url: headers.get("paypal-cert-url"),
          transmission_id: headers.get("paypal-transmission-id"),
          transmission_sig: headers.get("paypal-transmission-sig"),
          transmission_time: headers.get("paypal-transmission-time"),
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody),
        }),
      },
    );
    const data = (await res.json()) as { verification_status?: string };
    return res.ok && data.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[paypal.verifyWebhookSignature] failed", err);
    return false;
  }
}
