import { NextRequest, NextResponse } from "next/server";
import { runStatusTransitions } from "@/lib/auction-status";

export const dynamic = "force-dynamic";

/** Vercel Cron endpoint — auto-transitions expired auction statuses */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  }
  const transitioned = await runStatusTransitions();
  return NextResponse.json({ ok: true, transitioned });
}
