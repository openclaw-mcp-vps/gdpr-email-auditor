import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, hasValidAccessToken } from "@/lib/access";
import { getAuditById, saveAudit } from "@/lib/db";
import { runGdprAudit, type RawContactRow } from "@/lib/gdpr-scanner";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Paid access required." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!hasValidAccessToken(token)) {
    return unauthorized();
  }

  const auditId = request.nextUrl.searchParams.get("id");
  if (!auditId) {
    return NextResponse.json({ error: "Provide audit id query parameter." }, { status: 400 });
  }

  const audit = await getAuditById(auditId);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }

  return NextResponse.json({ audit });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!hasValidAccessToken(token)) {
    return unauthorized();
  }

  const body = (await request.json()) as {
    fileName?: string;
    contacts?: RawContactRow[];
  };

  if (!Array.isArray(body.contacts) || body.contacts.length === 0) {
    return NextResponse.json(
      { error: "Provide a non-empty contacts array." },
      { status: 400 }
    );
  }

  const result = runGdprAudit(body.contacts);
  const auditId = await saveAudit(body.fileName ?? "api-import.json", result);

  return NextResponse.json({
    auditId,
    summary: result.summary,
    recommendations: result.recommendations,
    generatedAt: result.generatedAt
  });
}
