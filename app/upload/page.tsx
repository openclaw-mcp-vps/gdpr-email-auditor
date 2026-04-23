import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { UploadWorkspace } from "@/components/UploadWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPageAccess } from "@/lib/paywall";

const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

export const metadata = {
  title: "Upload List | GDPR Email Auditor",
  description: "Upload email lists and run GDPR compliance audits."
};

export default async function UploadPage() {
  const hasAccess = await hasPageAccess();

  if (!hasAccess) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LockKeyhole className="h-6 w-6 text-cyan-400" />
            Paid Access Required
          </CardTitle>
          <CardDescription>
            The audit workspace is available to active subscribers. Complete checkout, then activate access
            from the success page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a href={stripeLink} className="block">
            <Button className="w-full">Buy Access - $19/mo</Button>
          </a>
          <Link href="/success" className="block">
            <Button variant="outline" className="w-full">
              I already completed checkout
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-100">Upload and Audit</h1>
      <p className="max-w-3xl text-sm text-slate-300 md:text-base">
        Upload your latest marketing list export and generate a GDPR compliance report with risk scoring,
        remediation actions, and export-ready cleanup segments.
      </p>
      <UploadWorkspace />
    </div>
  );
}
