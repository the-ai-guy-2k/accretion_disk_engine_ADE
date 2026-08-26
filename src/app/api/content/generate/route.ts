import { NextResponse } from "next/server";
import { asId, handleError, readJson } from "@/lib/http";
import { createDraftFromLiveAi } from "@/lib/workflow";
import type { GenerationDirection } from "@/lib/ai-prompt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const sourceId = asId(String(body.source_id || ""));
    const goalId =
      body.goal_id == null || body.goal_id === "" ? undefined : asId(String(body.goal_id));
    const direction: GenerationDirection = {
      platform: body.platform == null ? undefined : String(body.platform),
      purpose: body.purpose == null ? undefined : String(body.purpose),
      tone: body.tone == null ? undefined : String(body.tone),
      length: body.length == null ? undefined : String(body.length),
      extraInstruction:
        body.extra_instruction == null && body.instruction == null
          ? undefined
          : String(body.extra_instruction ?? body.instruction)
    };
    const before = Date.now();
    const content = await createDraftFromLiveAi(sourceId, direction, goalId);
    const row = content as Record<string, unknown>;
    return NextResponse.json(
      {
        ok: true,
        content,
        generation: {
          mode: row.generation_mode,
          status: row.generation_status,
          provider: row.generation_provider,
          model: row.generation_model,
          elapsedMs: Date.now() - before
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
