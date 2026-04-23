import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ComplianceScoreProps {
  score: number;
}

function scoreBand(score: number) {
  if (score >= 85) {
    return {
      label: "Compliant",
      color: "text-[#3fb950]",
      icon: ShieldCheck,
      helper: "Your consent evidence is strong and risk is currently low.",
    };
  }

  if (score >= 60) {
    return {
      label: "Needs Attention",
      color: "text-[#d29922]",
      icon: ShieldAlert,
      helper: "There are actionable gaps that should be fixed before the next campaign.",
    };
  }

  return {
    label: "High Risk",
    color: "text-[#f85149]",
    icon: ShieldX,
    helper: "Critical consent gaps found. Pause sending until remediation is complete.",
  };
}

export function ComplianceScore({ score }: ComplianceScoreProps) {
  const band = scoreBand(score);
  const Icon = band.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${band.color}`} />
          <p className="text-sm font-medium text-[#8b949e]">Compliance Score</p>
        </div>
        <p className={`text-sm font-semibold ${band.color}`}>{band.label}</p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="font-[var(--font-heading)] text-4xl font-bold">{score}</p>
        <p className="mb-1 text-xs text-[#8b949e]">out of 100</p>
      </div>
      <Progress value={score} aria-label={`Compliance score ${score} out of 100`} />
      <p className="text-sm text-[#8b949e]">{band.helper}</p>
    </div>
  );
}
