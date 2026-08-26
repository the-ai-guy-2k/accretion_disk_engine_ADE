import { NextResponse } from "next/server";
import { asId, handleError } from "@/lib/http";
import { analyticsSnapshot } from "@/lib/analytics";
import { HIERARCHY, MANUAL_METRICS_BANNER } from "@/lib/analytics-logic";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const goalParam = url.searchParams.get("goal_id");
    const goalId = goalParam ? asId(goalParam) : undefined;
    return NextResponse.json({
      ok: true,
      banner: MANUAL_METRICS_BANNER,
      hierarchy: HIERARCHY,
      analytics: analyticsSnapshot(goalId)
    });
  } catch (error) {
    return handleError(error);
  }
}
