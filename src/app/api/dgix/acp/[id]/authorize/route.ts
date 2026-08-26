import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { decideAcpExecution } from "@/lib/dgix-intake";
import { WorkflowError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await readJson(request);
    const decision = String(body.decision || "");
    if (decision !== "authorize" && decision !== "reject") {
      throw new WorkflowError("decision must be authorize or reject");
    }
    const intake = decideAcpExecution(
      asId(params.id),
      decision,
      body.decidedBy == null ? undefined : String(body.decidedBy)
    );
    return NextResponse.json({
      ok: true,
      intake,
      banner:
        decision === "authorize"
          ? "AUTHORIZED — PLATFORM EXECUTION NOT YET CONNECTED. DGIX did not call Facebook and did not use the Standard ADE mock publisher."
          : "Package rejected. Nothing was published."
    });
  } catch (error) {
    return handleError(error);
  }
}
