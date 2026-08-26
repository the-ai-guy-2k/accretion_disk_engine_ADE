import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { createCampaign, listCampaigns } from "@/lib/campaigns";
import { CAMPAIGN_STATUS } from "@/lib/schema";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json({
      ok: true,
      campaigns: listCampaigns(),
      statuses: Object.values(CAMPAIGN_STATUS)
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const campaign = createCampaign({
      title: String(body.title || ""),
      objective: body.objective == null ? undefined : String(body.objective),
      goal_id: asId(String(body.goal_id || "")),
      start_date: body.start_date == null ? undefined : String(body.start_date),
      end_date: body.end_date == null ? undefined : String(body.end_date),
      status: body.status == null ? undefined : String(body.status),
      notes: body.notes == null ? undefined : String(body.notes),
      is_test: Boolean(body.is_test)
    });
    return NextResponse.json({ ok: true, campaign }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
