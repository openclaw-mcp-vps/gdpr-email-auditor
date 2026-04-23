import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "gdpr_auditor_access";
const ACCESS_TTL_SECONDS = 60 * 60 * 24 * 30;

interface AccessPayload {
  email: string;
  exp: number;
}

function getAccessSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "local-dev-secret-change-me";
}

function base64urlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getAccessSecret()).update(encodedPayload).digest("hex");
}

export function createAccessToken(email: string): string {
  const payload: AccessPayload = {
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS,
  };
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token?: string | null): AccessPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const incoming = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (incoming.length !== expected.length) {
    return null;
  }

  if (!timingSafeEqual(incoming, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as AccessPayload;
    if (!payload.email || !payload.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setAccessCookie(response: NextResponse, email: string): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: createAccessToken(email),
    httpOnly: true,
    maxAge: ACCESS_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
}

export async function hasAccessCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  return !!verifyAccessToken(token);
}

export async function requirePaidAccessForPage(): Promise<AccessPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const payload = verifyAccessToken(token);

  if (!payload) {
    redirect("/?paywall=1");
  }

  return payload;
}
