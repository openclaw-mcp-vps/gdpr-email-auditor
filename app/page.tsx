import Link from "next/link";
import { CheckCircle2, FileWarning, Shield, Sparkles, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

const faqs = [
  {
    question: "What files can I upload?",
    answer:
      "CSV, XLSX, and XLS exports from Klaviyo, HubSpot, Mailchimp, Shopify, and most CRMs are supported."
  },
  {
    question: "What does the audit check?",
    answer:
      "Each contact is evaluated for explicit consent, consent timestamp evidence, source traceability, and stale consent risk."
  },
  {
    question: "Can I export cleanup-ready lists?",
    answer:
      "Yes. You can export non-compliant contacts as CSV plus a full JSON audit report for legal and operations teams."
  },
  {
    question: "How is access controlled?",
    answer:
      "The workspace is behind a cookie-based paywall that unlocks only after a successful Stripe purchase verification."
  }
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-12">
      <section className="grid items-center gap-10 pt-4 md:grid-cols-2 md:pt-10">
        <div>
          <p className="mb-3 inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            Legal-compliance • $19/month
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 md:text-5xl">
            Audit email lists for GDPR compliance gaps before they become expensive violations.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-300 md:text-lg">
            GDPR fines average €15M. Email marketing without provable consent is the most common violation,
            and manual audits do not scale. GDPR Email Auditor scans your list, flags missing proof, and gives
            your team a cleanup plan you can execute today.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href={stripeLink} className="inline-flex">
              <Button size="lg">Buy Now - $19/mo</Button>
            </a>
            <Link href="/upload">
              <Button variant="outline" size="lg">
                Open Workspace
              </Button>
            </Link>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            After checkout, set your Stripe Payment Link to redirect users to
            <span className="font-mono text-slate-300">
              {" /success?session_id={CHECKOUT_SESSION_ID}"}
            </span>
            so access can be activated automatically.
          </p>
        </div>

        <Card className="border-cyan-500/25 bg-gradient-to-b from-slate-900 to-slate-950">
          <CardHeader>
            <CardTitle className="text-xl">What You Get in 60 Seconds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <Feature text="Detect contacts missing explicit consent records" />
            <Feature text="Find missing opt-in dates and unverifiable data sources" />
            <Feature text="Calculate risk level and estimated fine exposure" />
            <Feature text="Export non-compliant contacts for immediate suppression" />
            <Feature text="Track compliance trend across data sources and lists" />
          </CardContent>
        </Card>
      </section>

      <section id="problem" className="grid gap-6 md:grid-cols-3">
        <ProblemCard
          icon={FileWarning}
          title="Manual audits break at scale"
          description="Marketing teams inherit fragmented data from forms, imports, and sync jobs. Validating consent contact-by-contact is too slow and too error-prone."
        />
        <ProblemCard
          icon={TrendingDown}
          title="Compliance debt quietly grows"
          description="Lists age, source metadata disappears, and campaigns keep sending. Exposure compounds until a complaint or regulator review forces emergency cleanup."
        />
        <ProblemCard
          icon={Shield}
          title="Regulatory downside is asymmetric"
          description="A single non-compliant campaign can trigger legal review, list suppression, and major fines that dwarf the cost of prevention."
        />
      </section>

      <section id="solution" className="space-y-5">
        <h2 className="text-3xl font-bold text-slate-100">A focused workflow for compliance teams and marketers</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <SolutionCard
            number="01"
            title="Upload"
            description="Drop in a CSV or Excel list from your CRM or ESP."
          />
          <SolutionCard
            number="02"
            title="Audit"
            description="Automatically score consent quality, source traceability, and stale permissions."
          />
          <SolutionCard
            number="03"
            title="Remediate"
            description="Export suppression and cleanup lists with a prioritized action plan."
          />
        </div>
      </section>

      <section id="pricing" className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Simple pricing for continuous compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <p>
              Perfect for e-commerce brands, SaaS teams, and agencies that manage outbound campaigns and
              cannot risk sending to contacts without lawful basis evidence.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-400" />
                Unlimited list uploads and audits
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-400" />
                Risk scoring with estimated fine exposure
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-400" />
                Export non-compliant contacts and full reports
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-400" />
                Dashboard for historical compliance tracking
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/30 bg-slate-950/80">
          <CardHeader>
            <CardTitle className="text-2xl">$19 / month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">
              Start protecting every campaign with auditable consent checks.
            </p>
            <a href={stripeLink} className="block">
              <Button className="w-full" size="lg">
                Continue to Stripe Checkout
              </Button>
            </a>
            <p className="text-xs text-slate-500">
              Hosted Stripe checkout. No embedded payment forms, no custom card handling.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="faq" className="space-y-4">
        <h2 className="text-3xl font-bold text-slate-100">FAQ</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardContent className="pt-6">
                <p className="font-semibold text-slate-100">{faq.question}</p>
                <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/10 p-8 text-center">
        <Sparkles className="mx-auto mb-3 h-7 w-7 text-cyan-300" />
        <h2 className="text-2xl font-bold text-slate-100">Turn compliance from fire drills into routine operations</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
          Run every campaign with confidence by proving consent quality before send time.
        </p>
        <div className="mt-6 flex justify-center">
          <a href={stripeLink}>
            <Button size="lg">Buy Now - Secure Hosted Checkout</Button>
          </a>
        </div>
      </section>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-400" />
      <p>{text}</p>
    </div>
  );
}

function ProblemCard({
  icon: Icon,
  title,
  description
}: {
  icon: typeof FileWarning;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Icon className="mb-3 h-6 w-6 text-orange-300" />
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      </CardContent>
    </Card>
  );
}

function SolutionCard({
  number,
  title,
  description
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-semibold tracking-wider text-cyan-300">STEP {number}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      </CardContent>
    </Card>
  );
}
