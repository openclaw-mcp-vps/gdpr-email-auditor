import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BarChart3, LockKeyhole } from "lucide-react";

import { ComplianceReport } from "@/components/ComplianceReport";
import { RiskAssessment } from "@/components/RiskAssessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestAudit, getRecentAudits } from "@/lib/database";
import { hasPageAccess } from "@/lib/paywall";

const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

export const metadata = {
  title: "Dashboard | GDPR Email Auditor",
  description: "Track GDPR compliance status and risk trends across uploads."
};

export default async function DashboardPage() {
  const hasAccess = await hasPageAccess();

  if (!hasAccess) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LockKeyhole className="h-6 w-6 text-cyan-400" />
            Dashboard Locked
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-300">
          <p>Subscribe to access historical compliance reports, risk score trendlines, and export tools.</p>
          <a href={stripeLink} className="block">
            <Button className="w-full">Unlock Dashboard - $19/mo</Button>
          </a>
          <Link href="/success" className="block">
            <Button variant="outline" className="w-full">
              Activate existing purchase
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const latestAudit = getLatestAudit();
  const recentAudits = getRecentAudits(8);

  if (!latestAudit) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            No Audits Yet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-300">
          <p>Upload your first email list to generate a compliance baseline and risk report.</p>
          <Link href="/upload">
            <Button>Upload Your First List</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Compliance Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          Latest audit: <span className="font-semibold text-slate-100">{latestAudit.listName}</span> •
          {" "}
          {formatDistanceToNow(new Date(latestAudit.createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RiskAssessment report={latestAudit} />
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-3 py-2">List</th>
                    <th className="px-3 py-2">Compliance</th>
                    <th className="px-3 py-2">Risk</th>
                    <th className="px-3 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.map((audit) => (
                    <tr key={audit.id} className="border-t border-slate-800 text-slate-200">
                      <td className="px-3 py-2">{audit.listName}</td>
                      <td className="px-3 py-2">{audit.complianceRate}%</td>
                      <td className="px-3 py-2">{audit.risk.level}</td>
                      <td className="px-3 py-2">
                        {formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ComplianceReport report={latestAudit} />
    </div>
  );
}
