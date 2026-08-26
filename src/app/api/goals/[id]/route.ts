import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { getGoal, updateGoal } from "@/lib/goals";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, goal: getGoal(asId(id)) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    const goal = updateGoal(asId(id), {
      title: body.title == null ? undefined : String(body.title),
      description: body.description == null ? undefined : String(body.description),
      target_metric: body.target_metric == null ? undefined : String(body.target_metric),
      starting_value: body.starting_value == null ? undefined : Number(body.starting_value),
      target_value: body.target_value === undefined ? undefined : body.target_value == null ? null : Number(body.target_value),
      target_date: body.target_date === undefined ? undefined : body.target_date == null ? null : String(body.target_date),
      status: body.status == null ? undefined : String(body.status),
      notes: body.notes == null ? undefined : String(body.notes)
    });
    return NextResponse.json({ ok: true, goal });
  } catch (error) {
    return handleError(error);
  }
}
