import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  // Always return ok — never reveal whether an account exists
  const user = await db.user.findUnique({ where: { email } });
  if (user?.passwordHash && !user.disabled) {
    const token = await createPasswordResetToken(email);
    await sendPasswordResetEmail(email, token);
  }
  return NextResponse.json({ ok: true });
}
