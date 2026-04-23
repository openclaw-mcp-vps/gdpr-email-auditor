"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

import type { ContactRecord, UploadResponse } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FileUploadProps {
  onDatasetReady: (dataset: UploadResponse) => void;
}

function humanFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ onDatasetReady }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ContactRecord[]>([]);

  const accept = useMemo(() => ".csv,.xlsx,.xls", []);

  const onSelectFile = useCallback((selected: File | null) => {
    if (!selected) return;
    setError(null);
    setFile(selected);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("Choose a CSV or Excel file before starting the audit.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as UploadResponse | { error: string };

      if (!response.ok) {
        const message = "error" in payload ? payload.error : "Upload failed.";
        throw new Error(message);
      }

      const uploadResult = payload as UploadResponse;
      setPreview(uploadResult.preview);
      onDatasetReady(uploadResult);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Upload failed.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [file, onDatasetReady]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
          Upload Your Marketing List
        </CardTitle>
        <CardDescription>
          We support CSV, XLSX, and XLS files with columns for email, consent status, consent date,
          and source.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950/70 p-10 text-center transition hover:border-cyan-500/70"
        >
          <UploadCloud className="h-9 w-9 text-cyan-400" />
          <p className="text-sm font-medium text-slate-100">
            {file ? file.name : "Drag and drop your list, or click to select a file"}
          </p>
          <p className="text-xs text-slate-400">
            {file
              ? `${humanFileSize(file.size)} ready for audit`
              : "Files up to 50MB are accepted for compliance analysis."}
          </p>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button onClick={handleUpload} disabled={isUploading} className="w-full">
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing list
            </>
          ) : (
            "Start GDPR Audit"
          )}
        </Button>

        {preview.length > 0 ? (
          <div className="rounded-lg border border-slate-800">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">
              Contact preview
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Consent</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.email} className="border-t border-slate-800 text-slate-200">
                      <td className="px-4 py-2">{row.email}</td>
                      <td className="px-4 py-2">{row.consentStatus}</td>
                      <td className="px-4 py-2">{row.consentDate ?? "-"}</td>
                      <td className="px-4 py-2">{row.source ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
