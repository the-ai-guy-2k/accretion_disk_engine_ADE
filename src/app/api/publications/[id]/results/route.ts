import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { listMetrics, recordPublicationResults } from "@/lib/analytics";
import { MANUAL_METRICS_BANNER } from "@/lib/analytics-logic";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({
      ok: true,
      banner: MANUAL_METRICS_BANNER,
      metrics: listMetrics(asId(id))
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    const result = recordPublicationResults(asId(id), {
      metrics: (body.metrics as Record<string, unknown>) || {},
      capture_method: body.capture_method == null ? undefined : String(body.capture_method),
      notes: body.notes == null ? undefined : String(body.notes),
      is_test: Boolean(body.is_test)
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}
