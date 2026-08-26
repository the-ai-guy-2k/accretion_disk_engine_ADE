import { NextResponse } from "next/server";
import { handleError } from "@/lib/http";
import { importAcp, listAcpIntakes } from "@/lib/dgix-intake";
import { AcpValidationError } from "@/lib/acp-validate";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json({
      ok: true,
      intakes: listAcpIntakes(),
      banner:
        "ACP intake is Operator-controlled. Import is not approval and does not publish. Automatic Client QEN connectivity is not implemented."
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AcpValidationError([
        { path: "$", message: "The Campaign Package must be valid JSON. ADE did not attempt to repair it." }
      ]);
    }
    const raw =
      body && typeof body === "object" && !Array.isArray(body) && "package" in body
        ? (body as { package: unknown }).package
        : body;
    const intake = importAcp(raw);
    return NextResponse.json(
      {
        ok: true,
        intake,
        banner:
          "Imported for Operator review only. This is not approval, not ADE-generated evidence, and not Facebook publishing."
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
