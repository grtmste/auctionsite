import { db } from "@/lib/db";

/** Active VENDOR accounts, as options for the auction form's vendor select. */
export async function getVendorOptions(): Promise<{ id: string; label: string }[]> {
  const vendors = await db.user.findMany({
    where: { role: "VENDOR", disabled: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, company: true },
  });
  return vendors.map((v) => ({
    id: v.id,
    label: v.company ? `${v.company} (${v.name ?? v.email})` : v.name ?? v.email,
  }));
}
