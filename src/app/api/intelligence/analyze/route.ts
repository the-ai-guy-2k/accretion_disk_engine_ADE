import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { analyzeAndStore } from "@/lib/analytics";
import { DETERMINISTIC_ANALYSIS_BANNER } from "@/lib/analytics-logic";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const goalId = body.goal_id == null || body.goal_id === "" ? undefined : asId(String(body.goal_id));
    const result = await analyzeAndStore(goalId, Boolean(body.is_test));
    return NextResponse.json({
      ok: true,
      banner: result.recommendation.analysis_boundary_note || DETERMINISTIC_ANALYSIS_BANNER,
      ...result
    });
  } catch (error) {
    return handleError(error);
  }
}
