import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { analyzeGdprCompliance } from "@/lib/gdpr-analyzer";
import { getDataset, saveAudit } from "@/lib/database";
import { hasApiAccess } from "@/lib/paywall";

export const runtime = "nodejs";

const requestSchema = z.object({
  datasetId: z.string().min(1),
  listName: z.string().min(1).optional()
});

export async function POST(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json(
      { error: "Paid access is required. Complete checkout before running audits." },
      { status: 402 }
    );
  }

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const dataset = getDataset(parsed.data.datasetId);
    if (!dataset) {
      return NextResponse.json({ error: "Uploaded dataset not found." }, { status: 404 });
    }

    const report = analyzeGdprCompliance(parsed.data.listName ?? dataset.filename, dataset.contacts);
    saveAudit(report);

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
