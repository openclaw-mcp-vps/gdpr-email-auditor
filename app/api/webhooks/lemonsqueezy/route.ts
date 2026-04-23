import { NextResponse, type NextRequest } from "next/server";

import { upsertPaidSession } from "@/lib/database";
import { parseStripeEvent, verifyStripeWebhookSignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    const event = parseStripeEvent(payload);

    if (event.type === "checkout.session.completed") {
      const stripeObject = event.data.object as {
        id?: string;
        customer_email?: string;
        customer_details?: { email?: string };
        amount_total?: number;
        currency?: string;
      };

      const sessionId = String(stripeObject.id ?? "");
      const customerEmail =
        String(stripeObject.customer_details?.email ?? stripeObject.customer_email ?? "") || "";

      if (!sessionId || !customerEmail) {
        return NextResponse.json({ error: "Session payload is missing id or email." }, { status: 400 });
      }

      upsertPaidSession({
        sessionId,
        email: customerEmail,
        paidAt: new Date().toISOString(),
        amountTotal: typeof stripeObject.amount_total === "number" ? stripeObject.amount_total : null,
        currency:
          typeof stripeObject.currency === "string" ? stripeObject.currency.toUpperCase() : null
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook parse failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
