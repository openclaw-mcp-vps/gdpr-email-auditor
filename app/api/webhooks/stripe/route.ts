import { NextRequest, NextResponse } from "next/server";
import { registerWebhookEvent, upsertPaidCustomer } from "@/lib/database";
import {
  parseStripeEvent,
  verifyStripeWebhookSignature,
} from "@/lib/stripe-webhook";

export const runtime = "nodejs";

type StripeCheckoutSession = {
  id: string;
  payment_status?: string;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
};

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET configuration." },
      { status: 500 }
    );
  }

  const signatureHeader = request.headers.get("stripe-signature");
  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  const isValid = verifyStripeWebhookSignature({
    rawBody,
    signatureHeader,
    webhookSecret,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = parseStripeEvent<StripeCheckoutSession>(rawBody);

  const firstTimeEvent = registerWebhookEvent(event.id, event.type);
  if (!firstTimeEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;

    if (email && session.payment_status === "paid") {
      upsertPaidCustomer({
        email,
        stripeSessionId: session.id,
        status: "paid",
        eventId: event.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
