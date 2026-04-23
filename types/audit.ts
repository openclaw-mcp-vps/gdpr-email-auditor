export type ConsentStatus = "granted" | "denied" | "unknown";

export interface ContactRecord {
  email: string;
  consentStatus: ConsentStatus;
  consentDate?: string | null;
  source?: string | null;
  doubleOptIn?: boolean | null;
  region?: string | null;
  tags?: string[];
}

export type ComplianceSeverity = "low" | "medium" | "high" | "critical";

export interface ComplianceIssue {
  code:
    | "invalid_email"
    | "missing_consent"
    | "missing_consent_date"
    | "missing_source"
    | "stale_consent"
    | "missing_double_opt_in";
  message: string;
  severity: ComplianceSeverity;
}

export interface ContactValidationResult {
  status: "compliant" | "at_risk" | "non_compliant";
  issues: ComplianceIssue[];
}

export interface FlaggedContact {
  email: string;
  reason: string;
  severity: ComplianceSeverity;
  source: string;
  consentStatus: ConsentStatus;
  consentDate: string | null;
}

export interface AuditRiskAssessment {
  score: number;
  level: ComplianceSeverity;
  estimatedFineExposureEur: number;
  rationale: string[];
}

export interface CleanupAction {
  id: string;
  title: string;
  description: string;
  impact: string;
  effort: "low" | "medium" | "high";
  priority: number;
  affectedContacts: number;
  filter: "missing_consent" | "missing_consent_date" | "missing_source" | "stale_consent";
}

export interface SourceTrend {
  source: string;
  compliant: number;
  nonCompliant: number;
}

export interface AuditReport {
  id: string;
  createdAt: string;
  listName: string;
  totalContacts: number;
  compliantContacts: number;
  nonCompliantContacts: number;
  atRiskContacts: number;
  complianceRate: number;
  issuesBreakdown: {
    missingConsent: number;
    missingConsentDate: number;
    missingSource: number;
    staleConsent: number;
    invalidEmail: number;
    missingDoubleOptIn: number;
  };
  risk: AuditRiskAssessment;
  recommendations: string[];
  cleanupActions: CleanupAction[];
  flaggedContacts: FlaggedContact[];
  trendBySource: SourceTrend[];
}

export interface UploadedDataset {
  id: string;
  filename: string;
  uploadedAt: string;
  totalContacts: number;
  contacts: ContactRecord[];
}

export interface PurchaseRecord {
  sessionId: string;
  email: string;
  paidAt: string;
  amountTotal?: number | null;
  currency?: string | null;
}

export interface UploadResponse {
  datasetId: string;
  filename: string;
  totalContacts: number;
  acceptedContacts: number;
  droppedRows: number;
  preview: ContactRecord[];
}
