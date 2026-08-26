import { NextResponse } from "next/server";
import { aiPublicStatus } from "@/lib/ai-config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, ai: aiPublicStatus() });
}
