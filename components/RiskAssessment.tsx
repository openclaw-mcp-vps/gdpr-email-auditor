"use client";

import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

import type { AuditReport } from "@/types/audit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RiskAssessmentProps {
  report: AuditReport;
}

const severityColorMap: Record<AuditReport["risk"]["level"], string> = {
  low: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  medium: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
  high: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  critical: "border-red-500/40 bg-red-500/15 text-red-300"
};

export function RiskAssessment({ report }: RiskAssessmentProps) {
  const showWarning = report.risk.level === "high" || report.risk.level === "critical";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Risk Assessment</CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            Overall exposure based on missing consent evidence and list volume.
          </p>
        </div>
        <Badge className={severityColorMap[report.risk.level]}>{report.risk.level.toUpperCase()}</Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Risk score</span>
            <span className="font-semibold text-slate-100">{report.risk.score}/100</span>
          </div>
          <Progress value={report.risk.score} />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimated Fine Exposure</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">
            €{report.risk.estimatedFineExposureEur.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Estimate uses non-compliant contact volume as a weighted exposure indicator, capped at the
            GDPR upper-limit threshold.
          </p>
        </div>

        <div className="space-y-2">
          {report.risk.rationale.map((point) => (
            <div key={point} className="flex items-start gap-2 text-sm text-slate-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-300" />
              <span>{point}</span>
            </div>
          ))}
        </div>

        <div
          className={`rounded-lg border p-4 text-sm ${
            showWarning
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          <div className="mb-2 flex items-center gap-2 font-semibold">
            {showWarning ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {showWarning ? "Action needed before next campaign" : "Compliance posture is stable"}
          </div>
          <p>
            {showWarning
              ? "Suppress high-risk segments and complete cleanup actions before sending marketing email to this list."
              : "Continue monthly audits and preserve source and timestamp capture on all new contacts."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
