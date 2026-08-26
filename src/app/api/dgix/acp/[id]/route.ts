import { NextResponse } from "next/server";
import { asId, handleError } from "@/lib/http";
import { getAcpIntake } from "@/lib/dgix-intake";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, intake: getAcpIntake(asId(id)) });
  } catch (error) {
    return handleError(error);
  }
}
