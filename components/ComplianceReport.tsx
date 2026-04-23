"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { AuditReport } from "@/types/audit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComplianceReportProps {
  report: AuditReport;
}

export function ComplianceReport({ report }: ComplianceReportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Compliance Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Total Contacts" value={report.totalContacts.toLocaleString()} />
          <Metric label="Compliant" value={report.compliantContacts.toLocaleString()} />
          <Metric label="At Risk" value={report.atRiskContacts.toLocaleString()} />
          <Metric label="Non-Compliant" value={report.nonCompliantContacts.toLocaleString()} />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-200">Compliance by data source</p>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={report.trendBySource} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="source" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    color: "#e2e8f0"
                  }}
                />
                <Bar dataKey="compliant" stackId="a" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonCompliant" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-200">Top flagged contacts</p>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {report.flaggedContacts.slice(0, 12).map((contact) => (
                  <tr key={`${contact.email}-${contact.reason}`} className="border-t border-slate-800">
                    <td className="px-3 py-2 text-slate-100">{contact.email}</td>
                    <td className="px-3 py-2">
                      <Badge
                        className={
                          contact.severity === "critical"
                            ? "border-red-500/50 bg-red-500/15 text-red-300"
                            : contact.severity === "high"
                              ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                              : "border-yellow-500/50 bg-yellow-500/15 text-yellow-300"
                        }
                      >
                        {contact.severity}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{contact.reason}</td>
                    <td className="px-3 py-2 text-slate-400">{contact.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
