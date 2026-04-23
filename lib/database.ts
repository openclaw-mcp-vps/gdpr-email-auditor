import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { AuditListItem, AuditReport } from "@/lib/types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "gdpr-email-auditor.db");

let dbInstance: Database.Database | null = null;

function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_contacts INTEGER NOT NULL,
      high_risk_contacts INTEGER NOT NULL,
      missing_consent_contacts INTEGER NOT NULL,
      report_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchases (
      email TEXT PRIMARY KEY,
      stripe_session_id TEXT,
      purchased_at TEXT NOT NULL,
      status TEXT NOT NULL,
      last_event_id TEXT
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      received_at TEXT NOT NULL
    );
  `);

  dbInstance = db;
  return db;
}

export function saveAuditReport(report: AuditReport): void {
  const db = getDatabase();
  db.prepare(
    `
      INSERT INTO audits (
        id,
        file_name,
        created_at,
        score,
        total_contacts,
        high_risk_contacts,
        missing_consent_contacts,
        report_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    report.id,
    report.fileName,
    report.createdAt,
    report.summary.score,
    report.summary.totalContacts,
    report.summary.highRiskContacts,
    report.summary.missingConsentContacts,
    JSON.stringify(report)
  );
}

export function listAuditReports(limit = 25): AuditListItem[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
        SELECT id, file_name, created_at, score, total_contacts, high_risk_contacts, missing_consent_contacts
        FROM audits
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `
    )
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id ?? ""),
    fileName: String(row.file_name ?? ""),
    createdAt: String(row.created_at ?? ""),
    score: Number(row.score ?? 0),
    totalContacts: Number(row.total_contacts ?? 0),
    highRiskContacts: Number(row.high_risk_contacts ?? 0),
    missingConsentContacts: Number(row.missing_consent_contacts ?? 0),
  }));
}

export function getAuditReportById(id: string): AuditReport | null {
  const db = getDatabase();
  const row = db
    .prepare(
      `
        SELECT report_json
        FROM audits
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!row || typeof row.report_json !== "string") {
    return null;
  }

  return JSON.parse(row.report_json) as AuditReport;
}

export function registerWebhookEvent(eventId: string, eventType: string): boolean {
  const db = getDatabase();
  const inserted = db
    .prepare(
      `
        INSERT OR IGNORE INTO webhook_events (event_id, event_type, received_at)
        VALUES (?, ?, ?)
      `
    )
    .run(eventId, eventType, new Date().toISOString());

  return inserted.changes > 0;
}

export function upsertPaidCustomer(params: {
  email: string;
  stripeSessionId?: string | null;
  status: string;
  eventId?: string | null;
}): void {
  const db = getDatabase();
  db.prepare(
    `
      INSERT INTO purchases (
        email,
        stripe_session_id,
        purchased_at,
        status,
        last_event_id
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        stripe_session_id = excluded.stripe_session_id,
        purchased_at = excluded.purchased_at,
        status = excluded.status,
        last_event_id = excluded.last_event_id
    `
  ).run(
    params.email.toLowerCase(),
    params.stripeSessionId || null,
    new Date().toISOString(),
    params.status,
    params.eventId || null
  );
}

export function hasPaidCustomer(email: string): boolean {
  const db = getDatabase();
  const row = db
    .prepare(
      `
        SELECT status
        FROM purchases
        WHERE email = ?
        LIMIT 1
      `
    )
    .get(email.toLowerCase()) as Record<string, unknown> | undefined;

  if (!row) {
    return false;
  }

  return String(row.status ?? "").toLowerCase() === "paid";
}
