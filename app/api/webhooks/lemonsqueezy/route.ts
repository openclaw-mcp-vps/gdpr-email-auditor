import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordStripePurchase } from "@/lib/db";

export const runtime = "nodejs";

type StripeEvent = {
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
};

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseStripeSignature(header: string) {
  const parts = header.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const v1Part = parts.find((part) => part.startsWith("v1="));

  if (!timestampPart || !v1Part) {
    return null;
  }

  return {
    timestamp: timestampPart.replace("t=", ""),
    signature: v1Part.replace("v1=", "")
  };
}

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) {
    return false;
  }

  const timestamp = Number(parsed.timestamp);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  if (expected.length !== parsed.signature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.signature));
}

async function handleCheckoutSessionCompleted(object: Record<string, unknown>) {
  const email =
    getString(object.customer_email) ??
    getString((object.customer_details as Record<string, unknown> | undefined)?.email);

  if (!email) {
    return;
  }

  const createdEpoch = getNumber(object.created);

  await recordStripePurchase({
    email,
    checkoutSessionId: getString(object.id),
    paymentIntentId: getString(object.payment_intent),
    status: getString(object.payment_status) ?? "paid",
    amountTotal: getNumber(object.amount_total),
    currency: getString(object.currency),
    purchasedAt: createdEpoch ? new Date(createdEpoch * 1000).toISOString() : new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 500 });
  }

  const signatureHeader = request.headers.get("stripe-signature");
  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing Stripe signature header." }, { status: 400 });
  }

  const rawBody = await request.text();

  if (!verifyStripeSignature(rawBody, signatureHeader, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  const object = event.data?.object;

  if (!object) {
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await handleCheckoutSessionCompleted(object);
  }

  return NextResponse.json({ received: true });
}
