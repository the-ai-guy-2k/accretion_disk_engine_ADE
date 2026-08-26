import { NextResponse } from "next/server";
import { WorkflowError } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export function asId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new WorkflowError("Invalid id", 400);
  }
  return id;
}

export function handleError(error: unknown) {
  if (error instanceof WorkflowError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    if (body && typeof body === "object") {
      return body as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}
