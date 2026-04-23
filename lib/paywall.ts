import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "gdpr_paid";

export async function hasPageAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value === "1";
}

export function hasApiAccess(request: NextRequest): boolean {
  return request.cookies.get(ACCESS_COOKIE)?.value === "1";
}

export function accessCookieName(): string {
  return ACCESS_COOKIE;
}
