import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuditReport } from "@/components/AuditReport";
import { getAuditReportById } from "@/lib/database";
import { requirePaidAccessForPage } from "@/lib/paywall";

interface AuditDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditDetailPage({ params }: AuditDetailPageProps) {
  await requirePaidAccessForPage();
  const { id } = await params;

  const report = getAuditReportById(id);
  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#8b949e] hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <AuditReport report={report} />
      </div>
    </main>
  );
}
