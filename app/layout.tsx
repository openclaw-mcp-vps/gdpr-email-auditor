import type { Metadata } from "next";
import Link from "next/link";

import "@/app/globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gdpr-email-auditor.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "GDPR Email Auditor | Audit Email Lists for Compliance Gaps",
  description:
    "Upload CSV or Excel email lists, detect missing consent evidence, and generate cleanup actions before GDPR exposure turns into a fine.",
  keywords: [
    "GDPR email compliance",
    "email consent audit",
    "marketing list compliance",
    "GDPR risk scanner",
    "email list cleanup"
  ],
  openGraph: {
    title: "GDPR Email Auditor",
    description:
      "Audit email marketing lists for consent gaps, risk level, and prioritized cleanup actions.",
    url: baseUrl,
    siteName: "GDPR Email Auditor",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "GDPR Email Auditor",
    description:
      "Detect missing consent records, estimate GDPR exposure, and export cleanup-ready actions."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-sm font-semibold tracking-wide text-slate-100">
              GDPR Email Auditor
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              <Link href="/upload" className="transition hover:text-cyan-300">
                Upload
              </Link>
              <Link href="/dashboard" className="transition hover:text-cyan-300">
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">{children}</main>
      </body>
    </html>
  );
}
