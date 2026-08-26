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
    return NextResponse.json({
      ok: true,
      content: listContent({ status, source_id })
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const sourceId = asId(String(body.source_id || ""));
    const content = createDraftFromSource(sourceId);
    return NextResponse.json({ ok: true, content }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
