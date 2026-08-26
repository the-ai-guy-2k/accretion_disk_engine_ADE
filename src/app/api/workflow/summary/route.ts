import { NextResponse } from "next/server";
import { handleError } from "@/lib/http";
import { workflowSummary } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json({ ok: true, summary: workflowSummary() });
  } catch (error) {
    return handleError(error);
  }
}
