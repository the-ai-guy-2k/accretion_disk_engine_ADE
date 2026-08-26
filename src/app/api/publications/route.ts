import { NextResponse } from "next/server";
import { handleError } from "@/lib/http";
import { listPublications } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json({ ok: true, publications: listPublications() });
  } catch (error) {
    return handleError(error);
  }
}
