"use client";

import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function FileUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const helperText = useMemo(() => {
    if (!file) {
      return "Upload CSV, XLS, or XLSX with columns like email, consent_date, consent_source, and proof fields.";
    }

    const mb = (file.size / 1024 / 1024).toFixed(2);
    return `${file.name} selected (${mb} MB)`;
  }, [file]);

  async function handleUpload() {
    if (!file) {
      setError("Choose a file before running an audit.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { error?: string; auditId?: string };

      if (!response.ok || !payload.auditId) {
        throw new Error(payload.error ?? "Upload failed. Try again.");
      }

      router.push(`/audit/${payload.auditId}`);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#253549] bg-[#111a24]/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-[#1f9d8f]/20 p-2 text-[#52d4c3]">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-[var(--font-heading)] text-xl font-semibold text-[#e7edf5]">Upload a marketing list</h2>
          <p className="text-sm text-[#8ea2bd]">The scanner flags missing legal basis evidence and high-risk recipients.</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-[#3a4a60] bg-[#0f1621] p-5">
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mb-3 block w-full cursor-pointer rounded-lg border border-[#2a3a4e] bg-[#111a24] px-3 py-2 text-sm text-[#c7d7ea] file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#1f9d8f] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#061219]"
        />
        <p className="text-sm text-[#8ea2bd]">{helperText}</p>
      </div>

      {error ? <p className="mt-4 rounded-lg bg-[#f05252]/10 px-3 py-2 text-sm text-[#ff9f9f]">{error}</p> : null}

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f9d8f] px-4 py-3 font-semibold text-[#07161a] transition hover:bg-[#2bc5b3] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isUploading ? "Auditing list..." : "Run GDPR Audit"}
      </button>
    </section>
  );
}
