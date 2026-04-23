"use client";

import { format } from "date-fns";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AuditSummary } from "@/lib/gdpr-scanner";

type ComplianceReportProps = {
  summary: AuditSummary;
  recommendations: string[];
  generatedAt: string;
};

export function ComplianceReport({ summary, recommendations, generatedAt }: ComplianceReportProps) {
  const chartData = [
    { name: "Compliant", value: summary.compliantContacts, fill: "#34d399" },
    { name: "Warning", value: summary.warningContacts, fill: "#f59e0b" },
    { name: "Critical", value: summary.criticalContacts, fill: "#f05252" }
  ];

  return (
    <section className="space-y-6 rounded-2xl border border-[#253549] bg-[#111a24]/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[var(--font-heading)] text-2xl font-semibold">Compliance Summary</h2>
          <p className="text-sm text-[#8ea2bd]">Generated {format(new Date(generatedAt), "PPP p")}</p>
        </div>
        <div className="rounded-xl border border-[#2f4157] bg-[#0f1621] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-[#8ea2bd]">Compliance score</p>
          <p className="font-[var(--font-heading)] text-3xl font-semibold text-[#52d4c3]">{summary.complianceScore}%</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-[#244536] bg-[#123122]/50 p-4">
          <div className="mb-2 inline-flex rounded-lg bg-[#34d399]/20 p-2 text-[#57e1aa]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="text-sm text-[#a7ccb8]">Compliant contacts</p>
          <p className="text-2xl font-semibold">{summary.compliantContacts}</p>
        </article>

        <article className="rounded-xl border border-[#4a3f1e] bg-[#33250f]/45 p-4">
          <div className="mb-2 inline-flex rounded-lg bg-[#f59e0b]/20 p-2 text-[#fbbf24]">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <p className="text-sm text-[#dbc28a]">Needs reconfirmation</p>
          <p className="text-2xl font-semibold">{summary.reconfirmConsent}</p>
        </article>

        <article className="rounded-xl border border-[#5f2730] bg-[#35131a]/55 p-4">
          <div className="mb-2 inline-flex rounded-lg bg-[#f05252]/20 p-2 text-[#ff8d8d]">
            <ShieldX className="h-4 w-4" />
          </div>
          <p className="text-sm text-[#f0adb8]">Suppress immediately</p>
          <p className="text-2xl font-semibold">{summary.suppressImmediately}</p>
        </article>
      </div>

      <div className="h-64 rounded-xl border border-[#26384d] bg-[#0f1621] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#243549" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#9fb4cd", fontSize: 12 }} axisLine={{ stroke: "#2a3f57" }} />
            <YAxis tick={{ fill: "#9fb4cd", fontSize: 12 }} axisLine={{ stroke: "#2a3f57" }} />
            <Tooltip
              cursor={{ fill: "rgba(31,157,143,0.08)" }}
              contentStyle={{
                background: "#121d2a",
                border: "1px solid #2f4158",
                borderRadius: "12px",
                color: "#e7edf5"
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-[#2c3e53] bg-[#0f1621] p-4">
        <h3 className="mb-3 font-[var(--font-heading)] text-lg font-semibold">Recommended actions</h3>
        <ul className="space-y-2 text-sm text-[#c7d7ea]">
          {recommendations.map((recommendation) => (
            <li key={recommendation} className="rounded-lg border border-[#233245] bg-[#121c29] px-3 py-2">
              {recommendation}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-[#8ea2bd]">
        Estimated fine exposure if sent unchanged: <span className="font-semibold text-[#ffb870]">€{summary.estimatedFineExposureEUR.toLocaleString()}</span>
      </p>
    </section>
  );
}
