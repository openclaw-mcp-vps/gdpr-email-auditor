import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ACCESS_COOKIE_NAME, hasValidAccessToken } from "@/lib/access";
import { saveAudit } from "@/lib/db";
import { runGdprAudit, type RawContactRow } from "@/lib/gdpr-scanner";

export const runtime = "nodejs";

function parseCsv(text: string): RawContactRow[] {
  const parsed = Papa.parse<RawContactRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "CSV parsing failed.");
  }

  return parsed.data.filter((row) => Object.values(row).some((value) => String(value ?? "").trim().length > 0));
}

function parseExcel(buffer: ArrayBuffer): RawContactRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<RawContactRow>(sheet, {
    defval: "",
    raw: false
  });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!hasValidAccessToken(token)) {
    return NextResponse.json({ error: "Paid access required." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File is too large. Use files up to 15MB." },
      { status: 400 }
    );
  }

  const fileName = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  let rows: RawContactRow[];

  if (fileName.endsWith(".csv")) {
    rows = parseCsv(Buffer.from(buffer).toString("utf8"));
  } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    rows = parseExcel(buffer);
  } else {
    return NextResponse.json(
      { error: "Unsupported file format. Upload CSV, XLS, or XLSX." },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No contact rows detected in file." },
      { status: 400 }
    );
  }

  const audit = runGdprAudit(rows);
  const auditId = await saveAudit(file.name, audit);

  return NextResponse.json({
    auditId,
    summary: audit.summary,
    generatedAt: audit.generatedAt
  });
}
