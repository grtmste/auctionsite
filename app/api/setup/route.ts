import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runSeed } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

/**
 * One-time browser-friendly setup endpoint: seeds the admin user, site
 * settings, content pages and sample auctions. Idempotent — safe to call
 * more than once. Protected by CRON_SECRET:
 *
 *   https://your-site.vercel.app/api/setup?secret=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET keskkonnamuutuja on seadmata — lisa see Vercelis ja proovi uuesti." },
      { status: 503 }
    );
  }
  if (request.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Vale secret" }, { status: 401 });
  }

  try {
    const log = await runSeed(db);
    return NextResponse.json({
      ok: true,
      seeded: log,
      next: "Logi sisse /logi-sisse kaudu (gertmaeste@gmail.com) ja vaheta parool /admin/seaded lehel.",
    });
  } catch (error) {
    console.error("Setup failed", error);
    return NextResponse.json(
      {
        error:
          "Seemendamine ebaõnnestus. Kontrolli, et DATABASE_URL on õige ja migratsioonid on jooksnud (need jooksevad automaatselt buildi ajal).",
      },
      { status: 500 }
    );
  }
}
