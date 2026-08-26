import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import {
  confirmMockPublish,
  failMockPublish,
  getPublication,
  handToAdapter,
  retryFailedPublication
} from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, publication: getPublication(asId(id)) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    const action = String(body.action || "");
    const publicationId = asId(id);
    if (action === "hand_to_adapter") {
      return NextResponse.json({ ok: true, ...handToAdapter(publicationId) });
    }
    if (action === "confirm") {
      return NextResponse.json({ ok: true, ...confirmMockPublish(publicationId) });
    }
    if (action === "fail") {
      return NextResponse.json({
        ok: true,
        ...failMockPublish(publicationId, body.reason == null ? undefined : String(body.reason))
      });
    }
    if (action === "retry") {
      return NextResponse.json({ ok: true, publication: retryFailedPublication(publicationId) });
    }
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return handleError(error);
  }
}
