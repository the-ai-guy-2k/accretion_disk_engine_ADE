import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { getCampaign, updateCampaign } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, campaign: getCampaign(asId(id)) });
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
    const campaign = updateCampaign(asId(id), {
      title: body.title == null ? undefined : String(body.title),
      objective: body.objective == null ? undefined : String(body.objective),
      status: body.status == null ? undefined : String(body.status),
      start_date:
        body.start_date === undefined
          ? undefined
          : body.start_date == null
            ? null
            : String(body.start_date),
      end_date:
        body.end_date === undefined ? undefined : body.end_date == null ? null : String(body.end_date),
      notes: body.notes == null ? undefined : String(body.notes)
    });
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    return handleError(error);
  }
}
