import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional().nullable(),
  message: z.string().min(1).max(5000),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  const { name, email, phone, message } = parsed.data;

  const settings = await getSettings();

  if (process.env.AUTH_RESEND_KEY) {
    const resend = new Resend(process.env.AUTH_RESEND_KEY);
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.ee",
        to: settings.contact_email,
        replyTo: email,
        subject: `Kontaktivorm: ${name}`,
        text: `Nimi: ${name}\nE-post: ${email}\nTelefon: ${phone ?? "-"}\n\n${message}`,
      });
    } catch (error) {
      console.error("Contact email failed", error);
      return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
    }
  } else {
    console.log("[contact form — no AUTH_RESEND_KEY]", { name, email, phone, message });
  }

  return NextResponse.json({ ok: true });
}
