import { NextResponse } from "next/server";
import { asId, handleError } from "@/lib/http";
import { generateCampaignDrafts } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = generateCampaignDrafts(asId(id));
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
