import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { getSource, updateSource } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, source: getSource(asId(id)) });
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
    const source = updateSource(asId(id), {
      goal_id:
        body.goal_id === undefined
          ? undefined
          : body.goal_id == null || body.goal_id === ""
            ? null
            : asId(String(body.goal_id))
    });
    return NextResponse.json({ ok: true, source });
  } catch (error) {
    return handleError(error);
  }
}
