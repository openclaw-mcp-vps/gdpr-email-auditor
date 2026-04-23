import { randomUUID } from "node:crypto";

import { validateConsent } from "@/lib/consent-validator";
import type {
  AuditReport,
  CleanupAction,
  ComplianceSeverity,
  ContactRecord,
  SourceTrend
} from "@/types/audit";

function severityFromScore(score: number): ComplianceSeverity {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function analyzeGdprCompliance(listName: string, contacts: ContactRecord[]): AuditReport {
  let compliantContacts = 0;
  let nonCompliantContacts = 0;
  let atRiskContacts = 0;

  const issuesBreakdown = {
    missingConsent: 0,
    missingConsentDate: 0,
    missingSource: 0,
    staleConsent: 0,
    invalidEmail: 0,
    missingDoubleOptIn: 0
  };

  const flaggedContacts: AuditReport["flaggedContacts"] = [];
  const sourceMap = new Map<string, { compliant: number; nonCompliant: number }>();

  for (const contact of contacts) {
    const validation = validateConsent(contact);

    const source = contact.source?.trim() || "Unknown source";
    if (!sourceMap.has(source)) {
      sourceMap.set(source, { compliant: 0, nonCompliant: 0 });
    }

    if (validation.status === "compliant") {
      compliantContacts += 1;
      sourceMap.get(source)!.compliant += 1;
      continue;
    }

    if (validation.status === "non_compliant") {
      nonCompliantContacts += 1;
      sourceMap.get(source)!.nonCompliant += 1;
    } else {
      atRiskContacts += 1;
    }

    for (const issue of validation.issues) {
      if (issue.code === "missing_consent") issuesBreakdown.missingConsent += 1;
      if (issue.code === "missing_consent_date") issuesBreakdown.missingConsentDate += 1;
      if (issue.code === "missing_source") issuesBreakdown.missingSource += 1;
      if (issue.code === "stale_consent") issuesBreakdown.staleConsent += 1;
      if (issue.code === "invalid_email") issuesBreakdown.invalidEmail += 1;
      if (issue.code === "missing_double_opt_in") issuesBreakdown.missingDoubleOptIn += 1;
    }

    const highestSeverity =
      validation.issues.find((issue) => issue.severity === "critical")?.severity ||
      validation.issues.find((issue) => issue.severity === "high")?.severity ||
      validation.issues.find((issue) => issue.severity === "medium")?.severity ||
      "low";

    flaggedContacts.push({
      email: contact.email,
      reason: validation.issues.map((issue) => issue.message).join(" "),
      severity: highestSeverity,
      source,
      consentStatus: contact.consentStatus,
      consentDate: contact.consentDate ?? null
    });
  }

  const totalContacts = contacts.length;
  const complianceRate = totalContacts
    ? Number(((compliantContacts / totalContacts) * 100).toFixed(1))
    : 0;

  const nonCompliantRate = totalContacts ? nonCompliantContacts / totalContacts : 0;
  const atRiskRate = totalContacts ? atRiskContacts / totalContacts : 0;
  const missingSourceRate = totalContacts ? issuesBreakdown.missingSource / totalContacts : 0;

  const rawRiskScore =
    nonCompliantRate * 75 +
    atRiskRate * 15 +
    missingSourceRate * 10 +
    (totalContacts > 100_000 ? 8 : totalContacts > 10_000 ? 4 : 0);

  const riskScore = Number(clamp(rawRiskScore, 0, 100).toFixed(1));
  const riskLevel = severityFromScore(riskScore);

  const estimatedFineExposureEur = Math.round(
    clamp(nonCompliantContacts * 120, 0, 20_000_000)
  );

  const recommendations: string[] = [];
  if (issuesBreakdown.missingConsent > 0) {
    recommendations.push(
      "Suppress contacts with missing consent immediately and run a re-permission campaign before reactivation."
    );
  }
  if (issuesBreakdown.missingConsentDate > 0) {
    recommendations.push(
      "Backfill consent timestamp evidence from CRM and signup logs to maintain an auditable lawful basis trail."
    );
  }
  if (issuesBreakdown.missingSource > 0) {
    recommendations.push(
      "Require source attribution on every form and import path so each contact has a collection origin."
    );
  }
  if (issuesBreakdown.staleConsent > 0) {
    recommendations.push(
      "Launch a rolling consent refresh sequence for records older than 24 months."
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Maintain monthly audits and monitor new imports to preserve your current compliance posture."
    );
  }

  const cleanupActions = ([
    {
      id: "suppress-missing-consent",
      title: "Suppress contacts without explicit consent",
      description:
        "Move records missing explicit opt-in into a suppression segment before your next campaign.",
      impact: "Eliminates your highest GDPR exposure immediately.",
      effort: "low",
      priority: 1,
      affectedContacts: issuesBreakdown.missingConsent,
      filter: "missing_consent"
    },
    {
      id: "backfill-proof",
      title: "Backfill missing consent dates",
      description:
        "Match contacts against CRM and form logs to restore auditable consent timestamps.",
      impact: "Improves defensibility during regulator or legal review.",
      effort: "medium",
      priority: 2,
      affectedContacts: issuesBreakdown.missingConsentDate,
      filter: "missing_consent_date"
    },
    {
      id: "fix-source-capture",
      title: "Enforce source capture on all intake forms",
      description:
        "Require source metadata on every signup, import, and lead sync.",
      impact: "Stops future non-compliant records from entering the list.",
      effort: "medium",
      priority: 3,
      affectedContacts: issuesBreakdown.missingSource,
      filter: "missing_source"
    },
    {
      id: "refresh-stale-consent",
      title: "Run a stale-consent reconfirmation campaign",
      description:
        "Ask older contacts to reconfirm subscription status with clear legal language.",
      impact: "Reduces complaint and enforcement risk from aged permissions.",
      effort: "high",
      priority: 4,
      affectedContacts: issuesBreakdown.staleConsent,
      filter: "stale_consent"
    }
  ] satisfies CleanupAction[]).filter((action) => action.affectedContacts > 0);

  const trendBySource: SourceTrend[] = [...sourceMap.entries()]
    .map(([source, value]) => ({
      source,
      compliant: value.compliant,
      nonCompliant: value.nonCompliant
    }))
    .sort((a, b) => b.nonCompliant - a.nonCompliant)
    .slice(0, 8);

  const rationale = [
    `${nonCompliantContacts} of ${totalContacts} contacts are currently non-compliant.`,
    `${issuesBreakdown.missingConsent} records have no explicit consent evidence.`,
    `${issuesBreakdown.missingConsentDate} records are missing consent timestamps.`
  ];

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    listName,
    totalContacts,
    compliantContacts,
    nonCompliantContacts,
    atRiskContacts,
    complianceRate,
    issuesBreakdown,
    risk: {
      score: riskScore,
      level: riskLevel,
      estimatedFineExposureEur,
      rationale
    },
    recommendations,
    cleanupActions,
    flaggedContacts,
    trendBySource
  };
}
