import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg rounded-xl border border-[#30363d] bg-[#161b22] p-8 text-center">
        <h1 className="font-[var(--font-heading)] text-3xl font-bold">Report Not Found</h1>
        <p className="mt-3 text-[#8b949e]">
          This audit may have been removed or the link is invalid.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
