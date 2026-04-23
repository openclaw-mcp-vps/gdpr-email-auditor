import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, ShieldAlert, TimerReset } from "lucide-react";
import { hasAccessCookie } from "@/lib/paywall";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClaimAccessForm } from "@/components/ClaimAccessForm";

const faqItems = [
  {
    question: "What data does the auditor need to run?",
    answer:
      "A CSV or Excel file with email address plus any available consent fields such as opt-in status, consent date, source, country, and unsubscribe state.",
  },
  {
    question: "How does paid access work with Stripe Payment Link?",
    answer:
      "After checkout, Stripe sends a webhook. We record the paid email, and you unlock this browser by entering the same purchase email once.",
  },
  {
    question: "Can agencies audit multiple client lists?",
    answer:
      "Yes. Each uploaded list generates a separate report with timestamped findings and cleanup recommendations you can share with clients.",
  },
  {
    question: "Does this replace legal counsel?",
    answer:
      "No. It accelerates evidence checks and operational remediation. Your legal team still decides final policy and risk acceptance.",
  },
];

export default async function HomePage() {
  const hasAccess = await hasAccessCookie();

  return (
    <main className="min-h-screen">
      <header className="border-b border-[#30363d] bg-[#0d1117]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-[var(--font-heading)] text-lg font-semibold tracking-tight">
            GDPR Email Auditor
          </Link>
          <nav className="flex items-center gap-2">
            {hasAccess ? (
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : null}
            <Button asChild size="sm">
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
                Buy for $19/mo
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Badge variant="default" className="mb-6">
            Legal Compliance · GDPR Email Marketing
          </Badge>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1
                className="font-[var(--font-heading)] text-4xl font-bold leading-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-heading), sans-serif" }}
              >
                Audit email lists for GDPR consent gaps before regulators do.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-[#8b949e]">
                Upload your list, detect contacts without lawful consent evidence, and get a
                prioritized cleanup plan in minutes. Stop guessing before your next campaign send.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
                    Start Compliance Audits
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={hasAccess ? "/upload" : "/unlock"}>Open the Tool</Link>
                </Button>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-[#8b949e] sm:grid-cols-3">
                <div className="rounded-lg border border-[#30363d] bg-[#161b22]/70 p-3">
                  Avg GDPR fine impact: €15M
                </div>
                <div className="rounded-lg border border-[#30363d] bg-[#161b22]/70 p-3">
                  Built for e-commerce + SaaS
                </div>
                <div className="rounded-lg border border-[#30363d] bg-[#161b22]/70 p-3">
                  Audit-ready remediation logs
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#30363d] bg-[#161b22]/80 p-6 shadow-2xl shadow-black/30">
              <h2 className="font-[var(--font-heading)] text-xl font-semibold">Why teams switch</h2>
              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <ShieldAlert className="mt-1 h-5 w-5 text-[#f85149]" />
                  <div>
                    <p className="font-medium">Manual consent audits do not scale</p>
                    <p className="text-sm text-[#8b949e]">
                      Large lists hide missing proof in thousands of rows and disconnected systems.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TimerReset className="mt-1 h-5 w-5 text-[#2f81f7]" />
                  <div>
                    <p className="font-medium">Weekly monitoring beats annual panic audits</p>
                    <p className="text-sm text-[#8b949e]">
                      Track score trends over time and prevent risky records from re-entering sends.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Lock className="mt-1 h-5 w-5 text-[#3fb950]" />
                  <div>
                    <p className="font-medium">Paywall protects the live compliance engine</p>
                    <p className="text-sm text-[#8b949e]">
                      Stripe purchase verification unlocks secure cookie-based access to reports and uploads.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#30363d] bg-[#11161d] px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <p className="text-sm uppercase tracking-wide text-[#8b949e]">Problem</p>
            <h3 className="mt-3 font-[var(--font-heading)] text-2xl font-semibold">
              Consent records are fragmented
            </h3>
            <p className="mt-3 text-sm text-[#8b949e]">
              Marketing tools, CRMs, and legacy imports create blind spots where lawful basis
              evidence is missing or stale.
            </p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <p className="text-sm uppercase tracking-wide text-[#8b949e]">Solution</p>
            <h3 className="mt-3 font-[var(--font-heading)] text-2xl font-semibold">
              Automated contact-level risk scoring
            </h3>
            <p className="mt-3 text-sm text-[#8b949e]">
              Detect missing consent flags, dates, sources, double opt-in gaps, invalid emails, and
              stale engagement in one pass.
            </p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <p className="text-sm uppercase tracking-wide text-[#8b949e]">Outcome</p>
            <h3 className="mt-3 font-[var(--font-heading)] text-2xl font-semibold">
              Clear remediation actions
            </h3>
            <p className="mt-3 text-sm text-[#8b949e]">
              Know exactly which contacts to suppress, re-permission, or enrich before your next
              campaign.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#30363d] bg-[#161b22]/80 p-8 text-center">
          <p className="text-sm uppercase tracking-wider text-[#8b949e]">Pricing</p>
          <h2 className="mt-3 font-[var(--font-heading)] text-4xl font-bold">$19/month</h2>
          <p className="mt-4 text-[#8b949e]">
            Unlimited list uploads, audit history tracking, risk scoring, and cleanup
            recommendations.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
                Subscribe via Stripe
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/unlock">Already purchased?</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-2 text-left text-sm text-[#c9d1d9] sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
              CSV and Excel ingestion
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
              Contact-level risk evidence
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
              Downloadable findings export
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
              Ongoing compliance history
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[var(--font-heading)] text-3xl font-bold">FAQ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-5">
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-[#8b949e]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <ClaimAccessForm />
        </div>
      </section>
    </main>
  );
}
