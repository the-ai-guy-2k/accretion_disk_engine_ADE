import { NextResponse } from "next/server";
import { handleError } from "@/lib/http";
import { facebookConnectionPublicStatus } from "@/lib/dgix-facebook";
import { facebookConnectionConfigPublic } from "@/lib/meta-config";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const connection = facebookConnectionPublicStatus();
    return NextResponse.json({
      ok: true,
      connection,
      config: facebookConnectionConfigPublic(),
      banner:
        "Facebook connection status does not publish content and does not create ads. Tokens are not included in this response."
    });
  } catch (error) {
    return handleError(error);
  }
}
