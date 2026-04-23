"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessActivationProps {
  sessionId: string;
}

export function AccessActivation({ sessionId }: AccessActivationProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activateAccess = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/access/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email: email || undefined })
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to activate access.");
      }

      setMessage("Access activated. Redirecting to upload workspace...");
      setTimeout(() => router.push("/upload"), 700);
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error ? caughtError.message : "Unable to activate access.";
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Activate Your Access</CardTitle>
        <CardDescription>
          We verify your Stripe checkout session with recorded webhook events before granting access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
            Purchase email (optional, for extra verification)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-500 placeholder:text-slate-500 focus:ring-2"
          />
        </div>

        <Button onClick={activateAccess} disabled={loading} className="w-full">
          {loading ? "Verifying purchase..." : "Activate paid access"}
        </Button>

        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
