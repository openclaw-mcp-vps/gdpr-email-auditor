import { formatISO } from "date-fns";

export type RiskLevel = "compliant" | "warning" | "critical";

export type RawContactRow = Record<string, unknown>;

export type ContactFinding = {
  rowNumber: number;
  email: string;
  riskLevel: RiskLevel;
  reasons: string[];
  recommendation: string;
  consentDate: string | null;
  consentSource: string | null;
  doubleOptIn: boolean | null;
  consentProof: string | null;
  unsubscribed: boolean;
  raw: RawContactRow;
};

export type AuditSummary = {
  totalContacts: number;
  compliantContacts: number;
  warningContacts: number;
  criticalContacts: number;
  suppressImmediately: number;
  reconfirmConsent: number;
  complianceScore: number;
  estimatedFineExposureEUR: number;
};

export type AuditResult = {
  summary: AuditSummary;
  contacts: ContactFinding[];
  recommendations: string[];
  generatedAt: string;
};

const EMAIL_KEYS = ["email", "e-mail", "email_address", "email address", "mail"];
const CONSENT_DATE_KEYS = [
  "consent_date",
  "consent date",
  "opt_in_date",
  "opt in date",
  "signup_date",
  "created_at",
  "permission_timestamp",
  "timestamp"
];
const CONSENT_SOURCE_KEYS = [
  "consent_source",
  "consent source",
  "opt_in_source",
  "opt in source",
  "source",
  "signup_source",
  "form_name",
  "campaign"
];
const DOUBLE_OPT_IN_KEYS = ["double_opt_in", "double opt in", "doi", "confirmed_opt_in"];
const CONSENT_PROOF_KEYS = [
  "consent_proof",
  "proof",
  "proof_id",
  "ip_address",
  "ip",
  "user_agent",
  "proof_reference"
];
const UNSUBSCRIBED_KEYS = ["unsubscribed", "opt_out", "suppressed", "do_not_contact"];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function normalizeKeys(row: RawContactRow) {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim().toLowerCase()] = value;
  }
  return normalized;
}

function readText(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) {
      continue;
    }

    const text = String(value).trim();
    if (text.length > 0) {
      return text;
    }
  }

  return null;
}

function readBoolean(row: Record<string, unknown>, keys: string[]) {
  const value = readText(row, keys);
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "y", "confirmed"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "pending", "unconfirmed"].includes(normalized)) {
    return false;
  }

  return null;
}

function toIsoDate(dateText: string | null) {
  if (!dateText) {
    return null;
  }

  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatISO(parsed);
}

function assessContact(row: RawContactRow, rowNumber: number): ContactFinding {
  const normalizedRow = normalizeKeys(row);
  const email = readText(normalizedRow, EMAIL_KEYS) ?? "";
  const consentDateText = readText(normalizedRow, CONSENT_DATE_KEYS);
  const consentDate = toIsoDate(consentDateText);
  const consentSource = readText(normalizedRow, CONSENT_SOURCE_KEYS);
  const doubleOptIn = readBoolean(normalizedRow, DOUBLE_OPT_IN_KEYS);
  const consentProof = readText(normalizedRow, CONSENT_PROOF_KEYS);
  const unsubscribed = readBoolean(normalizedRow, UNSUBSCRIBED_KEYS) === true;

  const criticalReasons: string[] = [];
  const warningReasons: string[] = [];

  if (!email || !emailPattern.test(email)) {
    criticalReasons.push("Invalid or missing email address.");
  }

  if (!consentDateText) {
    criticalReasons.push("No consent timestamp found.");
  } else if (!consentDate) {
    criticalReasons.push("Consent timestamp exists but is not a valid date.");
  } else if (new Date(consentDate) > new Date(Date.now() + 24 * 60 * 60 * 1000)) {
    warningReasons.push("Consent date is in the future and likely incorrect.");
  }

  if (!consentSource) {
    criticalReasons.push("Missing consent collection source (form/page/campaign). ");
  }

  if (!consentProof) {
    warningReasons.push("No consent proof metadata (IP, user agent, or proof ID).");
  }

  if (doubleOptIn === false) {
    warningReasons.push("Double opt-in is marked as not confirmed.");
  }

  if (doubleOptIn === null) {
    warningReasons.push("Double opt-in status is missing.");
  }

  if (unsubscribed) {
    criticalReasons.push("Contact is unsubscribed but still appears in the sendable list.");
  }

  const riskLevel: RiskLevel =
    criticalReasons.length > 0 ? "critical" : warningReasons.length > 0 ? "warning" : "compliant";

  const reasons = riskLevel === "critical" ? criticalReasons.concat(warningReasons) : warningReasons;

  const recommendation =
    riskLevel === "critical"
      ? "Suppress from campaigns now. Re-permission this contact before any further marketing emails."
      : riskLevel === "warning"
        ? "Keep contact paused for high-risk campaigns until consent evidence is completed."
        : "Consent record looks complete. Keep in active segment and retain evidence logs.";

  return {
    rowNumber,
    email,
    riskLevel,
    reasons,
    recommendation,
    consentDate,
    consentSource,
    doubleOptIn,
    consentProof,
    unsubscribed,
    raw: row
  };
}

export function runGdprAudit(rows: RawContactRow[]): AuditResult {
  const contacts = rows.map((row, index) => assessContact(row, index + 2));

  const compliantContacts = contacts.filter((item) => item.riskLevel === "compliant").length;
  const warningContacts = contacts.filter((item) => item.riskLevel === "warning").length;
  const criticalContacts = contacts.filter((item) => item.riskLevel === "critical").length;

  const suppressImmediately = contacts.filter(
    (item) => item.riskLevel === "critical" || item.unsubscribed
  ).length;
  const reconfirmConsent = contacts.filter((item) => item.riskLevel === "warning").length;

  const denominator = contacts.length === 0 ? 1 : contacts.length;
  const weighted = compliantContacts + warningContacts * 0.5;
  const complianceScore = Math.max(0, Math.min(100, Math.round((weighted / denominator) * 100)));

  const estimatedFineExposureEUR =
    criticalContacts * 650 + warningContacts * 150 + Math.ceil(Math.max(contacts.length - 1000, 0) * 0.5);

  const recommendations: string[] = [];

  if (criticalContacts > 0) {
    recommendations.push(
      `Immediately suppress ${criticalContacts} contacts missing core consent evidence before the next campaign.`
    );
  }

  if (warningContacts > 0) {
    recommendations.push(
      `Run a consent re-confirmation sequence for ${warningContacts} borderline records and store the response proof.`
    );
  }

  const missingProof = contacts.filter((item) => item.reasons.some((reason) => reason.includes("proof"))).length;
  if (missingProof > 0) {
    recommendations.push(
      `Backfill proof metadata (IP, user-agent, consent form version) for ${missingProof} contacts to defend audit requests.`
    );
  }

  const missingSource = contacts.filter((item) => item.reasons.some((reason) => reason.includes("source"))).length;
  if (missingSource > 0) {
    recommendations.push(
      `Standardize signup source tagging across forms because ${missingSource} rows are missing acquisition context.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Current list passed all core checks. Keep monthly automated audits enabled to detect regressions quickly."
    );
  }

  return {
    summary: {
      totalContacts: contacts.length,
      compliantContacts,
      warningContacts,
      criticalContacts,
      suppressImmediately,
      reconfirmConsent,
      complianceScore,
      estimatedFineExposureEUR
    },
    contacts,
    recommendations,
    generatedAt: formatISO(new Date())
  };
}
