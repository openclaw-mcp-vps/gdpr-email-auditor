import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ComplianceReport } from "@/components/ComplianceReport";
import { ContactTable } from "@/components/ContactTable";
import { ACCESS_COOKIE_NAME, hasValidAccessToken } from "@/lib/access";
import { getAuditById } from "@/lib/db";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AuditPage({ params }: AuditPageProps) {
  const cookieStore = await cookies();
  const hasAccess = hasValidAccessToken(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  if (!hasAccess) {
    redirect("/unlock");
  }

  const { id } = await params;
  const audit = await getAuditById(id);

  if (!audit) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0d1117]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2a3d52] bg-[#111a24]/80 px-5 py-4">
          <div>
            <h1 className="truncate font-[var(--font-heading)] text-2xl font-bold sm:text-3xl">Audit: {audit.fileName}</h1>
            <p className="text-sm text-[#8ea2bd]">Audit ID {audit.id}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-[#37516d] bg-[#162638] px-4 py-2 text-sm font-semibold text-[#d6e4f2] transition hover:bg-[#20344a]"
            >
              Back to dashboard
            </Link>
          </div>
        </header>

        <div className="space-y-6">
          <ComplianceReport
            summary={audit.summary}
            recommendations={audit.recommendations}
            generatedAt={audit.generatedAt}
          />
          <ContactTable contacts={audit.contacts} />
        </div>
      </div>
    </main>
  );
}
