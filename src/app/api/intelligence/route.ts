import { NextResponse } from "next/server";
import { asId, handleError } from "@/lib/http";
import { latestRecommendation } from "@/lib/analytics";
import { DETERMINISTIC_ANALYSIS_BANNER } from "@/lib/analytics-logic";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const goalParam = url.searchParams.get("goal_id");
    const goalId = goalParam ? asId(goalParam) : undefined;
    return NextResponse.json({
      ok: true,
      banner: DETERMINISTIC_ANALYSIS_BANNER,
      recommendation: latestRecommendation(goalId)
    });
  } catch (error) {
    return handleError(error);
  }
}
