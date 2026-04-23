import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GDPR Email Auditor — Audit Email Lists for Compliance Gaps',
  description: 'Scan your email marketing lists to identify contacts without proper consent records, get cleanup recommendations, and track GDPR compliance status.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script defer src="https://umami.microtool.dev/script.js" data-website-id="94a066d1-5dbb-4e05-90c1-f8f1efdbb46f"></script>
      </head>
      <body className="bg-[#0d1117] text-[#c9d1d9] antialiased">{children}</body>
    </html>
  )
}
