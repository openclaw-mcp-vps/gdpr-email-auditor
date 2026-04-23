"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AuditTrendPoint {
  date: string;
  score: number;
  highRiskContacts: number;
}

interface AuditTrendChartProps {
  data: AuditTrendPoint[];
}

export function AuditTrendChart({ data }: AuditTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4 text-sm text-[#8b949e]">
        Run your first audit to start tracking compliance trend lines.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#8b949e" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" stroke="#8b949e" domain={[0, 100]} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#8b949e" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              color: "#e6edf3",
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="score"
            stroke="#2f81f7"
            strokeWidth={2}
            dot={{ r: 3, fill: "#2f81f7" }}
            name="Compliance Score"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="highRiskContacts"
            stroke="#f85149"
            strokeWidth={2}
            dot={{ r: 3, fill: "#f85149" }}
            name="High-Risk Contacts"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
