import { format } from "date-fns";
import {
  ArrowRight,
  BadgeAlert,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME, hasValidAccessToken } from "@/lib/access";

export const dynamic = "force-dynamic";

const faqItems = [
  {
    question: "What does the auditor validate?",
    answer:
      "It validates email format, consent timestamp quality, consent source traceability, double opt-in status, and evidence fields like IP or proof IDs."
  },
  {
    question: "Does it support Excel and CSV uploads?",
    answer:
      "Yes. Upload CSV, XLS, or XLSX files from your ESP export. The app scans the first worksheet for Excel files."
  },
  {
    question: "How does paywall access work after purchase?",
    answer:
      "Stripe Payment Link checkout triggers a webhook that records your paid email. You unlock access once using that email, then a signed cookie keeps you logged in."
  },
  {
    question: "Who uses this most effectively?",
    answer:
      "E-commerce teams before seasonal campaigns, SaaS growth teams cleaning legacy lists, and agencies running monthly compliance reporting for clients."
  }
];

const problemStats = [
  "GDPR enforcement actions average roughly €15M in fines for serious violations.",
  "Email marketing consent documentation is the most common weak point during regulator requests.",
  "Manual spreadsheet reviews miss risky records because teams rarely have complete proof fields in one place."
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasAccess = hasValidAccessToken(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  return (
    <main className="min-h-screen bg-[#0d1117]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#26384d] bg-[#111a24]/75 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="font-[var(--font-heading)] text-lg font-bold">GDPR Email Auditor</p>
            <p className="text-sm text-[#8ea2bd]">Audit email lists for GDPR compliance gaps</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
              className="rounded-xl bg-[#1f9d8f] px-4 py-2 text-sm font-semibold text-[#07161a] transition hover:bg-[#2dc2b1]"
            >
              Buy for $19/mo
            </a>
            <Link
              href={hasAccess ? "/dashboard" : "/unlock"}
              className="rounded-xl border border-[#37516d] bg-[#162638] px-4 py-2 text-sm font-semibold text-[#d6e4f2] transition hover:bg-[#20344a]"
            >
              {hasAccess ? "Open Dashboard" : "Unlock Access"}
            </Link>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-[#2a3d52] bg-gradient-to-br from-[#111b27] via-[#0f1621] to-[#161f2f] p-7 sm:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(31,157,143,0.25),transparent_65%)] lg:block" />
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#35516d] bg-[#132334] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#99b5d3]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Legal-compliance tool
          </p>
          <h1 className="max-w-3xl font-[var(--font-heading)] text-4xl font-bold leading-tight sm:text-5xl">
            Catch consent violations before your next send triggers a regulator inquiry.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[#b8cae0]">
            Upload your mailing list, detect contacts without legally defensible consent records, and get cleanup actions your team can execute in one sprint.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f9d8f] px-5 py-3 text-sm font-semibold text-[#07161a] transition hover:bg-[#2dc2b1]"
            >
              Start Compliance Subscription
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href={hasAccess ? "/dashboard" : "/unlock"}
              className="inline-flex items-center gap-2 rounded-xl border border-[#37516d] bg-[#162638] px-5 py-3 text-sm font-semibold text-[#d6e4f2] transition hover:bg-[#20344a]"
            >
              {hasAccess ? "Run New Audit" : "I Already Purchased"}
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-[#b8cae0] sm:grid-cols-3">
            <div className="rounded-xl border border-[#294058] bg-[#121e2d] p-4">
              <p className="text-xs uppercase tracking-wide text-[#84a5c8]">Average audit time</p>
              <p className="mt-2 text-2xl font-semibold text-[#e7edf5]">3 min</p>
            </div>
            <div className="rounded-xl border border-[#294058] bg-[#121e2d] p-4">
              <p className="text-xs uppercase tracking-wide text-[#84a5c8]">Data volume</p>
              <p className="mt-2 text-2xl font-semibold text-[#e7edf5]">100k+ rows</p>
            </div>
            <div className="rounded-xl border border-[#294058] bg-[#121e2d] p-4">
              <p className="text-xs uppercase tracking-wide text-[#84a5c8]">Subscription</p>
              <p className="mt-2 text-2xl font-semibold text-[#e7edf5]">$19/mo</p>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#2a3d52] bg-[#111a24]/80 p-6">
            <h2 className="mb-4 font-[var(--font-heading)] text-2xl font-semibold">The Problem</h2>
            <ul className="space-y-3 text-[#bfd0e4]">
              {problemStats.map((item) => (
                <li key={item} className="flex gap-3 rounded-lg border border-[#26384b] bg-[#0f1621] p-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ffb870]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[#2a3d52] bg-[#111a24]/80 p-6">
            <h2 className="mb-4 font-[var(--font-heading)] text-2xl font-semibold">The Solution</h2>
            <div className="space-y-3 text-[#bfd0e4]">
              <div className="rounded-lg border border-[#244536] bg-[#12251b] p-3">
                <p className="mb-1 inline-flex items-center gap-2 font-semibold text-[#80ddae]">
                  <FileSearch className="h-4 w-4" />
                  Automated list scanning
                </p>
                <p>Detect missing consent timestamp, source, and evidence metadata across every contact in your export.</p>
              </div>
              <div className="rounded-lg border border-[#4a3f1e] bg-[#2c230f] p-3">
                <p className="mb-1 inline-flex items-center gap-2 font-semibold text-[#ffd07f]">
                  <BadgeAlert className="h-4 w-4" />
                  Actionable remediation
                </p>
                <p>Get a clear suppress-now list, reconfirmation targets, and evidence backfill priorities your team can execute immediately.</p>
              </div>
              <div className="rounded-lg border border-[#234457] bg-[#10222e] p-3">
                <p className="mb-1 inline-flex items-center gap-2 font-semibold text-[#88d4ff]">
                  <CheckCircle2 className="h-4 w-4" />
                  Compliance tracking
                </p>
                <p>Track historical audits by upload and prove continuous GDPR monitoring during legal and procurement reviews.</p>
              </div>
            </div>
          </article>
        </section>

        <section id="pricing" className="mt-14 rounded-2xl border border-[#2a3d52] bg-[#111a24]/80 p-7">
          <h2 className="font-[var(--font-heading)] text-3xl font-semibold">Simple pricing for recurring compliance</h2>
          <p className="mt-2 max-w-2xl text-[#bfd0e4]">
            Designed for teams that send campaigns weekly and need defensible consent hygiene without adding legal headcount.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-xl border border-[#2f445b] bg-[#0f1621] p-5">
              <p className="text-sm uppercase tracking-wide text-[#8ea2bd]">GDPR Email Auditor</p>
              <p className="mt-2 font-[var(--font-heading)] text-4xl font-bold text-[#e7edf5]">$19<span className="text-xl font-medium text-[#8ea2bd]">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-[#c7d7ea]">
                <li>Unlimited CSV/XLS/XLSX audits</li>
                <li>Critical and warning risk classification</li>
                <li>Consent cleanup recommendations per contact</li>
                <li>Historical audit dashboard</li>
                <li>Cookie-based gated access for paid teams</li>
              </ul>
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1f9d8f] px-5 py-3 font-semibold text-[#07161a] transition hover:bg-[#2dc2b1]"
              >
                Subscribe via Stripe
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-xl border border-[#344a62] bg-[#132131] p-5">
              <p className="text-sm text-[#8ea2bd]">Why it pays for itself</p>
              <p className="mt-2 text-[#d6e4f2]">
                One prevented campaign to an improperly consented segment can offset years of subscription cost.
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="rounded-lg border border-[#2b435b] bg-[#0f1a29] p-3">
                  <dt className="text-[#8ea2bd]">Average enforcement headline</dt>
                  <dd className="mt-1 text-xl font-semibold">~€15M</dd>
                </div>
                <div className="rounded-lg border border-[#2b435b] bg-[#0f1a29] p-3">
                  <dt className="text-[#8ea2bd]">Manual audit effort</dt>
                  <dd className="mt-1 text-xl font-semibold">8-20 hrs/list</dd>
                </div>
                <div className="rounded-lg border border-[#2b435b] bg-[#0f1a29] p-3">
                  <dt className="text-[#8ea2bd]">Last updated</dt>
                  <dd className="mt-1 text-xl font-semibold">{format(new Date(), "PPP")}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-[#2a3d52] bg-[#111a24]/80 p-7">
          <h2 className="font-[var(--font-heading)] text-3xl font-semibold">FAQ</h2>
          <div className="mt-6 space-y-3">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-xl border border-[#2f445b] bg-[#0f1621] p-4">
                <h3 className="font-semibold text-[#e7edf5]">{item.question}</h3>
                <p className="mt-2 text-sm text-[#bfd0e4]">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
