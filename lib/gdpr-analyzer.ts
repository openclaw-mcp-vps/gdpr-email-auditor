import { randomUUID } from "crypto";
import {
  AuditRecommendation,
  AuditReport,
  ContactFinding,
  ParsedContact,
  RiskLevel,
} from "@/lib/types";

const EU_REGIONS = new Set([
  "austria",
  "belgium",
  "bulgaria",
  "croatia",
  "cyprus",
  "czech republic",
  "czechia",
  "denmark",
  "estonia",
  "finland",
  "france",
  "germany",
  "greece",
  "hungary",
  "ireland",
  "italy",
  "latvia",
  "lithuania",
  "luxembourg",
  "malta",
  "netherlands",
  "poland",
  "portugal",
  "romania",
  "slovakia",
  "slovenia",
  "spain",
  "sweden",
  "is",
  "li",
  "no",
  "eea",
  "eu",
  "at",
  "be",
  "bg",
  "hr",
  "cy",
  "cz",
  "dk",
  "ee",
  "fi",
  "fr",
  "de",
  "gr",
  "hu",
  "ie",
  "it",
  "lv",
  "lt",
  "lu",
  "mt",
  "nl",
  "pl",
  "pt",
  "ro",
  "sk",
  "si",
  "es",
  "se",
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STALE_DAYS_THRESHOLD = 365 * 2;

function normalizeCountry(country: string | null): string {
  return (country || "").trim().toLowerCase();
}

function isEUContact(country: string | null): boolean {
  const normalized = normalizeCountry(country);
  if (!normalized) return false;
  return EU_REGIONS.has(normalized);
}

function daysSince(dateValue: string | null): number | null {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  const diffMs = Date.now() - parsed.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function severityRank(level: RiskLevel): number {
  switch (level) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function recommendationList(params: {
  missingConsent: number;
  invalidEmails: number;
  staleConsent: number;
  highRisk: number;
  total: number;
}): AuditRecommendation[] {
  const recommendations: AuditRecommendation[] = [];

  if (params.highRisk > 0) {
    recommendations.push({
      title: "Freeze High-Risk Contacts Immediately",
      description:
        "Pause campaigns to contacts flagged as high or critical risk until their consent status is remediated.",
      priority: "urgent",
      impact: `${params.highRisk} contacts could trigger immediate enforcement exposure if emailed again.`,
    });
  }

  if (params.missingConsent > 0) {
    recommendations.push({
      title: "Launch a Re-Permission Campaign",
      description:
        "Send a one-time consent renewal request and suppress non-responders from all promotional workflows.",
      priority: "high",
      impact: `${params.missingConsent} records lack complete proof of lawful marketing consent.`,
    });
  }

  if (params.invalidEmails > 0) {
    recommendations.push({
      title: "Purge Invalid Addresses",
      description:
        "Remove malformed and blank emails before your next send to reduce compliance and deliverability risks.",
      priority: "high",
      impact: `${params.invalidEmails} contacts have invalid or missing email addresses.`,
    });
  }

  if (params.staleConsent > 0) {
    recommendations.push({
      title: "Define Consent Expiration Policy",
      description:
        "Set an automatic 24-month inactivity rule and renew consent before reactivating dormant contacts.",
      priority: "medium",
      impact: `${params.staleConsent} contacts are stale and need renewed consent evidence.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Maintain Continuous Monitoring",
      description:
        "Your list is currently healthy. Schedule weekly automated checks to catch new consent gaps early.",
      priority: "medium",
      impact: `${params.total} contacts passed this audit cycle.`,
    });
  }

  return recommendations;
}

function evaluateContact(contact: ParsedContact): ContactFinding {
  const reasons: string[] = [];
  const recommendedActions: string[] = [];
  const euContact = isEUContact(contact.country);
  const engagementAgeDays = daysSince(contact.lastEngagementDate);

  const hasValidEmail = EMAIL_REGEX.test(contact.email);
  const hasConsentProof =
    contact.consentGiven === true && !!contact.consentDate && !!contact.consentSource;

  if (!hasValidEmail) {
    reasons.push("Email address is invalid or missing.");
    recommendedActions.push("Remove this record from all campaign audiences.");
  }

  if (!hasConsentProof) {
    reasons.push("Consent proof is incomplete (missing consent flag, date, or source).");
    recommendedActions.push(
      "Exclude from promotional email until explicit consent evidence is collected."
    );
  }

  if (euContact && contact.doubleOptIn !== true) {
    reasons.push("EU/EEA contact lacks double opt-in confirmation.");
    recommendedActions.push("Require double opt-in confirmation before future sends.");
  }

  if (engagementAgeDays !== null && engagementAgeDays > STALE_DAYS_THRESHOLD) {
    reasons.push("No engagement for more than 24 months.");
    recommendedActions.push("Move to a re-consent workflow or suppress as inactive.");
  }

  if (contact.unsubscribed === true) {
    reasons.push("Contact is marked unsubscribed but still present in the marketing list.");
    recommendedActions.push("Hard-suppress this contact across all marketing tools.");
  }

  let riskScore = 0;
  if (!hasValidEmail) riskScore += 5;
  if (!hasConsentProof) riskScore += euContact ? 5 : 4;
  if (euContact && contact.doubleOptIn !== true) riskScore += 2;
  if (engagementAgeDays !== null && engagementAgeDays > STALE_DAYS_THRESHOLD) riskScore += 2;
  if (contact.unsubscribed === true) riskScore += 2;

  let riskLevel: RiskLevel = "low";
  if (riskScore >= 9) riskLevel = "critical";
  else if (riskScore >= 6) riskLevel = "high";
  else if (riskScore >= 3) riskLevel = "medium";
  else if (riskScore >= 1) riskLevel = "low";

  const status = reasons.length === 0 ? "compliant" : "needs-action";

  return {
    email: contact.email || "(missing email)",
    riskLevel,
    status,
    reasons,
    recommendedActions,
    metadata: {
      country: contact.country,
      consentDate: contact.consentDate,
      consentSource: contact.consentSource,
      doubleOptIn: contact.doubleOptIn,
      lastEngagementDate: contact.lastEngagementDate,
      unsubscribed: contact.unsubscribed,
    },
  };
}

export function analyzeGdprCompliance(params: {
  fileName: string;
  contacts: ParsedContact[];
  parserNotes?: string[];
}): AuditReport {
  const findings = params.contacts.map(evaluateContact);

  const compliantContacts = findings.filter((finding) => finding.status === "compliant").length;
  const needsActionContacts = findings.length - compliantContacts;
  const highRiskContacts = findings.filter(
    (finding) => finding.riskLevel === "critical" || finding.riskLevel === "high"
  ).length;
  const missingConsentContacts = findings.filter((finding) =>
    finding.reasons.some((reason) => reason.includes("Consent proof"))
  ).length;
  const invalidEmailContacts = findings.filter((finding) =>
    finding.reasons.some((reason) => reason.includes("invalid or missing"))
  ).length;
  const staleConsentContacts = findings.filter((finding) =>
    finding.reasons.some((reason) => reason.includes("24 months"))
  ).length;

  const criticalCount = findings.filter((finding) => finding.riskLevel === "critical").length;
  const highCount = findings.filter((finding) => finding.riskLevel === "high").length;
  const mediumCount = findings.filter((finding) => finding.riskLevel === "medium").length;
  const lowCount = findings.filter(
    (finding) => finding.riskLevel === "low" && finding.status === "needs-action"
  ).length;

  const weightedPenalty = criticalCount * 18 + highCount * 10 + mediumCount * 5 + lowCount * 2;
  const maxPenalty = Math.max(params.contacts.length * 18, 1);
  const score = Math.max(0, Math.round(100 - (weightedPenalty / maxPenalty) * 100));

  const sortedNeedsActionFindings = findings
    .filter((finding) => finding.status === "needs-action")
    .sort((a, b) => severityRank(b.riskLevel) - severityRank(a.riskLevel));

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    fileName: params.fileName,
    summary: {
      score,
      totalContacts: params.contacts.length,
      compliantContacts,
      needsActionContacts,
      highRiskContacts,
      missingConsentContacts,
      invalidEmailContacts,
      staleConsentContacts,
    },
    findings: sortedNeedsActionFindings,
    recommendations: recommendationList({
      missingConsent: missingConsentContacts,
      invalidEmails: invalidEmailContacts,
      staleConsent: staleConsentContacts,
      highRisk: highRiskContacts,
      total: params.contacts.length,
    }),
    parserNotes: params.parserNotes || [],
  };
}
