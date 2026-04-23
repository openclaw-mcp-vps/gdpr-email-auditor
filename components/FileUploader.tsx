"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UploadPreview {
  fileName: string;
  totalRows: number;
  detectedColumns: string[];
  parserNotes: string[];
  preview: Array<{
    email: string;
    consentGiven: boolean | null;
    consentDate: string | null;
    consentSource: string | null;
    doubleOptIn: boolean | null;
    country: string | null;
  }>;
}

export function FileUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isAuditRunning, setIsAuditRunning] = useState(false);

  const selectedFileLabel = useMemo(() => {
    if (!file) return "CSV or Excel (.csv, .xlsx, .xls)";
    const sizeMb = (file.size / 1024 / 1024).toFixed(2);
    return `${file.name} (${sizeMb} MB)`;
  }, [file]);

  const readPreview = async (selectedFile: File) => {
    setError(null);
    setPreview(null);
    setIsPreviewLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to read file preview.");
      }

      setPreview(data as UploadPreview);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to parse file.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const runAudit = async () => {
    if (!file) {
      setError("Select a file before running the audit.");
      return;
    }

    setError(null);
    setIsAuditRunning(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to run audit.");
      }

      if (data.auditId) {
        router.push(`/audit/${data.auditId}`);
        router.refresh();
      } else {
        throw new Error("Audit completed but no report ID was returned.");
      }
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "Failed to run audit.");
    } finally {
      setIsAuditRunning(false);
    }
  };

  const onFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    await readPreview(selectedFile);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Your Marketing List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#30363d] bg-[#0d1117] px-6 py-12 text-center transition hover:border-[#2f81f7]"
          >
            <UploadCloud className="h-10 w-10 text-[#2f81f7] transition group-hover:scale-110" />
            <p className="mt-4 font-[var(--font-heading)] text-lg font-semibold">
              Drop a file or click to choose
            </p>
            <p className="mt-2 text-sm text-[#8b949e]">{selectedFileLabel}</p>
            <p className="mt-1 text-xs text-[#6e7681]">
              Include consent flag, consent date, consent source, and country for best accuracy.
            </p>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) {
                void onFileSelected(selectedFile);
              }
            }}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => file && void readPreview(file)}
              disabled={!file || isPreviewLoading}
              className="gap-2"
            >
              {isPreviewLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CircleCheck className="h-4 w-4" />
              )}
              Validate File
            </Button>
            <Button onClick={runAudit} disabled={!file || isAuditRunning} className="gap-2">
              {isAuditRunning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Run GDPR Audit
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#ff7b72]">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Parsed File Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm">
                <p className="text-[#8b949e]">Rows Detected</p>
                <p className="mt-1 text-xl font-semibold">{preview.totalRows}</p>
              </div>
              <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm">
                <p className="text-[#8b949e]">Columns</p>
                <p className="mt-1 text-xl font-semibold">{preview.detectedColumns.length}</p>
              </div>
              <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm">
                <p className="text-[#8b949e]">File</p>
                <p className="mt-1 truncate text-sm font-semibold">{preview.fileName}</p>
              </div>
            </div>

            {preview.parserNotes.length > 0 ? (
              <div className="rounded-lg border border-[#d29922]/40 bg-[#d29922]/10 p-3">
                <p className="text-sm font-medium text-[#d29922]">Parser Notes</p>
                <ul className="mt-2 space-y-1 text-sm text-[#c9d1d9]">
                  {preview.parserNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-[#30363d]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[#0d1117] text-[#8b949e]">
                  <tr>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Consent</th>
                    <th className="px-3 py-2">Consent Date</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Double Opt-In</th>
                    <th className="px-3 py-2">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row) => (
                    <tr key={`${row.email}-${row.consentDate}-${row.country}`} className="border-t border-[#30363d]">
                      <td className="px-3 py-2 text-[#c9d1d9]">{row.email || "(missing)"}</td>
                      <td className="px-3 py-2 text-[#c9d1d9]">
                        {row.consentGiven === null ? "Unknown" : row.consentGiven ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-2 text-[#c9d1d9]">{row.consentDate || "—"}</td>
                      <td className="px-3 py-2 text-[#c9d1d9]">{row.consentSource || "—"}</td>
                      <td className="px-3 py-2 text-[#c9d1d9]">
                        {row.doubleOptIn === null ? "Unknown" : row.doubleOptIn ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-2 text-[#c9d1d9]">{row.country || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
