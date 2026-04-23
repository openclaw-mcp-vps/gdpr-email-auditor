"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function UnlockPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/access/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to verify payment.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to verify payment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center bg-[#0d1117] px-4 py-10">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-[#2a3d52] bg-[#111a24]/85 p-7">
        <h1 className="font-[var(--font-heading)] text-3xl font-bold">Unlock your paid account</h1>
        <p className="mt-2 text-sm text-[#8ea2bd]">
          Enter the same email used during Stripe checkout. If the webhook recorded your payment, access is granted instantly.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-[#c8d8eb]">
            Billing email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#314964] bg-[#0f1621] px-3 py-2 text-[#dce8f5] outline-none ring-[#1f9d8f] placeholder:text-[#6f849e] focus:ring-2"
              placeholder="you@company.com"
            />
          </label>

          {error ? <p className="rounded-lg bg-[#f05252]/10 px-3 py-2 text-sm text-[#ff9da8]">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#1f9d8f] px-4 py-3 font-semibold text-[#07161a] transition hover:bg-[#2dc2b1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Unlock Dashboard"}
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-[#2b4258] bg-[#0f1621] p-3 text-sm text-[#8ea2bd]">
          New purchase needed?{" "}
          <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK} className="font-semibold text-[#6ee7d8] hover:text-[#98fff2]">
            Open Stripe checkout
          </a>
          .
        </div>

        <Link href="/" className="mt-4 inline-block text-sm text-[#9cb6d1] hover:text-[#d6e4f2]">
          Back to landing page
        </Link>
      </div>
    </main>
  );
}
