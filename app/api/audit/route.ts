import { NextRequest, NextResponse } from "next/server";
import { parseUploadedFile } from "@/lib/email-parser";
import { analyzeGdprCompliance } from "@/lib/gdpr-analyzer";
import { saveAuditReport } from "@/lib/database";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@/lib/paywall";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const access = verifyAccessToken(accessToken);

  if (!access) {
    return NextResponse.json(
      { error: "Paid access required. Complete checkout to unlock audits." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const parsed = parseUploadedFile({
      fileName: file.name,
      mimeType: file.type,
      buffer,
    });

    const report = analyzeGdprCompliance({
      fileName: file.name,
      contacts: parsed.contacts,
      parserNotes: parsed.parserNotes,
    });

    saveAuditReport(report);

    return NextResponse.json({
      auditId: report.id,
      summary: report.summary,
      findingsCount: report.findings.length,
      recommendations: report.recommendations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit processing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
