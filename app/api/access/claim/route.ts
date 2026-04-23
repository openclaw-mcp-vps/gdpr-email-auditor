import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasPaidCustomer } from "@/lib/database";
import { setAccessCookie } from "@/lib/paywall";

const claimSchema = z.object({
  email: z.string().email(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  if (!hasPaidCustomer(normalizedEmail)) {
    return NextResponse.json(
      {
        error:
          "No paid purchase found for this email yet. If you just completed checkout, wait a minute and try again.",
      },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ ok: true });
  setAccessCookie(response, normalizedEmail);
  return response;
}
