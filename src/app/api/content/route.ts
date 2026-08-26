import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { createDraftFromSource, listContent } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const sourceParam = url.searchParams.get("source_id");
    const source_id = sourceParam ? asId(sourceParam) : undefined;
    const goalParam = url.searchParams.get("goal_id");
    const goal_id = goalParam ? asId(goalParam) : undefined;
    const campaignParam = url.searchParams.get("campaign_id");
    const campaign_id = campaignParam ? asId(campaignParam) : undefined;
    return NextResponse.json({
      ok: true,
      content: listContent({ status, source_id, goal_id, campaign_id })
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const sourceId = asId(String(body.source_id || ""));
    const goalId =
      body.goal_id == null || body.goal_id === "" ? undefined : asId(String(body.goal_id));
    const campaignId =
      body.campaign_id == null || body.campaign_id === ""
        ? undefined
        : asId(String(body.campaign_id));
    const content = createDraftFromSource(sourceId, goalId, campaignId);
    return NextResponse.json({ ok: true, content }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
