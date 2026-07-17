import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(3).max(50),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  regNumber: z.string().min(1).max(50),
  location: z.string().max(200).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  wantBuyout: z.boolean().optional(),
  wantTransport: z.boolean().optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  const d = parsed.data;
  const settings = await getSettings();

  const lines = [
    `Nimi: ${d.name}`,
    `E-post: ${d.email}`,
    `Telefon: ${d.phone}`,
    `Sõiduk: ${d.make} ${d.model}`,
    `Reg nr: ${d.regNumber}`,
    `Asukoht: ${d.location || "-"}`,
    `Soovib väljaostu pakkumist: ${d.wantBuyout ? "JAH" : "ei"}`,
    `Soovib transpordi pakkumist: ${d.wantTransport ? "JAH" : "ei"}`,
    "",
    d.message || "(sõnum puudub)",
    "",
    d.images?.length ? `Pildid:\n${d.images.join("\n")}` : "Pilte pole lisatud",
  ];

  if (process.env.AUTH_RESEND_KEY) {
    const resend = new Resend(process.env.AUTH_RESEND_KEY);
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.ee",
        to: settings.contact_email,
        replyTo: d.email,
        subject: `Personaalne pakkumine: ${d.make} ${d.model} (${d.regNumber})`,
        text: lines.join("\n"),
      });
    } catch (error) {
      console.error("Personal offer email failed", error);
      return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
    }
  } else {
    console.log("[personal offer — no AUTH_RESEND_KEY]", lines.join("\n"));
  }

  return NextResponse.json({ ok: true });
}
