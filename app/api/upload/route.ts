import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import { saveDataset } from "@/lib/database";
import { hasApiAccess } from "@/lib/paywall";
import type { ConsentStatus, ContactRecord } from "@/types/audit";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

type RowRecord = Record<string, unknown>;

const fieldAliases = {
  email: ["email", "emailaddress", "email_address", "e-mail", "mail"],
  consent: [
    "consent",
    "consentstatus",
    "consent_status",
    "optin",
    "opt_in",
    "gdprconsent",
    "permission",
    "status"
  ],
  consentDate: [
    "consentdate",
    "consent_date",
    "optindate",
    "opt_in_date",
    "subscribedat",
    "permissiondate",
    "signupdate"
  ],
  source: ["source", "datasource", "data_source", "signupsource", "origin", "channel"],
  doubleOptIn: [
    "doubleoptin",
    "double_opt_in",
    "doubleoptinconfirmed",
    "doi",
    "confirmedoptin"
  ],
  region: ["region", "country", "locale", "market"]
};

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickValue(record: RowRecord, aliases: string[]): string | undefined {
  for (const [key, value] of Object.entries(record)) {
    if (!aliases.includes(normalizeKey(key))) continue;
    if (value === undefined || value === null) continue;

    const parsed = String(value).trim();
    if (!parsed) continue;
    return parsed;
  }

  return undefined;
}

function parseBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1", "confirmed"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "unconfirmed"].includes(normalized)) return false;
  return null;
}

function parseConsentStatus(value: string | undefined): ConsentStatus {
  if (!value) return "unknown";
  const normalized = value.trim().toLowerCase();
  if (["granted", "opt-in", "optin", "subscribed", "consented", "yes", "true", "1"].includes(normalized)) {
    return "granted";
  }
  if (["denied", "opt-out", "optout", "unsubscribed", "revoked", "no", "false", "0"].includes(normalized)) {
    return "denied";
  }
  return "unknown";
}

function excelSerialToIso(serial: number): string {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const ms = serial * 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + ms).toISOString();
}

function parseConsentDate(rawDate: string | undefined): string | null {
  if (!rawDate) return null;

  const asNumber = Number(rawDate);
  if (!Number.isNaN(asNumber) && asNumber > 20000) {
    return excelSerialToIso(asNumber);
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString();
}

function normalizeRow(record: RowRecord): ContactRecord | null {
  const email = pickValue(record, fieldAliases.email);
  if (!email) return null;

  const consentStatus = parseConsentStatus(pickValue(record, fieldAliases.consent));
  const consentDate = parseConsentDate(pickValue(record, fieldAliases.consentDate));
  const source = pickValue(record, fieldAliases.source) ?? null;
  const doubleOptIn = parseBoolean(pickValue(record, fieldAliases.doubleOptIn));
  const region = pickValue(record, fieldAliases.region) ?? null;

  return {
    email: email.toLowerCase(),
    consentStatus,
    consentDate,
    source,
    doubleOptIn,
    region
  };
}

function parseCsv(input: string): RowRecord[] {
  const result = Papa.parse<RowRecord>(input, {
    header: true,
    skipEmptyLines: "greedy"
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message || "CSV parsing failed.");
  }

  return result.data;
}

function parseXlsx(buffer: Buffer): RowRecord[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<RowRecord>(firstSheet, { defval: "" });
}

export async function POST(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json(
      { error: "Paid access is required. Complete checkout before uploading lists." },
      { status: 402 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload must include a file field." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum supported size is 50MB." },
        { status: 400 }
      );
    }

    const extension = file.name.toLowerCase().split(".").pop();
    const buffer = Buffer.from(await file.arrayBuffer());

    let rows: RowRecord[] = [];
    if (extension === "csv") {
      rows = parseCsv(buffer.toString("utf8"));
    } else if (extension === "xlsx" || extension === "xls") {
      rows = parseXlsx(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported format. Upload CSV, XLSX, or XLS." },
        { status: 400 }
      );
    }

    const normalized = rows.map(normalizeRow);
    const contacts = normalized.filter((entry): entry is ContactRecord => Boolean(entry));
    const droppedRows = rows.length - contacts.length;

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts were detected. Ensure your file includes an email column." },
        { status: 400 }
      );
    }

    const dataset = saveDataset(file.name, contacts);

    return NextResponse.json({
      datasetId: dataset.id,
      filename: dataset.filename,
      totalContacts: dataset.totalContacts,
      acceptedContacts: contacts.length,
      droppedRows,
      preview: contacts.slice(0, 10)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse the uploaded list.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
