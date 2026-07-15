import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { renderInvoicePdf, type InvoicePdfSettings } from "@/lib/invoice-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const settings = await getSettings();
  const pdf = await renderInvoicePdf(invoice, settings as unknown as InvoicePdfSettings);

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Arve-${invoice.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
