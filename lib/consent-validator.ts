import { differenceInDays, isValid, parseISO } from "date-fns";
import { z } from "zod";

import type {
  ComplianceIssue,
  ContactRecord,
  ContactValidationResult
} from "@/types/audit";

const emailSchema = z.string().trim().email();

function makeIssue(
  code: ComplianceIssue["code"],
  message: string,
  severity: ComplianceIssue["severity"]
): ComplianceIssue {
  return { code, message, severity };
}

function parseConsentDate(consentDate: string | null | undefined): Date | null {
  if (!consentDate) return null;
  const parsed = parseISO(consentDate);
  if (isValid(parsed)) return parsed;

  const fallback = new Date(consentDate);
  return isValid(fallback) ? fallback : null;
}

export function validateConsent(contact: ContactRecord): ContactValidationResult {
  const issues: ComplianceIssue[] = [];

  const emailResult = emailSchema.safeParse(contact.email);
  if (!emailResult.success) {
    issues.push(
      makeIssue(
        "invalid_email",
        "Email format is invalid, making consent evidence unusable.",
        "critical"
      )
    );
  }

  if (contact.consentStatus !== "granted") {
    issues.push(
      makeIssue(
        "missing_consent",
        "No explicit consent record exists for this contact.",
        "critical"
      )
    );
  }

  if (contact.consentStatus === "granted") {
    if (!contact.consentDate) {
      issues.push(
        makeIssue(
          "missing_consent_date",
          "Consent date is missing, so proof of lawful basis is incomplete.",
          "high"
        )
      );
    }

    if (!contact.source) {
      issues.push(
        makeIssue(
          "missing_source",
          "Data source is missing, so collection origin cannot be demonstrated.",
          "high"
        )
      );
    }

    if (contact.doubleOptIn === false) {
      issues.push(
        makeIssue(
          "missing_double_opt_in",
          "Double opt-in evidence is missing for an active marketing contact.",
          "medium"
        )
      );
    }

    const consentDate = parseConsentDate(contact.consentDate);
    if (consentDate) {
      const ageInDays = differenceInDays(new Date(), consentDate);
      if (ageInDays > 730) {
        issues.push(
          makeIssue(
            "stale_consent",
            "Consent is older than 24 months and should be reconfirmed.",
            "medium"
          )
        );
      }
    }
  }

  if (issues.length === 0) {
    return { status: "compliant", issues };
  }

  const hasCriticalOrHigh = issues.some(
    (issue) => issue.severity === "critical" || issue.severity === "high"
  );

  return {
    status: hasCriticalOrHigh ? "non_compliant" : "at_risk",
    issues
  };
}
