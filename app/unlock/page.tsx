import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClaimAccessForm } from "@/components/ClaimAccessForm";

export default function UnlockPage() {
  return (
    <main className="min-h-screen px-6 py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8b949e] hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to landing page
        </Link>

        <div className="max-w-2xl">
          <h1 className="font-[var(--font-heading)] text-4xl font-bold">Unlock Your Workspace</h1>
          <p className="mt-3 text-[#8b949e]">
            Complete checkout with Stripe, then verify the purchase email below to activate secure
            cookie-based access for this browser.
          </p>
        </div>

        <ClaimAccessForm showLogout />
      </div>
    </main>
  );
}
