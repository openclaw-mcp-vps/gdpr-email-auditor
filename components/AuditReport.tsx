"use client";

import {
  AlertTriangle,
  Download,
  FileWarning,
  Mail,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AuditReport as AuditReportType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplianceScore } from "@/components/ComplianceScore";

interface AuditReportProps {
  report: AuditReportType;
}

const riskColorMap = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "neutral",
} as const;

export function AuditReport({ report }: AuditReportProps) {
  const riskBars = [
    {
      name: "High Risk",
      value: report.summary.highRiskContacts,
    },
    {
      name: "Missing Consent",
      value: report.summary.missingConsentContacts,
    },
    {
      name: "Invalid Emails",
      value: report.summary.invalidEmailContacts,
    },
    {
      name: "Stale Consent",
      value: report.summary.staleConsentContacts,
    },
  ];

  const downloadCsv = () => {
    const headers = ["Email", "Risk Level", "Reasons", "Actions"];
    const rows = report.findings.map((finding) => [
      finding.email,
      finding.riskLevel,
      finding.reasons.join(" | "),
      finding.recommendedActions.join(" | "),
    ]);

    const csvRows = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.fileName.replace(/\.[^.]+$/, "")}-gdpr-audit.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Audit Summary</CardTitle>
              <p className="mt-2 text-sm text-[#8b949e]">
                File: {report.fileName} · Generated {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
            <Button variant="outline" onClick={downloadCsv} className="gap-2">
              <Download className="h-4 w-4" />
              Export Findings CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
            <ComplianceScore score={report.summary.score} />
          </div>
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
            <p className="text-sm text-[#8b949e]">Total Contacts</p>
            <p className="mt-2 text-3xl font-[var(--font-heading)] font-bold">
              {report.summary.totalContacts}
            </p>
          </div>
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
            <p className="text-sm text-[#8b949e]">Needs Action</p>
            <p className="mt-2 text-3xl font-[var(--font-heading)] font-bold text-[#f85149]">
              {report.summary.needsActionContacts}
            </p>
          </div>
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
            <p className="text-sm text-[#8b949e]">Compliant Records</p>
            <p className="mt-2 text-3xl font-[var(--font-heading)] font-bold text-[#3fb950]">
              {report.summary.compliantContacts}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="name" stroke="#8b949e" />
                <YAxis stroke="#8b949e" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    color: "#e6edf3",
                  }}
                />
                <Bar dataKey="value" fill="#2f81f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Cleanup Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.recommendations.map((recommendation) => (
            <div
              key={recommendation.title}
              className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-[var(--font-heading)] text-lg">{recommendation.title}</h3>
                <Badge
                  variant={
                    recommendation.priority === "urgent"
                      ? "danger"
                      : recommendation.priority === "high"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {recommendation.priority.toUpperCase()}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-[#c9d1d9]">{recommendation.description}</p>
              <p className="mt-2 text-sm text-[#8b949e]">Impact: {recommendation.impact}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {report.findings.length === 0 ? (
            <div className="rounded-lg border border-[#3fb950]/30 bg-[#3fb950]/10 p-4 text-sm text-[#3fb950]">
              No risky contacts were detected in this audit.
            </div>
          ) : (
            <div className="space-y-3">
              {report.findings.slice(0, 200).map((finding) => (
                <div
                  key={`${finding.email}-${finding.riskLevel}`}
                  className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#8b949e]" />
                      <p className="font-medium">{finding.email}</p>
                    </div>
                    <Badge variant={riskColorMap[finding.riskLevel]}>
                      {finding.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-[#c9d1d9]">
                    {finding.reasons.map((reason) => (
                      <p key={reason} className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-[#d29922]" />
                        <span>{reason}</span>
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#8b949e]">
                    {finding.recommendedActions.map((action) => (
                      <span
                        key={action}
                        className="rounded-full border border-[#30363d] px-2 py-1"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {report.findings.length > 200 ? (
            <p className="mt-4 text-sm text-[#8b949e]">
              Showing first 200 flagged contacts out of {report.findings.length}.
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm text-[#8b949e]">
              <div className="mb-2 flex items-center gap-2 text-[#f85149]">
                <ShieldAlert className="h-4 w-4" />
                High-Risk
              </div>
              Contacts with missing consent proof or critical GDPR signals.
            </div>
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm text-[#8b949e]">
              <div className="mb-2 flex items-center gap-2 text-[#d29922]">
                <FileWarning className="h-4 w-4" />
                Medium-Risk
              </div>
              Contacts with incomplete metadata that can be fixed quickly.
            </div>
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm text-[#8b949e]">
              <div className="mb-2 flex items-center gap-2 text-[#8b949e]">
                <Trash2 className="h-4 w-4" />
                Cleanup
              </div>
              Suppress invalid, unsubscribed, and stale records from active campaigns.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
