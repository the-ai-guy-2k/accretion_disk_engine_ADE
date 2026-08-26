import { NextResponse } from "next/server";
import { asId, handleError } from "@/lib/http";
import { executeAuthorizedOrganicAcp } from "@/lib/dgix-execute";
import { BLOCKED_PUBLISH } from "@/lib/facebook-resolve";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const result = await executeAuthorizedOrganicAcp(asId(params.id));
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          executed: false,
          error: result.message,
          code: result.code,
          intake: result.intake,
          execution: result.execution,
          banner: `EXECUTION FAILED. ${result.message}`
        },
        { status: 502 }
      );
    }
    return NextResponse.json({
      ok: true,
      executed: true,
      intake: result.intake,
      execution: result.execution,
      banner: `EXECUTED. Facebook object ${result.execution.externalObjectId} at ${result.execution.completedAt}.`
    });
  } catch (error) {
    const handled = handleError(error);
    if (
      handled.status === 409 &&
      typeof error === "object" &&
      error &&
      "message" in error &&
      String((error as { message: string }).message).includes("CREDENTIAL/ASSET INPUT REQUIRED")
    ) {
      const body = await handled.json();
      return NextResponse.json(
        {
          ...body,
          executed: false,
          blocked: true,
          blockedReason: BLOCKED_PUBLISH
        },
        { status: 409 }
      );
    }
    return handled;
  }
}
