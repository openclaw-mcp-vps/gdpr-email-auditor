export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface ParsedContact {
  email: string;
  firstName: string | null;
  lastName: string | null;
  consentGiven: boolean | null;
  consentDate: string | null;
  consentSource: string | null;
  doubleOptIn: boolean | null;
  country: string | null;
  lastEngagementDate: string | null;
  unsubscribed: boolean | null;
  raw: Record<string, string | number | boolean | null>;
}

export interface ParsedFileResult {
  contacts: ParsedContact[];
  totalRows: number;
  detectedColumns: string[];
  parserNotes: string[];
}

export interface ContactFinding {
  email: string;
  riskLevel: RiskLevel;
  status: "compliant" | "needs-action";
  reasons: string[];
  recommendedActions: string[];
  metadata: {
    country: string | null;
    consentDate: string | null;
    consentSource: string | null;
    doubleOptIn: boolean | null;
    lastEngagementDate: string | null;
    unsubscribed: boolean | null;
  };
}

export interface AuditSummary {
  score: number;
  totalContacts: number;
  compliantContacts: number;
  needsActionContacts: number;
  highRiskContacts: number;
  missingConsentContacts: number;
  invalidEmailContacts: number;
  staleConsentContacts: number;
}

export interface AuditRecommendation {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium";
  impact: string;
}

export interface AuditReport {
  id: string;
  createdAt: string;
  fileName: string;
  summary: AuditSummary;
  findings: ContactFinding[];
  recommendations: AuditRecommendation[];
  parserNotes: string[];
}

export interface AuditListItem {
  id: string;
  fileName: string;
  createdAt: string;
  score: number;
  totalContacts: number;
  highRiskContacts: number;
  missingConsentContacts: number;
}
