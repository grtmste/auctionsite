import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createEmailVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(50),
  company: z.string().max(200).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.create({
    data: {
      email,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      company: parsed.data.company?.trim() || null,
      passwordHash,
    },
  });

  const token = await createEmailVerificationToken(email);
  await sendVerificationEmail(email, token);

  return NextResponse.json({ ok: true });
}
