import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "700"],
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gdpr-email-auditor.com"),
  title: {
    default: "GDPR Email Auditor | Audit Email Lists for Consent Gaps",
    template: "%s | GDPR Email Auditor",
  },
  description:
    "Scan email marketing lists, detect missing GDPR consent records, and launch cleanup actions before violations become fines.",
  keywords: [
    "GDPR email compliance",
    "email consent audit",
    "marketing list GDPR",
    "consent records",
    "data privacy software",
  ],
  openGraph: {
    title: "GDPR Email Auditor",
    description:
      "Find risky contacts in your email lists, generate audit evidence, and track GDPR compliance status over time.",
    url: "https://gdpr-email-auditor.com",
    siteName: "GDPR Email Auditor",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "GDPR Email Auditor dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GDPR Email Auditor",
    description:
      "Audit email lists for GDPR consent gaps and prioritize high-risk records in minutes.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} bg-[#0d1117] text-[#e6edf3] antialiased`}
        style={{ fontFamily: "var(--font-body), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
