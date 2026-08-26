import { NextResponse } from "next/server";
import { asId, handleError } from "@/lib/http";
import { generateCampaignPlan, listPlanItems } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, items: listPlanItems(asId(id)) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = generateCampaignPlan(asId(id));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}
