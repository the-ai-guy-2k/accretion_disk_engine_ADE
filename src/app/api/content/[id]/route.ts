import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import {
  approveContent,
  getContent,
  rejectContent,
  returnToDraft,
  tryEnqueue,
  updateDraft
} from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, content: getContent(asId(id)) });
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
    const content = updateDraft(asId(id), {
      title: body.title == null ? undefined : String(body.title),
      body: body.body == null ? undefined : String(body.body),
      goal_id:
        body.goal_id === undefined
          ? undefined
          : body.goal_id == null || body.goal_id === ""
            ? null
            : asId(String(body.goal_id))
    });
    return NextResponse.json({ ok: true, content });
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
    const notes = body.notes == null ? undefined : String(body.notes);
    const contentId = asId(id);
    if (action === "approve") {
      return NextResponse.json({ ok: true, content: approveContent(contentId, notes) });
    }
    if (action === "reject") {
      return NextResponse.json({ ok: true, content: rejectContent(contentId, notes) });
    }
    if (action === "return_to_draft") {
      return NextResponse.json({ ok: true, content: returnToDraft(contentId) });
    }
    if (action === "enqueue") {
      return NextResponse.json({ ok: true, content: tryEnqueue(contentId) });
    }
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return handleError(error);
  }
}
