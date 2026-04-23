"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { CleanupActions } from "@/components/CleanupActions";
import { ComplianceReport } from "@/components/ComplianceReport";
import { FileUpload } from "@/components/FileUpload";
import { RiskAssessment } from "@/components/RiskAssessment";
import { Card, CardContent } from "@/components/ui/card";
import type { AuditReport, UploadResponse } from "@/types/audit";

export function UploadWorkspace() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [datasetName, setDatasetName] = useState<string>("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDatasetReady = async (dataset: UploadResponse) => {
    try {
      setError(null);
      setIsAuditing(true);
      setDatasetName(dataset.filename);

      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: dataset.datasetId, listName: dataset.filename })
      });

      const payload = (await response.json()) as AuditReport | { error: string };

      if (!response.ok) {
        const message = "error" in payload ? payload.error : "Audit failed.";
        throw new Error(message);
      }

      setReport(payload as AuditReport);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Audit failed.";
      setError(message);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload onDatasetReady={handleDatasetReady} />

      {isAuditing ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Running compliance analysis for {datasetName}...
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-red-300">{error}</CardContent>
        </Card>
      ) : null}

      {report ? (
        <div className="space-y-6">
          <RiskAssessment report={report} />
          <ComplianceReport report={report} />
          <CleanupActions report={report} />
        </div>
      ) : null}
    </div>
  );
}
