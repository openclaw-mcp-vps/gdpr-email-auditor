import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gdpr-email-auditor.com"),
  title: {
    default: "GDPR Email Auditor",
    template: "%s | GDPR Email Auditor"
  },
  description:
    "Audit marketing email lists for consent gaps, suppress risky contacts, and keep GDPR compliance evidence in one dashboard.",
  keywords: [
    "GDPR",
    "email compliance",
    "consent audit",
    "marketing compliance",
    "email list cleanup"
  ],
  openGraph: {
    title: "GDPR Email Auditor",
    description:
      "Scan CSV and Excel mailing lists to find missing consent records before they become seven-figure fines.",
    type: "website",
    url: "https://gdpr-email-auditor.com",
    siteName: "GDPR Email Auditor"
  },
  twitter: {
    card: "summary_large_image",
    title: "GDPR Email Auditor",
    description:
      "Spot missing consent records and fix risky marketing contacts in minutes."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${heading.variable} ${body.variable} bg-[#0d1117] text-[#e7edf5] antialiased`}>
        {children}
      </body>
    </html>
  );
}
