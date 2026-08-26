import { NextResponse } from "next/server";
import { handleError, readJson } from "@/lib/http";
import { validateFacebookConnection } from "@/lib/dgix-facebook";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const clientId = body.clientId == null ? undefined : String(body.clientId);
    const connection = await validateFacebookConnection({ clientId });
    return NextResponse.json({
      ok: connection.facebook === "CONNECTED",
      connection,
      banner:
        connection.realValidation === "blocked"
          ? connection.blockedReason
          : connection.facebook === "CONNECTED"
            ? "Facebook connection validated against Meta. Real publishing and paid execution are still NOT YET IMPLEMENTED. No post or ad was created."
            : "Facebook connection is not valid. Nothing was published and no advertising objects were created."
    });
  } catch (error) {
    return handleError(error);
  }
}
