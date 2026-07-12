import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export async function createEmailVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.verificationToken.deleteMany({
    where: { identifier: email, type: "EMAIL_VERIFICATION" },
  });
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      type: "EMAIL_VERIFICATION",
      expires: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.verificationToken.deleteMany({
    where: { identifier: email, type: "PASSWORD_RESET" },
  });
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      type: "PASSWORD_RESET",
      expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  return token;
}

/** Returns the token owner's email, or null when invalid/expired. Consumes the token. */
export async function consumeToken(
  token: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"
): Promise<string | null> {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.type !== type) return null;
  await db.verificationToken.delete({ where: { token } });
  if (record.expires < new Date()) return null;
  return record.identifier;
}

/** Peek at a token without consuming it (for showing the reset form) */
export async function peekToken(
  token: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"
): Promise<string | null> {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.type !== type || record.expires < new Date()) return null;
  return record.identifier;
}
