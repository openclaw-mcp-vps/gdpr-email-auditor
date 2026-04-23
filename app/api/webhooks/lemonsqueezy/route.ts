import { NextResponse } from "next/server";
import { LEMONSQUEEZY_DEPRECATED_MESSAGE } from "@/lib/lemonsqueezy";

export function POST() {
  return NextResponse.json(
    {
      error: LEMONSQUEEZY_DEPRECATED_MESSAGE,
      migration: "Use /api/webhooks/stripe with Stripe Payment Link checkout events.",
    },
    { status: 410 }
  );
}
