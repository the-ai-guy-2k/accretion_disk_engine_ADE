import { NextResponse } from "next/server";
import { asId, handleError } from "@/lib/http";
import { latestRecommendation } from "@/lib/analytics";
import { DETERMINISTIC_ANALYSIS_BANNER } from "@/lib/analytics-logic";
import { aiPublicStatus } from "@/lib/ai-config";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const goalParam = url.searchParams.get("goal_id");
    const goalId = goalParam ? asId(goalParam) : undefined;
    const recommendation = latestRecommendation(goalId);
    return NextResponse.json({
      ok: true,
      banner: recommendation
        ? String(recommendation.analysis_boundary_note || DETERMINISTIC_ANALYSIS_BANNER)
        : DETERMINISTIC_ANALYSIS_BANNER,
      recommendation,
      ai: aiPublicStatus()
    });
  } catch (error) {
    return handleError(error);
  }
}
