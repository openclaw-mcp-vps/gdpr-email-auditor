import Link from "next/link";
import { ArrowRight, FileClock, Plus } from "lucide-react";
import { listAuditReports } from "@/lib/database";
import { requirePaidAccessForPage } from "@/lib/paywall";
import { AuditTrendChart } from "@/components/AuditTrendChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  await requirePaidAccessForPage();
  const audits = listAuditReports(30);

  const trendData = [...audits]
    .reverse()
    .map((audit) => ({
      date: new Date(audit.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      score: audit.score,
      highRiskContacts: audit.highRiskContacts,
    }));

  const latestAudit = audits[0];

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="default">Paid Workspace</Badge>
            <h1 className="mt-2 font-[var(--font-heading)] text-4xl font-bold">Compliance Dashboard</h1>
            <p className="mt-2 text-[#8b949e]">
              Track GDPR risk across every uploaded list and prioritize remediation.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/upload">
              <Plus className="h-4 w-4" />
              New Audit
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Audits Run</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-heading)] text-3xl font-bold">{audits.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Latest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-heading)] text-3xl font-bold">
                {latestAudit ? latestAudit.score : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Latest High-Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-heading)] text-3xl font-bold text-[#f85149]">
                {latestAudit ? latestAudit.highRiskContacts : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Missing Consent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-heading)] text-3xl font-bold text-[#d29922]">
                {latestAudit ? latestAudit.missingConsentContacts : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditTrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
              <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-5 text-[#8b949e]">
                <p className="flex items-center gap-2">
                  <FileClock className="h-4 w-4" />
                  No audits yet. Upload your first list to generate a compliance report.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/upload">Run First Audit</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#30363d]">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-[#0d1117] text-left text-[#8b949e]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">File</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">High-Risk</th>
                      <th className="px-4 py-3">Missing Consent</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit.id} className="border-t border-[#30363d]">
                        <td className="px-4 py-3 text-[#c9d1d9]">
                          {new Date(audit.createdAt).toLocaleString()}
                        </td>
                        <td className="max-w-[260px] truncate px-4 py-3 text-[#c9d1d9]">
                          {audit.fileName}
                        </td>
                        <td className="px-4 py-3 text-[#c9d1d9]">{audit.score}</td>
                        <td className="px-4 py-3 text-[#ff7b72]">{audit.highRiskContacts}</td>
                        <td className="px-4 py-3 text-[#d29922]">{audit.missingConsentContacts}</td>
                        <td className="px-4 py-3">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/audit/${audit.id}`}>
                              View Report
                              <ArrowRight className="ml-2 h-3 w-3" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
