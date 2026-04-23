import { randomUUID } from "crypto";
import postgres from "postgres";
import type { AuditResult, AuditSummary, ContactFinding } from "@/lib/gdpr-scanner";

type AuditRecord = {
  id: string;
  fileName: string;
  summary: AuditSummary;
  recommendations: string[];
  generatedAt: string;
  createdAt: string;
  contacts: ContactFinding[];
};

type PurchaseRecordInput = {
  email: string;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  status: string;
  amountTotal?: number | null;
  currency?: string | null;
  purchasedAt: string;
};

type AuditListItem = {
  id: string;
  fileName: string;
  createdAt: string;
  complianceScore: number;
  totalContacts: number;
  criticalContacts: number;
};

const connectionString = process.env.DATABASE_URL;

const sql = connectionString
  ? postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    })
  : null;

const memoryStore = globalThis as typeof globalThis & {
  __GDPR_AUDITOR_MEMORY__?: {
    audits: AuditRecord[];
    purchases: Map<string, PurchaseRecordInput>;
  };
};

if (!memoryStore.__GDPR_AUDITOR_MEMORY__) {
  memoryStore.__GDPR_AUDITOR_MEMORY__ = {
    audits: [],
    purchases: new Map()
  };
}

const inMemoryAudits = memoryStore.__GDPR_AUDITOR_MEMORY__.audits;
const inMemoryPurchases = memoryStore.__GDPR_AUDITOR_MEMORY__.purchases;

let schemaReady = false;

async function ensureSchema() {
  if (!sql || schemaReady) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      total_contacts INTEGER NOT NULL,
      compliant_contacts INTEGER NOT NULL,
      warning_contacts INTEGER NOT NULL,
      critical_contacts INTEGER NOT NULL,
      suppress_immediately INTEGER NOT NULL,
      reconfirm_consent INTEGER NOT NULL,
      compliance_score INTEGER NOT NULL,
      estimated_fine_exposure_eur INTEGER NOT NULL,
      recommendations JSONB NOT NULL,
      generated_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_contacts (
      id BIGSERIAL PRIMARY KEY,
      audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
      row_number INTEGER NOT NULL,
      email TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      reasons TEXT[] NOT NULL,
      recommendation TEXT NOT NULL,
      consent_date TIMESTAMPTZ,
      consent_source TEXT,
      double_opt_in BOOLEAN,
      consent_proof TEXT,
      unsubscribed BOOLEAN NOT NULL DEFAULT FALSE,
      raw JSONB NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS purchases (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      checkout_session_id TEXT,
      payment_intent_id TEXT,
      status TEXT NOT NULL,
      amount_total INTEGER,
      currency TEXT,
      purchased_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  schemaReady = true;
}

export async function saveAudit(fileName: string, result: AuditResult) {
  if (!sql) {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    inMemoryAudits.unshift({
      id,
      fileName,
      summary: result.summary,
      recommendations: result.recommendations,
      generatedAt: result.generatedAt,
      createdAt,
      contacts: result.contacts
    });

    return id;
  }

  await ensureSchema();

  const id = randomUUID();

  await sql.begin(async (trx) => {
    await trx`
      INSERT INTO audits (
        id,
        file_name,
        total_contacts,
        compliant_contacts,
        warning_contacts,
        critical_contacts,
        suppress_immediately,
        reconfirm_consent,
        compliance_score,
        estimated_fine_exposure_eur,
        recommendations,
        generated_at
      )
      VALUES (
        ${id},
        ${fileName},
        ${result.summary.totalContacts},
        ${result.summary.compliantContacts},
        ${result.summary.warningContacts},
        ${result.summary.criticalContacts},
        ${result.summary.suppressImmediately},
        ${result.summary.reconfirmConsent},
        ${result.summary.complianceScore},
        ${result.summary.estimatedFineExposureEUR},
        ${JSON.stringify(result.recommendations)},
        ${result.generatedAt}
      )
    `;

    for (const contact of result.contacts) {
      await trx`
        INSERT INTO audit_contacts (
          audit_id,
          row_number,
          email,
          risk_level,
          reasons,
          recommendation,
          consent_date,
          consent_source,
          double_opt_in,
          consent_proof,
          unsubscribed,
          raw
        )
        VALUES (
          ${id},
          ${contact.rowNumber},
          ${contact.email},
          ${contact.riskLevel},
          ${contact.reasons},
          ${contact.recommendation},
          ${contact.consentDate},
          ${contact.consentSource},
          ${contact.doubleOptIn},
          ${contact.consentProof},
          ${contact.unsubscribed},
          ${JSON.stringify(contact.raw)}
        )
      `;
    }
  });

  return id;
}

export async function getRecentAudits(limit = 10): Promise<AuditListItem[]> {
  if (!sql) {
    return inMemoryAudits.slice(0, limit).map((audit) => ({
      id: audit.id,
      fileName: audit.fileName,
      createdAt: audit.createdAt,
      complianceScore: audit.summary.complianceScore,
      totalContacts: audit.summary.totalContacts,
      criticalContacts: audit.summary.criticalContacts
    }));
  }

  await ensureSchema();

  const rows = await sql<
    {
      id: string;
      file_name: string;
      created_at: Date | string;
      compliance_score: number;
      total_contacts: number;
      critical_contacts: number;
    }[]
  >`
    SELECT id, file_name, created_at, compliance_score, total_contacts, critical_contacts
    FROM audits
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    createdAt: new Date(row.created_at).toISOString(),
    complianceScore: row.compliance_score,
    totalContacts: row.total_contacts,
    criticalContacts: row.critical_contacts
  }));
}

export async function getAuditById(id: string): Promise<AuditRecord | null> {
  if (!sql) {
    return inMemoryAudits.find((audit) => audit.id === id) ?? null;
  }

  await ensureSchema();

  const audits = await sql<
    {
      id: string;
      file_name: string;
      total_contacts: number;
      compliant_contacts: number;
      warning_contacts: number;
      critical_contacts: number;
      suppress_immediately: number;
      reconfirm_consent: number;
      compliance_score: number;
      estimated_fine_exposure_eur: number;
      recommendations: string[];
      generated_at: Date | string;
      created_at: Date | string;
    }[]
  >`
    SELECT
      id,
      file_name,
      total_contacts,
      compliant_contacts,
      warning_contacts,
      critical_contacts,
      suppress_immediately,
      reconfirm_consent,
      compliance_score,
      estimated_fine_exposure_eur,
      recommendations,
      generated_at,
      created_at
    FROM audits
    WHERE id = ${id}
    LIMIT 1
  `;

  const audit = audits[0];
  if (!audit) {
    return null;
  }

  const contacts = await sql<
    {
      row_number: number;
      email: string;
      risk_level: "compliant" | "warning" | "critical";
      reasons: string[];
      recommendation: string;
      consent_date: Date | string | null;
      consent_source: string | null;
      double_opt_in: boolean | null;
      consent_proof: string | null;
      unsubscribed: boolean;
      raw: Record<string, unknown>;
    }[]
  >`
    SELECT
      row_number,
      email,
      risk_level,
      reasons,
      recommendation,
      consent_date,
      consent_source,
      double_opt_in,
      consent_proof,
      unsubscribed,
      raw
    FROM audit_contacts
    WHERE audit_id = ${id}
    ORDER BY row_number ASC
  `;

  return {
    id: audit.id,
    fileName: audit.file_name,
    summary: {
      totalContacts: audit.total_contacts,
      compliantContacts: audit.compliant_contacts,
      warningContacts: audit.warning_contacts,
      criticalContacts: audit.critical_contacts,
      suppressImmediately: audit.suppress_immediately,
      reconfirmConsent: audit.reconfirm_consent,
      complianceScore: audit.compliance_score,
      estimatedFineExposureEUR: audit.estimated_fine_exposure_eur
    },
    recommendations: audit.recommendations,
    generatedAt: new Date(audit.generated_at).toISOString(),
    createdAt: new Date(audit.created_at).toISOString(),
    contacts: contacts.map((contact) => ({
      rowNumber: contact.row_number,
      email: contact.email,
      riskLevel: contact.risk_level,
      reasons: contact.reasons,
      recommendation: contact.recommendation,
      consentDate: contact.consent_date ? new Date(contact.consent_date).toISOString() : null,
      consentSource: contact.consent_source,
      doubleOptIn: contact.double_opt_in,
      consentProof: contact.consent_proof,
      unsubscribed: contact.unsubscribed,
      raw: contact.raw
    }))
  };
}

export async function recordStripePurchase(input: PurchaseRecordInput) {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!sql) {
    inMemoryPurchases.set(normalizedEmail, {
      ...input,
      email: normalizedEmail
    });
    return;
  }

  await ensureSchema();

  await sql`
    INSERT INTO purchases (
      email,
      checkout_session_id,
      payment_intent_id,
      status,
      amount_total,
      currency,
      purchased_at,
      updated_at
    )
    VALUES (
      ${normalizedEmail},
      ${input.checkoutSessionId ?? null},
      ${input.paymentIntentId ?? null},
      ${input.status},
      ${input.amountTotal ?? null},
      ${input.currency ?? null},
      ${input.purchasedAt},
      NOW()
    )
    ON CONFLICT (email)
    DO UPDATE SET
      checkout_session_id = EXCLUDED.checkout_session_id,
      payment_intent_id = EXCLUDED.payment_intent_id,
      status = EXCLUDED.status,
      amount_total = EXCLUDED.amount_total,
      currency = EXCLUDED.currency,
      purchased_at = EXCLUDED.purchased_at,
      updated_at = NOW()
  `;
}

export async function hasPaidAccess(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!sql) {
    return inMemoryPurchases.has(normalizedEmail);
  }

  await ensureSchema();

  const rows = await sql<{ email: string }[]>`
    SELECT email FROM purchases WHERE email = ${normalizedEmail} AND status IN ('paid', 'complete', 'active')
    LIMIT 1
  `;

  return rows.length > 0;
}
