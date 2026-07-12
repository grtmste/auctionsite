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
import type { AuctionStatus, AuctionType, PhoneBidStatus, Role } from "@prisma/client";

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
  reservePrice: z.number().positive().nullable().optional(),
  auctionStart: z.string(),
  auctionEnd: z.string(),
  phoneAuctionActive: z.boolean(),
  phoneAuctionEnd: z.string().nullable().optional(),
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
    reservePrice: data.reservePrice ?? null,
    auctionStart: new Date(data.auctionStart),
    auctionEnd: new Date(data.auctionEnd),
    phoneAuctionActive: data.phoneAuctionActive,
    phoneAuctionEnd: data.phoneAuctionEnd ? new Date(data.phoneAuctionEnd) : null,
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
  revalidatePath("/admin/telefonoksjon");
  return { ok: true };
}

export async function deletePhoneBid(id: string) {
  await requireAdmin();
  await db.phoneBid.delete({ where: { id } });
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
