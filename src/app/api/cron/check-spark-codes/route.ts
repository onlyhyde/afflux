import { findExpiringSparkcodes } from "@/server/services/cron-jobs";

export async function POST(request: Request) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiring = await findExpiringSparkcodes(3);

  // Dispatch notification for each expiring spark code (lazy import to avoid build-time queue init)
  const { dispatchEvent } = await import("@/server/services/event-dispatcher");
  for (const code of expiring) {
    await dispatchEvent({
      type: "spark_code_expiring",
      tenantId: code.tenantId,
      userId: null,
      data: {
        creatorName: code.creatorId,
        code: code.code,
        expiresAt: code.expiresAt?.toISOString() ?? "",
      },
    });
  }

  return Response.json({
    checked: expiring.length,
    timestamp: new Date().toISOString(),
  });
}
