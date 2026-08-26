import { NextResponse } from "next/server";
import { aiPublicStatus } from "@/lib/ai-config";
import { facebookConnectionConfigPublic } from "@/lib/meta-config";
import { FOUNDATION_STAGE, PRODUCT_NAME, PRODUCT_SHORT, sqliteDisplayPath } from "@/lib/config";
import { getFoundationStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const persistence = getFoundationStatus();
    return NextResponse.json({
      ok: persistence.ok,
      product: PRODUCT_NAME,
      short: PRODUCT_SHORT,
      stage: FOUNDATION_STAGE,
      persistence: {
        ...persistence,
        displayPath: sqliteDisplayPath()
      },
      ai: aiPublicStatus(),
      facebook: facebookConnectionConfigPublic()
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: PRODUCT_NAME,
        error: error instanceof Error ? error.message : "persistence init failed"
      },
      { status: 500 }
    );
  }
}
