"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { triggerAuctionEvent } from "@/lib/pusher";
import { sendAuctionWonEmail } from "@/lib/email";
import { localized } from "@/lib/utils";
import type { AuctionStatus, AuctionType, InvoiceStatus, PhoneBidStatus, Role } from "@prisma/client";

/* ------------------------------ Auctions ------------------------------ */

const localizedText = z.record(z.string(), z.string());

const auctionSchema = z.object({
  id: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PHONE_AUCTION", "ENDED", "SOLD", "CANCELLED"]),
  auctionType: z.enum(["REGULAR", "PARTS", "OTHER"]),
  title: localizedText,
  description: localizedText.optional(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().nullable().optional(),
  firstRegDate: z.string().nullable().optional(),
  regNumber: z.string().nullable().optional(),
  vinCode: z.string().nullable().optional(),
  fuelType: z.string().nullable().optional(),
  engineVolume: z.number().nullable().optional(),
  enginePower: z.number().int().nullable().optional(),
  gearbox: z.string().nullable().optional(),
  drivenAxle: z.string().nullable().optional(),
  odometer: z.number().int().nullable().optional(),
  climateControl: z.string().nullable().optional(),
  seats: z.number().int().nullable().optional(),
  color: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  vatPercent: z.number().int().min(0).max(100),
  customAttributes: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional(),
  startingPrice: z.number().positive(),
  bidIncrement: z.number().positive(),
  reservePrice: z.number().positive().nullable().optional(),
  auctionStart: z.string(),
  auctionEnd: z.string(),
  phoneAuctionActive: z.boolean(),
  vendorId: z.string().nullable().optional(),
  images: z.array(
    z.object({
      url: z.string().url(),
      alt: z.string().nullable().optional(),
    })
  ),
});

export type AuctionFormInput = z.infer<typeof auctionSchema>;

export async function saveAuction(input: AuctionFormInput) {
  const admin = await requireAdmin();
  const data = auctionSchema.parse(input);

  const etTitle = data.title.et || Object.values(data.title)[0] || "oksjon";
  const baseData = {
    status: data.status as AuctionStatus,
    auctionType: data.auctionType as AuctionType,
    title: data.title,
    description: data.description ?? {},
    make: data.make,
    model: data.model,
    year: data.year ?? null,
    firstRegDate: data.firstRegDate || null,
    regNumber: data.regNumber || null,
    vinCode: data.vinCode || null,
    fuelType: data.fuelType || null,
    engineVolume: data.engineVolume ?? null,
    enginePower: data.enginePower ?? null,
    gearbox: data.gearbox || null,
    drivenAxle: data.drivenAxle || null,
    odometer: data.odometer ?? null,
    climateControl: data.climateControl || null,
    seats: data.seats ?? null,
    color: data.color || null,
    condition: data.condition || null,
    vatPercent: data.vatPercent,
    customAttributes: data.customAttributes ?? [],
    startingPrice: data.startingPrice,
    bidIncrement: data.bidIncrement,
    reservePrice: data.reservePrice ?? null,
    auctionStart: new Date(data.auctionStart),
    auctionEnd: new Date(data.auctionEnd),
    phoneAuctionActive: data.phoneAuctionActive,
    vendorId: data.vendorId || null,
  };

  let auctionId = data.id;
  if (auctionId) {
    await db.auction.update({ where: { id: auctionId }, data: baseData });
  } else {
    // Unique slug from the Estonian title
    const base = slugify(etTitle) || "oksjon";
    let slug = base;
    let attempt = 1;
    while (await db.auction.findUnique({ where: { slug } })) {
      slug = `${base}-${++attempt}`;
    }
    const created = await db.auction.create({
      data: { ...baseData, slug, createdBy: admin.id },
    });
    auctionId = created.id;
  }

  // Replace image set (preserves given order)
  await db.auctionImage.deleteMany({ where: { auctionId } });
  if (data.images.length > 0) {
    await db.auctionImage.createMany({
      data: data.images.slice(0, 20).map((image, index) => ({
        auctionId: auctionId!,
        url: image.url,
        alt: image.alt ?? null,
        sortOrder: index,
      })),
    });
  }

  revalidatePath("/admin/oksjonid");
  return { ok: true, id: auctionId };
}

export async function deleteAuction(id: string) {
  await requireAdmin();
  await db.$transaction([
    db.bid.deleteMany({ where: { auctionId: id } }),
    db.phoneBid.deleteMany({ where: { auctionId: id } }),
    db.auction.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/oksjonid");
  return { ok: true };
}

/* ------------------------------- Users -------------------------------- */

export async function setUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();
  if (userId === admin.id && role !== "ADMIN") {
    return { ok: false, error: "SELF_DEMOTE" };
  }
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/kasutajad");
  return { ok: true };
}

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(["USER", "VENDOR", "ADMIN"]),
  password: z.string().min(8),
});

/** Admin creates an account directly (e.g. an insurance-broker vendor). */
export async function createUser(input: z.infer<typeof createUserSchema>) {
  await requireAdmin();
  const data = createUserSchema.parse(input);
  const email = data.email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, error: "EMAIL_EXISTS" };

  await db.user.create({
    data: {
      name: data.name.trim(),
      email,
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      role: data.role as Role,
      passwordHash: await bcrypt.hash(data.password, 12),
      // Admin-created accounts are considered verified.
      emailVerified: new Date(),
    },
  });
  revalidatePath("/admin/kasutajad");
  return { ok: true as const };
}

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(["USER", "VENDOR", "ADMIN"]),
  // Optional: only set when the admin wants to reset the password.
  password: z.string().min(8).optional().or(z.literal("")),
});

/** Admin edits an existing account: details, email, role and (optionally) password. */
export async function updateUser(input: z.infer<typeof updateUserSchema>) {
  const admin = await requireAdmin();
  const data = updateUserSchema.parse(input);
  const email = data.email.trim().toLowerCase();

  // Prevent an admin from demoting themselves out of the admin role.
  if (data.id === admin.id && data.role !== "ADMIN") {
    return { ok: false as const, error: "SELF_DEMOTE" };
  }

  // Email must stay unique across other accounts.
  const clash = await db.user.findUnique({ where: { email } });
  if (clash && clash.id !== data.id) {
    return { ok: false as const, error: "EMAIL_EXISTS" };
  }

  await db.user.update({
    where: { id: data.id },
    data: {
      name: data.name.trim(),
      email,
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      role: data.role as Role,
      ...(data.password
        ? { passwordHash: await bcrypt.hash(data.password, 12) }
        : {}),
    },
  });
  revalidatePath("/admin/kasutajad");
  return { ok: true as const };
}

export async function verifyUser(userId: string) {
  await requireAdmin();
  await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });
  revalidatePath("/admin/kasutajad");
  return { ok: true };
}

export async function setUserDisabled(userId: string, disabled: boolean) {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { ok: false, error: "SELF_DISABLE" };
  }
  await db.user.update({ where: { id: userId }, data: { disabled } });
  revalidatePath("/admin/kasutajad");
  return { ok: true };
}

/* ------------------------------ Settings ------------------------------ */

export async function saveSettings(settings: Record<string, string>) {
  await requireAdmin();
  const allowedKeys = [
    "min_bid_increment",
    "contact_phone_info",
    "contact_phone_tow",
    "contact_email",
    "business_name",
    "business_reg",
    "business_address",
    "business_hours",
    "logo_url",
    "partner_bta_url",
    "partner_gjensidige_url",
    "partner_seesam_url",
    "business_vat_no",
    "bank_name",
    "bank_iban",
    "bank_bic",
    "invoice_default_vat",
    "invoice_due_days",
    "invoice_note",
  ];
  for (const [key, value] of Object.entries(settings)) {
    if (!allowedKeys.includes(key)) continue;
    await db.siteSettings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  revalidateTag("settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveAdminProfile(input: {
  name: string;
  email: string;
  currentPassword: string;
  newPassword?: string | null;
}) {
  const admin = await requireAdmin();
  const user = await db.user.findUnique({ where: { id: admin.id } });
  if (!user?.passwordHash) return { ok: false, error: "UNAUTHORIZED" };

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) return { ok: false, error: "WRONG_PASSWORD" };

  const email = input.email.trim().toLowerCase();
  if (email !== user.email) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "EMAIL_EXISTS" };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: input.name.trim(),
      email,
      ...(input.newPassword
        ? { passwordHash: await bcrypt.hash(input.newPassword, 12) }
        : {}),
    },
  });
  return { ok: true };
}

/* ---------------------------- Translations ---------------------------- */

export async function saveTranslation(key: string, language: string, value: string) {
  await requireAdmin();
  if (value.trim() === "") {
    await db.translation.deleteMany({ where: { key, language } });
  } else {
    await db.translation.upsert({
      where: { key_language: { key, language } },
      create: { key, language, value },
      update: { value },
    });
  }
  revalidateTag("translations");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function savePageContent(
  slug: string,
  content: Record<string, string>
) {
  await requireAdmin();
  await db.page.upsert({
    where: { slug },
    create: { slug, content },
    update: { content },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------------------- Phone auction --------------------------- */

const phoneBidSchema = z.object({
  id: z.string().optional(),
  auctionId: z.string().min(1),
  bidderName: z.string().min(1).max(200),
  bidderPhone: z.string().max(50).nullable().optional(),
  bidderUserId: z.string().nullable().optional(),
  amount: z.number().positive(),
  status: z.enum(["CONTACTED", "CONFIRMED", "DECLINED", "NO_ANSWER"]),
  notes: z.string().max(2000).nullable().optional(),
});

export type PhoneBidInput = z.infer<typeof phoneBidSchema>;

export async function savePhoneBid(input: PhoneBidInput) {
  const admin = await requireAdmin();
  const data = phoneBidSchema.parse(input);

  if (data.id) {
    await db.phoneBid.update({
      where: { id: data.id },
      data: {
        bidderName: data.bidderName,
        bidderPhone: data.bidderPhone || null,
        bidderUserId: data.bidderUserId || null,
        amount: data.amount,
        status: data.status as PhoneBidStatus,
        notes: data.notes || null,
      },
    });
  } else {
    await db.phoneBid.create({
      data: {
        auctionId: data.auctionId,
        bidderName: data.bidderName,
        bidderPhone: data.bidderPhone || null,
        bidderUserId: data.bidderUserId || null,
        amount: data.amount,
        status: data.status as PhoneBidStatus,
        notes: data.notes || null,
        recordedBy: admin.name ?? admin.email,
      },
    });
  }
  await syncPhoneBidToAuction(data.auctionId);
  revalidatePath("/admin/telefonoksjon");
  return { ok: true };
}

/**
 * Confirmed phone bids are public: the auction's current bid and the live
 * bid history reflect the best confirmed phone bid immediately.
 */
async function syncPhoneBidToAuction(auctionId: string) {
  const auction = await db.auction.findUnique({
    where: { id: auctionId },
    include: {
      phoneBids: { where: { status: "CONFIRMED" }, orderBy: { amount: "desc" }, take: 1 },
      bids: { orderBy: { amount: "desc" }, take: 1 },
    },
  });
  if (!auction) return;

  const bestWeb = auction.bids[0]?.amount ?? 0;
  const bestPhone = auction.phoneBids[0]?.amount ?? 0;
  const best = Math.max(bestWeb, bestPhone);
  if (best <= 0) return;

  if (auction.currentBid !== best) {
    await db.auction.update({
      where: { id: auctionId },
      data: {
        currentBid: best,
        reserveMet: !auction.reservePrice || best >= auction.reservePrice,
      },
    });
  }

  const { serializePublicBids } = await import("@/lib/bids");
  const bids = await serializePublicBids(auctionId);
  await triggerAuctionEvent(auctionId, "bid-placed", { amount: best, bids });
}

export async function deletePhoneBid(id: string) {
  await requireAdmin();
  const deleted = await db.phoneBid.delete({ where: { id } });
  await syncPhoneBidToAuction(deleted.auctionId);
  revalidatePath("/admin/telefonoksjon");
  return { ok: true };
}

/** Close a phone auction: record the winning bid and final status */
export async function closePhoneAuction(auctionId: string) {
  await requireAdmin();
  const auction = await db.auction.findUnique({
    where: { id: auctionId },
    include: {
      phoneBids: {
        where: { status: "CONFIRMED" },
        orderBy: { amount: "desc" },
        take: 1,
      },
    },
  });
  if (!auction) return { ok: false, error: "NOT_FOUND" };

  const winner = auction.phoneBids[0];
  const finalPrice = winner?.amount ?? null;
  const sold =
    finalPrice != null &&
    (!auction.reservePrice || finalPrice >= auction.reservePrice);

  await db.auction.update({
    where: { id: auctionId },
    data: {
      status: sold ? "SOLD" : "ENDED",
      finalPrice: sold ? finalPrice : null,
      currentBid: finalPrice ?? auction.currentBid,
      reserveMet: sold,
      phoneAuctionEnd: new Date(),
    },
  });

  await triggerAuctionEvent(auctionId, "auction-ended", {
    auctionId,
    finalPrice: sold ? finalPrice : null,
  });

  // Notify the winner when they are a registered user
  if (sold && winner?.bidderUserId) {
    const winnerUser = await db.user.findUnique({
      where: { id: winner.bidderUserId },
    });
    if (winnerUser) {
      await sendAuctionWonEmail(
        winnerUser.email,
        localized(auction.title, "et"),
        winner.amount,
        auction.slug
      );
    }
  }

  revalidatePath("/admin/telefonoksjon");
  return { ok: true };
}

/* --------------------------- WordPress import -------------------------- */

interface WpUserRow {
  login: string;
  email: string;
  hash: string;
  name: string;
}

/**
 * Parses a WordPress user export. Accepts:
 * - CSV lines: user_login,user_email,user_pass,display_name
 * - JSON array: [{user_login, user_email, user_pass, display_name}, ...]
 * Passwords keep their WordPress hash ($P$… or $wp$…) and are verified with
 * the phpass/WP algorithm at login, then upgraded to bcrypt automatically.
 */
export async function importWordpressUsers(raw: string) {
  await requireAdmin();

  const rows: WpUserRow[] = [];
  const trimmed = raw.trim();

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (item?.user_email && item?.user_pass) {
          rows.push({
            login: String(item.user_login ?? ""),
            email: String(item.user_email),
            hash: String(item.user_pass),
            name: String(item.display_name ?? item.user_login ?? ""),
          });
        }
      }
    } catch {
      return { ok: false as const, error: "JSON_PARSE" };
    }
  } else {
    for (const line of trimmed.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const parts = line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""));
      if (parts.length < 3) continue;
      // header row
      if (/user_login/i.test(parts[0])) continue;
      rows.push({
        login: parts[0],
        email: parts[1],
        hash: parts[2],
        name: parts[3] ?? parts[0],
      });
    }
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !row.hash.startsWith("$")) {
      errors.push(email || row.login);
      continue;
    }
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      skipped++;
      continue;
    }
    await db.user.create({
      data: {
        email,
        name: row.name || row.login,
        passwordHash: row.hash,
        emailVerified: new Date(), // WordPress users are already established
      },
    });
    created++;
  }

  revalidatePath("/admin/kasutajad");
  return { ok: true as const, created, skipped, invalid: errors.length };
}

/* ------------------------- romu.ee content import ---------------------- */

export async function importRomuContent(translate: boolean) {
  await requireAdmin();
  const { importFromRomu } = await import("@/lib/romu-import");
  const result = await importFromRomu({ translate });
  revalidateTag("settings");
  revalidatePath("/", "layout");
  return result;
}

/* ---------------------------- Auto-translate --------------------------- */

/** Translate a content page from Estonian into the given languages. */
export async function autoTranslatePage(slug: string, targetLangs: string[]) {
  await requireAdmin();
  const { translateHtml, translationAvailable } = await import("@/lib/translate");
  if (!translationAvailable()) {
    return { ok: false as const, error: "NO_API_KEY" };
  }

  const page = await db.page.findUnique({ where: { slug } });
  const content =
    page?.content && typeof page.content === "object"
      ? ({ ...(page.content as Record<string, string>) } as Record<string, string>)
      : {};
  const source = content.et;
  if (!source?.trim()) return { ok: false as const, error: "NO_SOURCE" };

  // Translate all target languages in parallel to keep wall-clock time down
  const langs = targetLangs.filter((lang) => lang !== "et");
  const results = await Promise.all(
    langs.map(async (lang) => {
      try {
        return { lang, value: await translateHtml(source, lang) };
      } catch {
        return { lang, value: null };
      }
    })
  );

  const done: string[] = [];
  for (const { lang, value } of results) {
    if (value !== null) {
      content[lang] = value;
      done.push(lang);
    }
  }

  await db.page.upsert({
    where: { slug },
    create: { slug, content },
    update: { content },
  });
  revalidatePath("/", "layout");
  return { ok: true as const, translated: done, content };
}

/**
 * Translate an auction's Estonian title and description into EN/RU/LV/LT.
 * Returned to the client so the admin can review before saving; nothing is
 * persisted here (the form Save button does that).
 */
export async function autoTranslateAuctionFields(input: {
  title: string;
  description: string;
}) {
  await requireAdmin();
  const { translateHtml, translateStrings, translationAvailable } = await import(
    "@/lib/translate"
  );
  if (!translationAvailable()) {
    return { ok: false as const, error: "NO_API_KEY" };
  }
  if (!input.title.trim()) {
    return { ok: false as const, error: "NO_SOURCE" };
  }

  const langs = ["en", "ru", "lv", "lt"] as const;

  // Translate title + description for every language in parallel
  const results = await Promise.all(
    langs.map(async (lang) => {
      const title = await translateStrings({ t: input.title }, lang)
        .then((r) => r.t ?? input.title)
        .catch(() => input.title);
      const description = input.description.trim()
        ? await translateHtml(input.description, lang).catch(() => "")
        : "";
      return { lang, title, description };
    })
  );

  const titles: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  for (const r of results) {
    titles[r.lang] = r.title;
    descriptions[r.lang] = r.description;
  }

  return { ok: true as const, titles, descriptions };
}

/**
 * Translate admin-overridden Estonian UI strings into a target language.
 * Only keys that have an ET override but no value in the target language
 * are translated (file translations already cover the defaults).
 */
export async function autoTranslateUi(targetLang: string) {
  await requireAdmin();
  const { translateStrings, translationAvailable } = await import("@/lib/translate");
  if (!translationAvailable()) {
    return { ok: false as const, error: "NO_API_KEY" };
  }

  const [etRows, targetRows] = await Promise.all([
    db.translation.findMany({ where: { language: "et" } }),
    db.translation.findMany({ where: { language: targetLang } }),
  ]);
  const targetKeys = new Set(targetRows.map((row) => row.key));
  const missing: Record<string, string> = {};
  for (const row of etRows) {
    if (!targetKeys.has(row.key)) missing[row.key] = row.value;
  }
  if (Object.keys(missing).length === 0) {
    return { ok: true as const, translated: 0 };
  }

  const translated = await translateStrings(missing, targetLang);
  for (const [key, value] of Object.entries(translated)) {
    await db.translation.upsert({
      where: { key_language: { key, language: targetLang } },
      create: { key, language: targetLang, value },
      update: { value },
    });
  }
  revalidateTag("translations");
  revalidatePath("/", "layout");
  return { ok: true as const, translated: Object.keys(translated).length };
}

/* ------------------------------ Invoices ------------------------------ */

const invoiceLineSchema = z.object({
  description: z.string(),
  qty: z.number(),
  unit: z.string(),
  unitPrice: z.number(),
  vatRate: z.number(),
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  number: z.string().min(1),
  auctionId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  buyerName: z.string().min(1),
  buyerEmail: z.string().nullable().optional(),
  buyerPhone: z.string().nullable().optional(),
  buyerCompany: z.string().nullable().optional(),
  buyerRegCode: z.string().nullable().optional(),
  buyerAddress: z.string().nullable().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  lines: z.array(invoiceLineSchema),
  notes: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "UNPAID", "PAID", "CANCELLED"]),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

export async function saveInvoice(input: InvoiceInput) {
  const admin = await requireAdmin();
  const data = invoiceSchema.parse(input);

  const base = {
    number: data.number.trim(),
    auctionId: data.auctionId || null,
    userId: data.userId || null,
    buyerName: data.buyerName.trim(),
    buyerEmail: data.buyerEmail?.trim() || null,
    buyerPhone: data.buyerPhone?.trim() || null,
    buyerCompany: data.buyerCompany?.trim() || null,
    buyerRegCode: data.buyerRegCode?.trim() || null,
    buyerAddress: data.buyerAddress?.trim() || null,
    issueDate: new Date(data.issueDate),
    dueDate: new Date(data.dueDate),
    lines: data.lines.filter((l) => l.description.trim() !== ""),
    notes: data.notes?.trim() || null,
    status: data.status as InvoiceStatus,
  };

  try {
    if (data.id) {
      await db.invoice.update({ where: { id: data.id }, data: base });
    } else {
      await db.invoice.create({ data: { ...base, createdBy: admin.name ?? admin.email } });
    }
  } catch (error) {
    // Unique number collision
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false as const, error: "NUMBER_EXISTS" };
    }
    throw error;
  }

  revalidatePath("/admin/arved");
  return { ok: true as const };
}

export async function deleteInvoice(id: string) {
  await requireAdmin();
  await db.invoice.delete({ where: { id } });
  revalidatePath("/admin/arved");
  return { ok: true };
}
