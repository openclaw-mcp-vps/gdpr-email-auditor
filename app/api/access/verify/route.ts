import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  createAccessToken,
  getAccessMaxAgeSeconds
} from "@/lib/access";
import { hasPaidAccess } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const paid = await hasPaidAccess(email);

  if (!paid) {
    return NextResponse.json(
      {
        error:
          "No completed payment found for this email yet. Complete checkout and confirm webhook delivery first."
      },
      { status: 403 }
    );
  }

  const token = createAccessToken(email);
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getAccessMaxAgeSeconds()
  });

  return response;
}
