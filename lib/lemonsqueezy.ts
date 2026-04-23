import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const stripeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created: z.number().optional(),
  data: z.object({
    object: z.record(z.string(), z.any())
  })
});

export type StripeEvent = z.infer<typeof stripeEventSchema>;

function parseSignatureHeader(signatureHeader: string): {
  timestamp: string | null;
  signatures: string[];
} {
  const parts = signatureHeader.split(",").map((segment) => segment.trim());
  let timestamp: string | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }

  return { timestamp, signatures };
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const { timestamp, signatures } = parseSignatureHeader(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  const expectedBuffer = Buffer.from(expected);

  const isMatch = signatures.some((signature) => {
    const candidate = Buffer.from(signature);
    if (candidate.length !== expectedBuffer.length) return false;
    return timingSafeEqual(candidate, expectedBuffer);
  });

  const timestampSeconds = Number(timestamp);
  const toleranceSeconds = 300;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);

  return isMatch && ageSeconds <= toleranceSeconds;
}

export function parseStripeEvent(payload: string): StripeEvent {
  const parsed = JSON.parse(payload);
  return stripeEventSchema.parse(parsed);
}
