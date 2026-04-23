import { AccessActivation } from "@/components/AccessActivation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SuccessPageProps {
  searchParams?: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = (await searchParams) ?? {};
  const sessionId = params.session_id;

  if (!sessionId) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Purchase Completed?</CardTitle>
          <CardDescription>
            To activate access, open this page with your Stripe Checkout session id.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            Configure your Stripe Payment Link to redirect users to:
            <span className="ml-2 rounded bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200">
              /success?session_id={"{CHECKOUT_SESSION_ID}"}
            </span>
          </p>
          <p>
            Once redirected here, activation will verify your purchase from webhook records and unlock
            the workspace.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-slate-100">Thanks for subscribing</h1>
      <p className="text-sm text-slate-300">
        Your payment was received. Activate your account to start auditing email list compliance.
      </p>
      <AccessActivation sessionId={sessionId} />
    </div>
  );
}
