import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { listCampaignSources, setCampaignSources } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, sources: listCampaignSources(asId(id)) });
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
    const raw = Array.isArray(body.source_ids) ? body.source_ids : [];
    const sourceIds = raw.map((value) => asId(String(value)));
    const sources = setCampaignSources(asId(id), sourceIds);
    return NextResponse.json({ ok: true, sources });
  } catch (error) {
    return handleError(error);
  }
}
