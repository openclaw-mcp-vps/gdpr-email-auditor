import { NextRequest, NextResponse } from "next/server";
import { parseUploadedFile } from "@/lib/email-parser";
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
    const result = parseUploadedFile({
      fileName: file.name,
      mimeType: file.type,
      buffer,
    });

    return NextResponse.json({
      fileName: file.name,
      totalRows: result.totalRows,
      detectedColumns: result.detectedColumns,
      parserNotes: result.parserNotes,
      preview: result.contacts.slice(0, 12).map((contact) => ({
        email: contact.email,
        consentGiven: contact.consentGiven,
        consentDate: contact.consentDate,
        consentSource: contact.consentSource,
        doubleOptIn: contact.doubleOptIn,
        country: contact.country,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse uploaded file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
