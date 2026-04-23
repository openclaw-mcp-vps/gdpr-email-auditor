import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ParsedContact, ParsedFileResult } from "@/lib/types";

const FIELD_ALIASES: Record<Exclude<keyof ParsedContact, "raw">, string[]> = {
  email: ["email", "emailaddress", "e-mail", "mail"],
  firstName: ["firstname", "first", "givenname", "fname"],
  lastName: ["lastname", "last", "surname", "lname"],
  consentGiven: [
    "consent",
    "consentgiven",
    "gdprconsent",
    "optin",
    "opt_in",
    "permission",
  ],
  consentDate: [
    "consentdate",
    "optindate",
    "permissiondate",
    "subscribedat",
    "signupdate",
  ],
  consentSource: [
    "consentsource",
    "optinsource",
    "source",
    "signupsource",
    "consentmethod",
  ],
  doubleOptIn: ["doubleoptin", "double_opt_in", "doi", "confirmedoptin"],
  country: ["country", "countrycode", "region", "locale"],
  lastEngagementDate: [
    "lastengagementdate",
    "lastopened",
    "lastclick",
    "lastactive",
    "lastactivity",
  ],
  unsubscribed: ["unsubscribed", "optout", "opt_out", "suppressed", "blacklisted"],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeHeader(key);
    if (normalizedKey) {
      normalized[normalizedKey] = value;
    }
  }
  return normalized;
}

function pickField<T>(
  field: Exclude<keyof ParsedContact, "raw">,
  row: Record<string, unknown>
): T | null {
  for (const candidate of FIELD_ALIASES[field]) {
    if (candidate in row) {
      return row[candidate] as T;
    }
  }
  return null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
}

function toNullableBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "yes", "y", "1", "opted in", "subscribed"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "n", "0", "opted out", "unsubscribed"].includes(normalized)) {
    return false;
  }
  return null;
}

function excelSerialToDate(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1) {
    return null;
  }
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function toNullableDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    return excelSerialToDate(value);
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return null;
  }

  const date = new Date(stringValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function normalizeContact(rawRow: Record<string, unknown>): ParsedContact {
  const row = normalizeRowKeys(rawRow);

  return {
    email: (toNullableString(pickField("email", row)) || "").toLowerCase(),
    firstName: toNullableString(pickField("firstName", row)),
    lastName: toNullableString(pickField("lastName", row)),
    consentGiven: toNullableBoolean(pickField("consentGiven", row)),
    consentDate: toNullableDate(pickField("consentDate", row)),
    consentSource: toNullableString(pickField("consentSource", row)),
    doubleOptIn: toNullableBoolean(pickField("doubleOptIn", row)),
    country: toNullableString(pickField("country", row)),
    lastEngagementDate: toNullableDate(pickField("lastEngagementDate", row)),
    unsubscribed: toNullableBoolean(pickField("unsubscribed", row)),
    raw: Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [
        key,
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? value
          : value === null || value === undefined
            ? null
            : String(value),
      ])
    ),
  };
}

function parseCsv(buffer: Buffer): Record<string, unknown>[] {
  const csv = buffer.toString("utf8");
  const result = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    const message = result.errors[0]?.message || "Unable to parse CSV file";
    throw new Error(message);
  }

  return result.data;
}

function parseSpreadsheet(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("The spreadsheet does not contain any sheets.");
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });
}

function isLikelySpreadsheet(fileName: string, mimeType?: string): boolean {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return true;
  }
  return (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  );
}

export function parseUploadedFile(input: {
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
}): ParsedFileResult {
  const rows = isLikelySpreadsheet(input.fileName, input.mimeType)
    ? parseSpreadsheet(input.buffer)
    : parseCsv(input.buffer);

  if (rows.length === 0) {
    throw new Error("The uploaded file is empty.");
  }

  const contacts = rows.map((row) => normalizeContact(row));

  const detectedColumns = Object.keys(rows[0] || {});
  const parserNotes: string[] = [];

  const contactsWithoutEmail = contacts.filter((contact) => !contact.email).length;
  if (contactsWithoutEmail > 0) {
    parserNotes.push(
      `${contactsWithoutEmail} rows do not include an email value and were marked as invalid.`
    );
  }

  const contactsWithoutConsentMetadata = contacts.filter(
    (contact) =>
      contact.consentGiven === true && (!contact.consentDate || !contact.consentSource)
  ).length;
  if (contactsWithoutConsentMetadata > 0) {
    parserNotes.push(
      `${contactsWithoutConsentMetadata} contacts indicate consent but are missing consent date or source metadata.`
    );
  }

  return {
    contacts,
    totalRows: rows.length,
    detectedColumns,
    parserNotes,
  };
}
