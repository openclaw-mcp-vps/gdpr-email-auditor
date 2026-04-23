"use client";

import Papa from "papaparse";
import { Download, FileJson2, WandSparkles } from "lucide-react";

import type { AuditReport } from "@/types/audit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CleanupActionsProps {
  report: AuditReport;
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CleanupActions({ report }: CleanupActionsProps) {
  const exportFlaggedCsv = () => {
    const csv = Papa.unparse(
      report.flaggedContacts.map((contact) => ({
        email: contact.email,
        severity: contact.severity,
        consentStatus: contact.consentStatus,
        consentDate: contact.consentDate,
        source: contact.source,
        reason: contact.reason
      }))
    );

    downloadFile(`${report.listName.replace(/\s+/g, "-")}-non-compliant.csv`, csv, "text/csv");
  };

  const exportReportJson = () => {
    downloadFile(
      `${report.listName.replace(/\s+/g, "-")}-audit-report.json`,
      JSON.stringify(report, null, 2),
      "application/json"
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <WandSparkles className="h-5 w-5 text-cyan-400" />
          Cleanup Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.cleanupActions.length === 0 ? (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            No immediate cleanup actions detected. Keep running monthly audits to catch new risks.
          </div>
        ) : (
          report.cleanupActions
            .sort((a, b) => a.priority - b.priority)
            .map((action) => (
              <div key={action.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-100">{action.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{action.description}</p>
                  </div>
                  <Badge className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                    Priority {action.priority}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                  <div>
                    <span className="text-slate-500">Affected contacts:</span> {action.affectedContacts}
                  </div>
                  <div>
                    <span className="text-slate-500">Effort:</span> {action.effort}
                  </div>
                  <div>
                    <span className="text-slate-500">Impact:</span> {action.impact}
                  </div>
                </div>
              </div>
            ))
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={exportFlaggedCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Non-Compliant CSV
          </Button>
          <Button onClick={exportReportJson} variant="outline">
            <FileJson2 className="mr-2 h-4 w-4" />
            Export Full Report JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
