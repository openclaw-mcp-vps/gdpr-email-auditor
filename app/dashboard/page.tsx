import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import { ACCESS_COOKIE_NAME, hasValidAccessToken } from "@/lib/access";
import { getRecentAudits } from "@/lib/db";

export const metadata = {
  title: "Dashboard"
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasAccess = hasValidAccessToken(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  if (!hasAccess) {
    redirect("/unlock");
  }

  const audits = await getRecentAudits(12);

  return (
    <main className="min-h-screen bg-[#0d1117]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2a3d52] bg-[#111a24]/80 px-5 py-4">
          <div>
            <h1 className="font-[var(--font-heading)] text-3xl font-bold">Compliance Dashboard</h1>
            <p className="text-sm text-[#8ea2bd]">Upload lists, run audits, and track remediation progress.</p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[#37516d] bg-[#162638] px-4 py-2 text-sm font-semibold text-[#d6e4f2] transition hover:bg-[#20344a]"
          >
            Back to site
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <FileUpload />

          <section className="rounded-2xl border border-[#253549] bg-[#111a24]/80 p-6">
            <h2 className="mb-4 font-[var(--font-heading)] text-xl font-semibold">Recent audits</h2>
            <div className="space-y-3">
              {audits.length === 0 ? (
                <p className="rounded-lg border border-[#2a3d52] bg-[#0f1621] p-3 text-sm text-[#8ea2bd]">
                  No audits yet. Upload your first list to generate a compliance report.
                </p>
              ) : (
                audits.map((audit) => (
                  <Link
                    key={audit.id}
                    href={`/audit/${audit.id}`}
                    className="block rounded-xl border border-[#2a3d52] bg-[#0f1621] p-4 transition hover:border-[#3a5574] hover:bg-[#131f2f]"
                  >
                    <p className="truncate text-sm font-medium text-[#dce8f5]">{audit.fileName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8ea2bd]">
                      <span>Score: {audit.complianceScore}%</span>
                      <span>Contacts: {audit.totalContacts.toLocaleString()}</span>
                      <span className={audit.criticalContacts > 0 ? "text-[#ff9da8]" : "text-[#57e1aa]"}>
                        Critical: {audit.criticalContacts}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(audit.createdAt), {
                          addSuffix: true
                        })}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
