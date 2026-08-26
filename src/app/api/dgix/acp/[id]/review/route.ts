import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { markAcpReviewed } from "@/lib/dgix-intake";
import { WorkflowError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await readJson(request);
    const decision = String(body.decision || "reviewed");
    if (decision !== "reviewed" && decision !== "declined") {
      throw new WorkflowError("decision must be reviewed or declined");
    }
    const intake = markAcpReviewed(asId(params.id), decision);
    return NextResponse.json({
      ok: true,
      intake,
      banner:
        "Operator review recorded. This is not authorization and not Facebook publishing. Standard ADE Goal/Campaign/Draft records were not created."
    });
  } catch (error) {
    return handleError(error);
  }
}
