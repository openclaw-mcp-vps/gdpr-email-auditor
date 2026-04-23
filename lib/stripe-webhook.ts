import { createHmac, timingSafeEqual } from "crypto";

interface StripeEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  data: {
    object: T;
  };
}

function parseStripeSignature(header: string): { timestamp: string; signatures: string[] } {
  const parts = header.split(",").map((part) => part.trim());
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t" && value) {
      timestamp = value;
    }
    if (key === "v1" && value) {
      signatures.push(value);
    }
  }

  return { timestamp, signatures };
}

export function verifyStripeWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string;
  webhookSecret: string;
}): boolean {
  const { timestamp, signatures } = parseStripeSignature(params.signatureHeader);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${params.rawBody}`;
  const expectedSignature = createHmac("sha256", params.webhookSecret)
    .update(signedPayload)
    .digest("hex");

  return signatures.some((incomingSignature) => {
    const incoming = Buffer.from(incomingSignature, "utf8");
    const expected = Buffer.from(expectedSignature, "utf8");

    if (incoming.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(incoming, expected);
  });
}

export function parseStripeEvent<T = Record<string, unknown>>(rawBody: string): StripeEvent<T> {
  return JSON.parse(rawBody) as StripeEvent<T>;
}
