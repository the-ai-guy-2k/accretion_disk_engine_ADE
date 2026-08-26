import { NextResponse } from "next/server";
import { handleError, readJson } from "@/lib/http";
import { createSource, listSources } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json({ ok: true, sources: listSources() });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const source = createSource({
      title: String(body.title || ""),
      body: String(body.body || ""),
      source_type: String(body.source_type || ""),
      activity_date: String(body.activity_date || ""),
      provenance: String(body.provenance || ""),
      notes: String(body.notes || ""),
      is_test: Boolean(body.is_test)
    });
    return NextResponse.json({ ok: true, source }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
