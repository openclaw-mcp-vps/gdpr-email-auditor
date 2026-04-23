import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { findPaidSession } from "@/lib/database";
import { accessCookieName } from "@/lib/paywall";

export const runtime = "nodejs";

const requestSchema = z.object({
  sessionId: z.string().min(1),
  email: z.string().email().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid activation payload." }, { status: 400 });
    }

    const purchase = findPaidSession(parsed.data.sessionId, parsed.data.email);
    if (!purchase) {
      return NextResponse.json(
        {
          error:
            "Purchase not found. Wait a few seconds for webhook delivery, or ensure your session id is valid."
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(accessCookieName(), "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    response.cookies.set("gdpr_paid_email", purchase.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
