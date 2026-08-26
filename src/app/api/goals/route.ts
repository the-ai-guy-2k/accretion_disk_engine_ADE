import { NextResponse } from "next/server";
import { handleError, readJson } from "@/lib/http";
import { createGoal, listGoals } from "@/lib/goals";
import { GOAL_STATUS, METRIC_KEYS, METRIC_LABELS } from "@/lib/schema";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json({
      ok: true,
      goals: listGoals(),
      metricKeys: METRIC_KEYS,
      metricLabels: METRIC_LABELS,
      statuses: Object.values(GOAL_STATUS)
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const goal = createGoal({
      title: String(body.title || ""),
      description: body.description == null ? undefined : String(body.description),
      target_metric: body.target_metric == null ? undefined : String(body.target_metric),
      starting_value: body.starting_value == null ? undefined : Number(body.starting_value),
      target_value: body.target_value == null ? undefined : Number(body.target_value),
      target_date: body.target_date == null ? undefined : String(body.target_date),
      status: body.status == null ? undefined : String(body.status),
      notes: body.notes == null ? undefined : String(body.notes),
      is_test: Boolean(body.is_test)
    });
    return NextResponse.json({ ok: true, goal }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
