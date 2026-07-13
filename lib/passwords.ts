import { createHash, createHmac } from "crypto";
import bcrypt from "bcryptjs";

/**
 * Verifies a password against any hash format this app can encounter:
 * - bcrypt ($2a$/$2b$/$2y$) — native hashes created by this app
 * - WordPress >= 6.8 ($wp$2y$...) — bcrypt over base64(HMAC-SHA384(password, "wp-sha384"))
 * - WordPress phpass ($P$ / $H$) — legacy portable MD5 hashes
 *
 * Returns whether the password matched and whether the hash should be
 * upgraded to native bcrypt (all imported WordPress formats).
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (hash.startsWith("$wp$")) {
    const preHashed = createHmac("sha384", "wp-sha384")
      .update(password)
      .digest("base64");
    const valid = await bcrypt.compare(preHashed, hash.slice(3));
    return { valid, needsRehash: valid };
  }

  if (hash.startsWith("$P$") || hash.startsWith("$H$")) {
    const valid = phpassVerify(password, hash);
    return { valid, needsRehash: valid };
  }

  if (/^\$2[abxy]\$/.test(hash)) {
    const valid = await bcrypt.compare(password, hash);
    return { valid, needsRehash: false };
  }

  return { valid: false, needsRehash: false };
}

/* ---------------- phpass portable hashes (WordPress < 6.8) --------------- */

const ITOA64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function phpassEncode64(input: Buffer, count: number): string {
  let output = "";
  let i = 0;
  while (i < count) {
    let value = input[i++];
    output += ITOA64[value & 0x3f];
    if (i < count) value |= input[i] << 8;
    output += ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) value |= input[i] << 16;
    output += ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) break;
    output += ITOA64[(value >> 18) & 0x3f];
  }
  return output;
}

function phpassCrypt(password: string, setting: string): string {
  const countLog2 = ITOA64.indexOf(setting[3]);
  if (countLog2 < 7 || countLog2 > 30) return "*";
  const count = 1 << countLog2;
  const salt = setting.slice(4, 12);
  if (salt.length !== 8) return "*";

  const passwordBuffer = Buffer.from(password, "utf8");
  let hash = createHash("md5").update(salt).update(passwordBuffer).digest();
  for (let i = 0; i < count; i++) {
    hash = createHash("md5").update(hash).update(passwordBuffer).digest();
  }
  return setting.slice(0, 12) + phpassEncode64(hash, 16);
}

function phpassVerify(password: string, storedHash: string): boolean {
  const computed = phpassCrypt(password, storedHash);
  if (computed.length < 20) return false;
  // constant-time-ish comparison
  if (computed.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}
