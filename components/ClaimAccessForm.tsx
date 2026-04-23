"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClaimAccessFormProps {
  showLogout?: boolean;
}

export function ClaimAccessForm({ showLogout = false }: ClaimAccessFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClaimAccess = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to verify purchase.");
      }

      setMessage("Access unlocked. Redirecting to your dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Unable to unlock access.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setMessage(null);

    await fetch("/api/access/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-[#2f81f7]" />
          Unlock Paid Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#8b949e]">
          Enter the same email used at Stripe checkout. Once your payment webhook is recorded,
          we set a secure access cookie for this browser.
        </p>

        <div className="space-y-2">
          <label htmlFor="claim-email" className="text-sm font-medium text-[#c9d1d9]">
            Purchase Email
          </label>
          <Input
            id="claim-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (!isLoading) {
                  void handleClaimAccess();
                }
              }
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void handleClaimAccess()} disabled={isLoading || !email}>
            {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verify Purchase
          </Button>
          {showLogout ? (
            <Button variant="outline" onClick={() => void handleLogout()} className="gap-2">
              <LogOut className="h-4 w-4" />
              Clear Access Cookie
            </Button>
          ) : null}
        </div>

        {message ? (
          <div className="rounded-lg border border-[#3fb950]/30 bg-[#3fb950]/10 p-3 text-sm text-[#3fb950]">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#ff7b72]">
            {error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
